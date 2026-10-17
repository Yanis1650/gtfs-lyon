"""Préparation des entrées de r5py (le calcul lui-même tourne dans le conteneur)."""

import zipfile

from atlas.accessibilite import gtfs_sans_tables_vides


def test_gtfs_pour_r5_ecarte_les_tables_reduites_a_leur_en_tete(tmp_path):
    source = tmp_path / "gtfs.zip"
    with zipfile.ZipFile(source, "w") as z:
        z.writestr("stops.txt", "stop_id,stop_name\nS1,Gare\n")
        z.writestr("frequencies.txt", "trip_id,start_time,end_time,headway_secs\n")
    with zipfile.ZipFile(gtfs_sans_tables_vides(source, tmp_path / "r5.zip")) as z:
        assert z.namelist() == ["stops.txt"]
        assert z.read("stops.txt") == b"stop_id,stop_name\nS1,Gare\n"
