"""Couches GeoJSON écrites pour la carte, sur le mini-réseau (voir conftest.py)."""

import json
from dataclasses import replace

import pytest

from atlas import export


@pytest.fixture(scope="module")
def couches(con, parametres, tmp_path_factory):
    dossier = tmp_path_factory.mktemp("export")
    # Pas d'accessibilité calculée dans les tests : la couche des carreaux est omise.
    p = replace(parametres, accessibilite=dossier / "absent.parquet")
    export.exporter(con, p, dossier)
    # Les fichiers des véhicules, dans leur sous-dossier, ont leurs propres tests.
    return {f.stem: json.loads(f.read_text(encoding="utf-8")) for f in dossier.iterdir() if f.is_file()}


def test_couches_ecrites_sans_carreaux(couches):
    assert set(couches) == {"arrets", "troncons", "lignes", "meta"}


def test_arrets_portent_profil_et_lignes(couches):
    arrets = {f["properties"]["id"]: f for f in couches["arrets"]["features"]}
    assert set(arrets) == {"aS1", "aS3", "aS4", "aS7"}
    s3 = arrets["aS3"]
    assert s3["properties"]["departs"] == 4
    assert len(s3["properties"]["profil"]) == 24
    assert s3["properties"]["lignes"] == ["BUS", "TRAM"]
    assert s3["geometry"] == {"type": "Point", "coordinates": [4.83, 45.77]}


def test_coordonnees_arrondies_au_metre(couches):
    for f in couches["troncons"]["features"]:
        for x, y in f["geometry"]["coordinates"]:
            assert round(x, 5) == x and round(y, 5) == y


def test_meta_resume_le_jour(couches):
    meta = couches["meta"]
    assert meta["date_reference"] == "2026-11-17"
    assert meta["courses"] == 5
    assert {m["mode"] for m in meta["modes"]} == {"tram", "bus"}
    assert [p["id"] for p in meta["poles"]][0] == "part_dieu"


def test_vitesse_de_troncon_invraisemblable_non_publiee(con, parametres, tmp_path):
    # Un horaire « tassé » donne 300 km/h : la couche publie une valeur absente, pas un chiffre faux.
    con.execute("create or replace temp table sauvegarde as select * from troncons_geo")
    con.execute("update troncons_geo set vitesse_kmh = 300 where de = 'aS1' and vers = 'aS3'")
    try:
        export.exporter(con, replace(parametres, accessibilite=tmp_path / "absent.parquet"), tmp_path)
    finally:
        con.execute("create or replace table troncons_geo as select * from sauvegarde")
    troncons = json.loads((tmp_path / "troncons.geojson").read_text(encoding="utf-8"))["features"]
    vitesses = {(f["properties"]["de"], f["properties"]["vers"]): f["properties"]["vitesse"] for f in troncons}
    assert vitesses[("aS1", "aS3")] is None
    assert vitesses[("aS3", "aS1")] == 6.0
