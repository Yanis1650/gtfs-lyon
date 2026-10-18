"""Vérifie l'image nginx démarrée : gzip statique, contenu, cache et protections HTTP.

Usage : python outils/verifier_compression.py http://127.0.0.1:8080
Ce contrôle effectue quelques lectures, sans test de charge.
"""

import argparse
import gzip
import json
import re
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen


def lire(base, chemin, encodage="identity", methode="GET", **entetes):
    requete = Request(urljoin(base, chemin), method=methode,
                      headers={"Accept-Encoding": encodage, **entetes})
    try:
        reponse = urlopen(requete, timeout=15)
    except HTTPError as erreur:
        reponse = erreur
    with reponse:
        return reponse.status, reponse.headers, reponse.read()


def securite(entetes):
    for cle in ("Content-Security-Policy", "Strict-Transport-Security", "X-Frame-Options",
                "X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy"):
        assert entetes.get(cle), f"En-tête absent : {cle}"
    assert entetes["X-Content-Type-Options"] == "nosniff"


def verifier_fichier(base, chemin):
    statut, brut, original = lire(base, chemin)
    assert statut == 200, (chemin, statut)
    assert not brut.get("Content-Encoding"), chemin
    statut, compresse, corps = lire(base, chemin, "gzip")
    assert statut == 200 and compresse.get("Content-Encoding") == "gzip", chemin
    types = {"": {"text/html"}, "geojson": {"application/geo+json"}, "json": {"application/json"},
             "bin": {"application/octet-stream"}, "css": {"text/css"}, "txt": {"text/plain"},
             "svg": {"image/svg+xml"}, "xml": {"text/xml", "application/xml"},
             "js": {"application/javascript", "text/javascript"}}
    extension = chemin.rsplit(".", 1)[-1] if chemin else ""
    assert compresse.get_content_type() in types[extension], (chemin, compresse["Content-Type"])
    assert compresse.get_content_type() == brut.get_content_type(), chemin
    assert gzip.decompress(corps) == original, f"Octets différents : {chemin}"
    assert int(compresse["Content-Length"]) == len(corps), chemin
    assert brut["Last-Modified"] == compresse["Last-Modified"], chemin
    assert brut["ETag"] != compresse["ETag"], chemin
    attendu = "immutable" if chemin.startswith("assets/") else "no-cache"
    for entetes in (brut, compresse):
        securite(entetes)
        assert "accept-encoding" in entetes.get("Vary", "").lower(), chemin
        assert attendu in entetes.get("Cache-Control", ""), chemin
    statut, tete, vide = lire(base, chemin, "gzip", "HEAD")
    assert statut == 200 and not vide and tete["Content-Length"] == str(len(corps)), chemin
    assert tete.get("Content-Encoding") == "gzip", chemin
    for encodage, entetes in (("identity", brut), ("gzip", compresse)):
        for cle, valeur in (("If-None-Match", entetes["ETag"]), ("If-Modified-Since", entetes["Last-Modified"])):
            statut, cache, vide = lire(base, chemin, encodage, **{cle: valeur})
            assert statut == 304 and not vide, (chemin, cle, statut)
            securite(cache)
    return len(original), len(corps)


def verifier(base):
    limite = time.monotonic() + 15
    while True:
        try:
            statut, _, page = lire(base, "")
            assert statut == 200
            break
        except URLError:
            if time.monotonic() >= limite:
                raise
            time.sleep(.25)
    _, _, corps = lire(base, "data/isochrones/index.json")
    index = json.loads(corps)
    origines = sorted({0, len(index["ids"]) // 2, len(index["ids"]) - 1})
    chemins = ["", "robots.txt", "sitemap.xml", "favicon.svg", "data/isochrones/index.json"]
    chemins += ["data/" + nom + ".geojson" for nom in ("troncons", "arrets", "lignes", "carreaux")]
    chemins += ["data/isochrones/" + index["version"] + f"/{i}.bin" for i in origines]
    ressources = re.findall(r'(?:src|href)="\./(assets/[^"?]+\.(?:js|css))"', page.decode())
    assert len(ressources) >= 2, "JavaScript et CSS de production attendus"
    chemins += ressources
    tailles = [verifier_fichier(base, chemin) for chemin in chemins]
    for encodage in ("gzip;q=0, identity;q=1", "br"):
        statut, entetes, _ = lire(base, "data/troncons.geojson", encodage)
        assert statut == 200 and not entetes.get("Content-Encoding")
    statut, entetes, _ = lire(base, "data/troncons.geojson", "gzip", Via="1.1 verification")
    assert statut == 200 and entetes.get("Content-Encoding") == "gzip", "Relais HTTP"
    statut, entetes, _ = lire(base, "partage/lyon-sans-voiture.png", "gzip", "HEAD")
    assert statut == 200 and not entetes.get("Content-Encoding"), "PNG déjà compressé"
    for chemin, methode, attendu in (("inconnu", "GET", 404), (".env", "GET", 404),
                                     (".git/config", "GET", 404), ("package.json", "GET", 404),
                                     ("verification-mobile.html", "GET", 404), ("", "POST", 405)):
        statut, entetes, _ = lire(base, chemin, "gzip", methode)
        assert statut == attendu, (chemin, statut)
        securite(entetes)
    for i in origines:
        _, entetes, _ = lire(base, "data/isochrones/" + index["version"] + f"/{i}.bin", "gzip", "HEAD")
        assert entetes.get_content_type() == "application/octet-stream"
    print(f"{len(chemins)} fichiers vérifiés : octets, gzip/identity, HEAD, ETag/304, dates, cache et sécurité.")
    print(f"Échantillon : {sum(a for a, _ in tailles)} octets originaux ; {sum(b for _, b in tailles)} octets gzip.")


if __name__ == "__main__":
    analyseur = argparse.ArgumentParser(description=__doc__)
    analyseur.add_argument("base", help="Adresse de l'image nginx à vérifier")
    verifier(analyseur.parse_args().base.rstrip("/") + "/")
