"""Teste l'accès au flux SIRI Lite des positions TCL (data.grandlyon.com) et en décrit le contenu.

Lit GRANDLYON_IDENTIFIANT et GRANDLYON_MOT_DE_PASSE dans le fichier .env à la racine du dépôt
(voir .env.exemple), ou dans l'environnement. N'affiche jamais les identifiants.
Enregistre la réponse brute dans data/raw/siri/ (ignoré par git), pour étudier la structure.

    pipeline/.venv/Scripts/python -I outils/tester_siri.py
"""

import base64
import gzip
import json
import os
import sys
import time
import urllib.error
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

RACINE = Path(__file__).resolve().parents[1]
URL = "https://data.grandlyon.com/siri-lite/2.0/vehicle-monitoring.json"
SORTIE = RACINE / "data" / "raw" / "siri" / "vehicle-monitoring.json"


def identifiants() -> tuple[str, str]:
    valeurs = dict(os.environ)
    fichier = RACINE / ".env"
    if fichier.exists():
        # utf-8-sig : le Bloc-notes peut ajouter une marque d'ordre en tête de fichier.
        for ligne in fichier.read_text(encoding="utf-8-sig").splitlines():
            cle, egal, valeur = ligne.partition("=")
            if egal and not cle.strip().startswith("#"):
                valeurs.setdefault(cle.strip(), valeur.strip().strip("\"'"))
    login, mdp = valeurs.get("GRANDLYON_IDENTIFIANT", ""), valeurs.get("GRANDLYON_MOT_DE_PASSE", "")
    if not (login and mdp):
        sys.exit("Identifiants absents : copiez .env.exemple en .env et remplissez-le.")
    return login, mdp


def telecharger(login: str, mdp: str) -> bytes:
    jeton = base64.b64encode(f"{login}:{mdp}".encode()).decode()
    requete = urllib.request.Request(
        URL,
        headers={
            "Authorization": f"Basic {jeton}",
            "Accept-Encoding": "gzip",
            "User-Agent": "atlas-lyon (github.com/Yanis1650/gtfs-lyon)",
        },
    )
    debut = time.perf_counter()
    try:
        with urllib.request.urlopen(requete, timeout=60) as reponse:
            corps = reponse.read()
            if reponse.headers.get("Content-Encoding") == "gzip":
                print(f"Reçu {len(corps) / 1e6:.2f} Mo compressés", end=", ")
                corps = gzip.decompress(corps)
    except urllib.error.HTTPError as e:
        motifs = {
            401: "accès refusé. Soit le mot de passe n'est pas celui propre à la plateforme Data (à définir "
            "par « mot de passe oublié », distinct de GrandLyon Connect), soit le compte n'a pas encore "
            "l'accès au jeu de données temps réel TCL. Ne relancez pas en boucle : le compte peut se bloquer.",
            403: "compte reconnu mais accès refusé : demandez l'accès au jeu de données temps réel TCL "
            "depuis sa fiche sur data.grandlyon.com.",
        }
        sys.exit(f"HTTP {e.code} : {motifs.get(e.code, e.reason)}")
    print(f"{len(corps) / 1e6:.2f} Mo de JSON en {time.perf_counter() - debut:.1f} s")
    return corps


def chercher(objet, cle):
    """Première valeur de `cle` trouvée en profondeur (la structure SIRI varie d'un producteur à l'autre)."""
    if isinstance(objet, dict):
        if cle in objet:
            return objet[cle]
        objet = list(objet.values())
    if isinstance(objet, list):
        for valeur in objet:
            trouve = chercher(valeur, cle)
            if trouve is not None:
                return trouve
    return None


def schema(objet, prefixe="", lignes=None):
    """Chemins des champs d'un véhicule, avec un exemple de valeur."""
    lignes = [] if lignes is None else lignes
    if isinstance(objet, dict):
        for cle, valeur in objet.items():
            schema(valeur, f"{prefixe}.{cle}" if prefixe else cle, lignes)
    elif isinstance(objet, list) and objet:
        schema(objet[0], f"{prefixe}[]", lignes)
    else:
        lignes.append(f"  {prefixe} = {str(objet)[:60]!r}")
    return lignes


def valeur(v):
    """SIRI Lite enveloppe souvent les références : {"value": "..."}."""
    return v.get("value") if isinstance(v, dict) else v


def main() -> None:
    corps = telecharger(*identifiants())
    SORTIE.parent.mkdir(parents=True, exist_ok=True)
    SORTIE.write_bytes(corps)
    print(f"Réponse enregistrée : {SORTIE.relative_to(RACINE)}")

    donnees = json.loads(corps)
    vehicules = chercher(donnees, "VehicleActivity") or []
    print(f"\n{len(vehicules)} véhicules dans la réponse")
    if not vehicules:
        print("Aucun véhicule : voir la réponse enregistrée pour la structure.")
        return

    trajets = [v.get("MonitoredVehicleJourney", {}) for v in vehicules]
    lignes = Counter(str(valeur(t.get("LineRef"))) for t in trajets)
    print(f"{len(lignes)} lignes ; les plus présentes : {lignes.most_common(12)}")
    situes = sum(1 for t in trajets if (t.get("VehicleLocation") or {}).get("Latitude") is not None)
    print(f"{situes} véhicules avec une position")

    heures = sorted(v["RecordedAtTime"] for v in vehicules if v.get("RecordedAtTime"))
    if heures:
        maintenant = datetime.now(timezone.utc)
        ages = [(maintenant - datetime.fromisoformat(h.replace("Z", "+00:00"))).total_seconds() for h in heures]
        print(f"Âge des positions : de {min(ages):.0f} s à {max(ages):.0f} s (médiane {sorted(ages)[len(ages) // 2]:.0f} s)")

    print("\nChamps du premier véhicule :")
    print("\n".join(schema(vehicules[0])))


if __name__ == "__main__":
    main()
