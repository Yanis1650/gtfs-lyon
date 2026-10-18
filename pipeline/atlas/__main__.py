"""Point d'entrée : python -m atlas <étape>.

  telecharger    sources ouvertes (GTFS, Insee, OSM, communes)
  calculer       offre, tronçons, lignes et carreaux dans DuckDB
  accessibilite  temps de parcours r5py (dans le conteneur, Java 21)
  isochrones     temps par origine pour l'exploration au survol (étape facultative)
  exporter       couches GeoJSON pour la webmap
  tout           les quatre, dans l'ordre
"""

import argparse
import time

from . import calcul, export, gtfs, sources
from .config import SORTIE_WEB, Parametres

ETAPES = ["telecharger", "calculer", "accessibilite", "isochrones", "exporter", "tout"]


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="atlas", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("etape", choices=ETAPES)
    parser.add_argument("--forcer", action="store_true", help="retélécharger les sources")
    parser.add_argument("--echantillon", type=int, help="accessibilité sur les N premiers carreaux")
    args, _ = parser.parse_known_args()
    p = Parametres()
    debut = time.perf_counter()

    def fait(etape: str) -> bool:
        return args.etape in (etape, "tout")

    if fait("telecharger"):
        print("Téléchargement des sources")
        sources.tout_telecharger(args.forcer)

    if fait("calculer"):
        from . import accessibilite

        print(f"Calcul pour le {p.date_ref:%d/%m/%Y}")
        p.base.unlink(missing_ok=True)
        con = gtfs.connecter(p.base)
        gtfs.charger(con, p.gtfs_dir)
        calcul.calculer(con, p, osm=p.osm_pbf)
        print("  carreaux Insee")
        accessibilite.preparer_carreaux(con, p)
        con.close()

    if fait("accessibilite"):
        from . import accessibilite

        print("Accessibilité (r5py)")
        accessibilite.calculer(p, limite=args.echantillon)

    if fait("exporter"):
        print(f"Export vers {SORTIE_WEB}")
        con = gtfs.connecter(p.base)
        calcul.preparer_variables(con, p)
        export.exporter(con, p, SORTIE_WEB)
        con.close()

    if args.etape == "isochrones":
        from . import isochrones

        print("Isochrones interactives (r5py)")
        isochrones.calculer(p, SORTIE_WEB / "isochrones", limite=args.echantillon)

    print(f"Terminé en {time.perf_counter() - debut:.0f} s")


if __name__ == "__main__":
    main()
