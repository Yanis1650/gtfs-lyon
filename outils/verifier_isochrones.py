"""Intégrité du jeu statique d'isochrones, sans recalcul R5 ni dépendance Python externe."""

import argparse
import hashlib
import json
import re
from pathlib import Path

RACINE = Path(__file__).resolve().parents[1]


def verifier(racine: Path = RACINE) -> dict:
    dossier = racine / "web/public/data/isochrones"
    index = json.loads((dossier / "index.json").read_text(encoding="utf-8"))
    assert index["format"] == "r5-median-u8-v1"
    assert re.fullmatch(r"[a-f0-9]{16}", index["version"])
    ids = index["ids"]
    assert ids and len(ids) == len(set(ids))
    assert index["maximum"] == 45 and index["marche_kmh"] == 3.6
    assert 0 <= index["heure"] <= 23 and 1 <= index["fenetre"] <= 120
    meta = json.loads((racine / "web/public/data/meta.json").read_text(encoding="utf-8"))
    assert index["date"] == meta["date_reference"]
    assert index["heure"] == meta["accessibilite"]["heure_depart"]
    assert index["fenetre"] == meta["accessibilite"]["fenetre_min"]
    carreaux = json.loads((racine / "web/public/data/carreaux.geojson").read_text(encoding="utf-8"))
    assert set(ids) == {c["properties"]["id"] for c in carreaux["features"]}
    version = dossier / index["version"]
    assert {p.name for p in version.iterdir()} == {f"{i}.bin" for i in range(len(ids))}
    empreinte = hashlib.sha256()
    autorises = set(range(46)) | {255}
    for i in range(len(ids)):
        temps = (version / f"{i}.bin").read_bytes()
        assert len(temps) == len(ids), f"Ligne {i} incomplète"
        assert set(temps) <= autorises, f"Durée invalide dans la ligne {i}"
        assert temps[i] == 0, f"Le trajet vers soi doit être nul : {i}"
        empreinte.update(temps)
    return {"version": index["version"], "date_reference": index["date"],
            "origines": len(ids), "destinations": len(ids), "octets": len(ids) ** 2,
            "sha256_matrice": empreinte.hexdigest(), "controle": "Identifiants, dimensions, seuils et diagonale valides."}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--rapport", type=Path)
    args = parser.parse_args()
    rapport = verifier()
    if args.rapport:
        args.rapport.write_text(json.dumps(rapport, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Isochrones valides : {rapport['origines']} origines × {rapport['destinations']} destinations.")
