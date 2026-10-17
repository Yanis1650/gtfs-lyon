"""Préparation des entrées de r5py (le calcul lui-même tourne dans le conteneur)."""

import csv
import io
import zipfile

from atlas.gtfs_r5 import preparer_gtfs_r5


def test_gtfs_pour_r5_ecarte_les_tables_reduites_a_leur_en_tete(tmp_path):
    source = tmp_path / "gtfs.zip"
    with zipfile.ZipFile(source, "w") as z:
        z.writestr("stops.txt", "stop_id,stop_name\nS1,Gare\n")
        z.writestr("frequencies.txt", "trip_id,start_time,end_time,headway_secs\n")
    with zipfile.ZipFile(preparer_gtfs_r5(source, tmp_path / "r5.zip")) as z:
        assert z.namelist() == ["stops.txt"]
        assert z.read("stops.txt") == b"stop_id,stop_name\nS1,Gare\n"


def test_gtfs_r5_exclut_les_scolaires_et_leurs_references(tmp_path):
    source = tmp_path / "source.zip"
    fichiers = {
        "agency.txt": "agency_id,agency_name\nPUBLIC,TCL\nTCL_JD,Scolaire\n",
        "routes.txt": "route_id,agency_id,route_long_name\nR,PUBLIC,\"Gare, centre\"\nJD,TCL_JD,École\n",
        "trips.txt": "trip_id,route_id\nT,R\nS,JD\n",
        "stop_times.txt": "trip_id,stop_id\nT,A\nS,A\nT,B\nS,B\n",
        "frequencies.txt": "trip_id,headway_secs\nS,600\n",
        "fare_rules.txt": "fare_id,route_id\nF,R\nF,JD\nF,\n",
        "transfers.txt": "from_stop_id,to_stop_id,from_route_id,to_trip_id\nA,B,R,\nA,B,JD,\nA,B,,S\n",
        "stops.txt": "stop_id,stop_name\nA,École\nB,Gare\n",
    }
    with zipfile.ZipFile(source, "w") as archive:
        for nom, contenu in fichiers.items():
            archive.writestr(nom, contenu.encode("utf-8-sig"))
    with zipfile.ZipFile(preparer_gtfs_r5(source, tmp_path / "r5.zip", ("TCL_JD",))) as archive:
        def lire(nom):
            return list(csv.DictReader(io.StringIO(archive.read(nom).decode("utf-8-sig"))))

        assert [r["agency_id"] for r in lire("agency.txt")] == ["PUBLIC"]
        assert lire("routes.txt") == [{"route_id": "R", "agency_id": "PUBLIC", "route_long_name": "Gare, centre"}]
        assert lire("trips.txt") == [{"trip_id": "T", "route_id": "R"}]
        assert [r["trip_id"] for r in lire("stop_times.txt")] == ["T", "T"]
        assert "frequencies.txt" not in archive.namelist()
        assert [r["route_id"] for r in lire("fare_rules.txt")] == ["R", ""]
        assert len(lire("transfers.txt")) == 1
        assert archive.read("stops.txt") == fichiers["stops.txt"].encode("utf-8-sig")


def test_gtfs_r5_ne_modifie_pas_les_services_sans_exclusion(tmp_path):
    source = tmp_path / "source.zip"
    contenu = b"route_id,agency_id\nJD,TCL_JD\n"
    with zipfile.ZipFile(source, "w") as archive:
        archive.writestr("routes.txt", contenu)
    with zipfile.ZipFile(preparer_gtfs_r5(source, tmp_path / "r5.zip")) as archive:
        assert archive.read("routes.txt") == contenu
