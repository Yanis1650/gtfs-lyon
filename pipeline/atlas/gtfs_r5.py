"""Archive GTFS pour R5 : même périmètre d'agences que l'offre, sans tables vides."""

import csv
import io
import shutil
import zipfile
from itertools import chain
from pathlib import Path


def _lire(archive: zipfile.ZipFile, nom: str):
    if nom not in archive.namelist():
        return
    with archive.open(nom) as brut:
        yield from csv.DictReader(io.TextIOWrapper(brut, encoding="utf-8-sig", newline=""))


def preparer_gtfs_r5(source: Path, cible: Path, agences_exclues: tuple[str, ...] = ()) -> Path:
    """Retire aussi les références aux lignes et courses exclues, en lecture continue.

    Les arrêts, formes et calendriers non utilisés peuvent rester dans l'archive :
    ils ne créent aucun service. Les gros fichiers ne sont jamais chargés en mémoire.
    """
    with zipfile.ZipFile(source) as entree, zipfile.ZipFile(cible, "w", zipfile.ZIP_DEFLATED) as sortie:
        routes = {r["route_id"] for r in _lire(entree, "routes.txt")
                  if r.get("agency_id", "") in agences_exclues}
        courses = {r["trip_id"] for r in _lire(entree, "trips.txt") if r["route_id"] in routes}
        filtres = {
            "agency.txt": {"agency_id": set(agences_exclues)},
            "routes.txt": {"route_id": routes},
            "trips.txt": {"trip_id": courses},
            "stop_times.txt": {"trip_id": courses},
            "frequencies.txt": {"trip_id": courses},
            "fare_rules.txt": {"route_id": routes},
            "transfers.txt": {"from_route_id": routes, "to_route_id": routes,
                              "from_trip_id": courses, "to_trip_id": courses},
            "attributions.txt": {"agency_id": set(agences_exclues), "route_id": routes, "trip_id": courses},
        }
        for membre in entree.infolist():
            if membre.is_dir():
                continue
            filtre = filtres.get(membre.filename, {})
            if any(filtre.values()):
                with entree.open(membre) as brut:
                    lecteur = csv.DictReader(io.TextIOWrapper(brut, encoding="utf-8-sig", newline=""))
                    gardees = (r for r in lecteur if not any(r.get(c, "") in ids for c, ids in filtre.items()))
                    premiere = next(gardees, None)
                    if premiere is None:
                        continue
                    with sortie.open(membre.filename, "w") as flux, \
                            io.TextIOWrapper(flux, encoding="utf-8", newline="") as texte:
                        ecrivain = csv.DictWriter(texte, fieldnames=lecteur.fieldnames)
                        ecrivain.writeheader()
                        ecrivain.writerows(chain([premiere], gardees))
            else:
                # R5 refuse notamment frequencies.txt réduit à son en-tête.
                with entree.open(membre) as flux:
                    entete = flux.readline()
                    premiere = next((ligne for ligne in flux if ligne.strip()), None)
                    if premiere is None:
                        continue
                    with sortie.open(membre.filename, "w") as copie:
                        copie.write(entete)
                        copie.write(premiere)
                        shutil.copyfileobj(flux, copie)
    return cible
