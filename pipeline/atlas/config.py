"""Paramètres de la chaîne : sources, jour de référence, chemins."""

import os
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path

# Dans le conteneur, le dépôt est monté ailleurs que le paquet installé.
RACINE = Path(os.environ.get("ATLAS_RACINE", Path(__file__).resolve().parents[2]))
DONNEES = RACINE / "data"
BRUTES = DONNEES / "raw"
SORTIE_WEB = RACINE / "web" / "public" / "data"

SOURCES = {
    # Flux GTFS du réseau TCL publié par SYTRAL Mobilités sur data.gouv.fr (licence ODbL).
    "gtfs_tcl": (
        "https://www.data.gouv.fr/api/1/datasets/r/abebedc6-28cf-4e2e-9c64-db57a40156f8",
        "gtfs_tcl.zip",
    ),
    # Revenus et population au carreau de 200 m, Insee Filosofi 2021.
    "insee_filosofi": (
        "https://www.insee.fr/fr/statistiques/fichier/8735162/Filosofi2021_carreaux_200m_csv.zip",
        "filosofi2021_200m_csv.zip",
    ),
    # Extrait OpenStreetMap de l'agglomération (réseau piéton pour r5py).
    "osm": ("https://download.bbbike.org/osm/bbbike/Lyon/Lyon.osm.pbf", "lyon.osm.pbf"),
    # Communes de la Métropole de Lyon (EPCI 200046977).
    "communes": (
        "https://geo.api.gouv.fr/epcis/200046977/communes"
        "?fields=nom,code,population&format=geojson&geometry=contour",
        "metropole_lyon_communes.geojson",
    ),
}


@dataclass(frozen=True)
class Parametres:
    gtfs_zip: Path = BRUTES / "gtfs_tcl" / "gtfs_tcl.zip"
    gtfs_dir: Path = BRUTES / "gtfs_tcl" / "extracted"
    osm_pbf: Path = BRUTES / "osm" / "lyon.osm.pbf"
    filosofi_csv: Path = BRUTES / "insee_filosofi" / "extracted" / "carreaux_200m_met.csv"
    communes: Path = BRUTES / "communes" / "metropole_lyon_communes.geojson"
    base: Path = DONNEES / "atlas.duckdb"
    carreaux: Path = DONNEES / "carreaux_metropole.parquet"
    accessibilite: Path = DONNEES / "accessibilite.parquet"
    # Départs entre 8 h et 9 h : on retient la durée médiane sur la fenêtre.
    heure_depart: int = 8
    fenetre_depart_min: int = 60
    seuils_min: tuple[int, ...] = (30, 45)
    # Destinations proposées dans la vue « temps d'accès » : id → (nom, latitude, longitude).
    poles: dict[str, tuple[str, float, float]] = field(
        default_factory=lambda: {
            "part_dieu": ("Gare Part-Dieu", 45.7606, 4.8596),
            "bellecour": ("Bellecour", 45.7578, 4.8322),
            "la_doua": ("Campus de la Doua", 45.7816, 4.8727),
            "grange_blanche": ("Hôpitaux de Grange Blanche", 45.7428, 4.8795),
            "confluence": ("Confluence", 45.7412, 4.8178),
            "la_soie": ("Vaulx-en-Velin La Soie", 45.7614, 4.9224),
        }
    )
    # Un mardi de période scolaire, sans jour férié ni vacances (zone A).
    date_ref: date = date(2026, 11, 17)
    # Les lignes scolaires « Junior Direct » ne relèvent pas de l'offre grand public.
    agences_exclues: tuple[str, ...] = ("TCL_JD",)
    # Deux quais de même nom à moins de cette distance forment un seul arrêt.
    rayon_fusion_m: float = 250.0
    # Le jour de service va de 4 h à 4 h le lendemain : 24 tranches horaires.
    heure_debut_service: int = 4
    periodes: dict[str, tuple[int, int]] = field(
        default_factory=lambda: {
            "pointe_matin": (7, 9),
            "creuse": (10, 16),
            "pointe_soir": (17, 19),
            "soiree": (20, 24),
        }
    )
