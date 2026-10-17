"""Un mini-réseau GTFS dont tous les résultats se calculent à la main.

    S1/S2 « Gare Centrale » (deux quais à 20 m) ── S3 « Place Haute » ── S4 « Mairie »
    S5 « Mairie » : homonyme à 13 km, à ne pas fusionner avec S4.
    S6 « École » : desservi seulement par une ligne scolaire exclue.
    S7 « Bout du Monde », S8 « Fin du Monde » : 1 km puis 2 km à l'est de S4,
    desservis par la ligne N1, sans tracé ni distances ; S7 → S8 affiché en « 0 minute ».

Jour de référence : mardi 17 novembre 2026.
"""

from datetime import date
from pathlib import Path

import pytest

from atlas import calcul, gtfs
from atlas.config import Parametres

FICHIERS = {
    "agency.txt": """agency_id,agency_name,agency_url,agency_timezone
A1,Réseau test,https://example.org,Europe/Paris
TCL_JD,Scolaire,https://example.org,Europe/Paris
""",
    "routes.txt": """route_id,agency_id,route_short_name,route_long_name,route_type,route_color
TRAM,A1,T9,Gare Centrale - Mairie,0,aa0000
BUS,A1,42,Mairie - Gare Centrale,3,
JD,TCL_JD,JD1,École - Gare Centrale,700,17297B
N1,A1,N1,Mairie - Bout du Monde,3,
""",
    "calendar.txt": """service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date
SEM,1,1,1,1,1,0,0,20261101,20261130
SEM_RETIRE,1,1,1,1,1,0,0,20261101,20261130
DIM,0,0,0,0,0,0,1,20261101,20261130
""",
    "calendar_dates.txt": """service_id,date,exception_type
SEM_RETIRE,20261117,2
AJOUT,20261117,1
""",
    "stops.txt": """stop_id,stop_name,stop_lat,stop_lon,location_type,parent_station
S1,Gare Centrale,45.7600,4.8300,0,
S2,Gare Centrale,45.7601,4.8302,0,
S3,Place Haute,45.7700,4.8300,0,
S4,Mairie,45.7800,4.8300,0,
S5,Mairie,45.9000,4.8300,0,
S6,École,45.7500,4.8300,0,
S7,Bout du Monde,45.7800,4.8429,0,
S8,Fin du Monde,45.7800,4.8558,0,
""",
    "trips.txt": """route_id,service_id,trip_id,shape_id,direction_id
TRAM,SEM,T1,SH1,0
TRAM,SEM,T2,SH1,0
TRAM,SEM,T7,SH1,0
BUS,AJOUT,T3,SH2,1
BUS,SEM_RETIRE,T4,SH2,1
BUS,DIM,T5,SH2,1
JD,SEM,T6,,0
N1,SEM,T8,,0
""",
    "stop_times.txt": """trip_id,arrival_time,departure_time,stop_id,stop_sequence,pickup_type,shape_dist_traveled
T1,08:00:00,08:00:00,S1,1,0,0
T1,08:03:00,08:03:00,S3,2,0,1.2
T1,08:06:00,08:06:00,S4,3,1,2.4
T2,25:10:00,25:10:00,S2,1,0,0
T2,25:13:00,25:13:00,S3,2,0,1.2
T2,25:16:00,25:16:00,S4,3,1,2.4
T7,18:00:00,18:00:00,S1,1,0,0
T7,18:06:00,18:06:00,S3,2,0,1.2
T7,18:12:00,18:12:00,S4,3,1,2.4
T3,12:00:00,12:00:00,S4,1,0,0
T3,12:10:00,12:10:00,S3,2,0,1.0
T3,12:20:00,12:20:00,S1,3,1,2.0
T4,09:00:00,09:00:00,S1,1,0,0
T4,09:05:00,09:05:00,S3,2,1,1.0
T5,10:00:00,10:00:00,S1,1,0,0
T5,10:05:00,10:05:00,S3,2,1,1.0
T6,07:30:00,07:30:00,S6,1,0,0
T6,07:40:00,07:40:00,S1,2,1,1.1
T8,14:00:00,14:00:00,S4,1,0,
T8,14:06:00,14:06:00,S7,2,0,
T8,14:06:00,14:06:00,S8,3,1,
""",
    "shapes.txt": """shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,shape_dist_traveled
SH1,45.7600,4.8300,1,0
SH1,45.7700,4.8300,2,1.2
SH1,45.7800,4.8300,3,2.4
SH2,45.7800,4.8300,1,0
SH2,45.7700,4.8300,2,1.0
SH2,45.7600,4.8300,3,2.0
""",
}


@pytest.fixture(scope="session")
def dossier_gtfs(tmp_path_factory) -> Path:
    dossier = tmp_path_factory.mktemp("mini_gtfs")
    for nom, contenu in FICHIERS.items():
        (dossier / nom).write_text(contenu, encoding="utf-8")
    return dossier


@pytest.fixture(scope="session")
def parametres() -> Parametres:
    return Parametres(date_ref=date(2026, 11, 17))


@pytest.fixture(scope="session")
def con(dossier_gtfs, parametres):
    connexion = gtfs.connecter()
    gtfs.charger(connexion, dossier_gtfs)
    calcul.calculer(connexion, parametres)
    yield connexion
    connexion.close()
