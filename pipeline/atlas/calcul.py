"""Enchaînement des requêtes SQL qui produisent l'offre, les tronçons et les lignes."""

from importlib import resources
from pathlib import Path

import duckdb

from . import arrets, traces
from .config import Parametres

ETAPES_AVANT_TRACES = ("01_courses.sql", "02_passages.sql", "03_formes.sql")
ETAPES_APRES_TRACES = ("04_arrets_offre.sql", "05_troncons.sql", "06_lignes.sql")


def _sql(nom: str) -> str:
    return resources.files("atlas").joinpath("sql", nom).read_text(encoding="utf-8")


def _litteral(texte: str) -> str:
    return "'" + texte.replace("'", "''") + "'"


def preparer_variables(con: duckdb.DuckDBPyConnection, p: Parametres) -> None:
    # SET VARIABLE n'accepte pas de paramètre lié : on écrit des littéraux échappés.
    con.execute(f"set variable date_ref = date {_litteral(p.date_ref.isoformat())}")
    agences = ", ".join(_litteral(a) for a in p.agences_exclues)
    con.execute(f"set variable agences_exclues = [{agences}]::varchar[]")
    con.execute(f"set variable heure_debut = {int(p.heure_debut_service)}")
    con.sql("create or replace table periodes (nom varchar, debut int, fin int)")
    con.executemany(
        "insert into periodes values (?, ?, ?)",
        [(nom, debut, fin) for nom, (debut, fin) in p.periodes.items()],
    )


def calculer(con: duckdb.DuckDBPyConnection, p: Parametres, osm: Path | None = None) -> None:
    preparer_variables(con, p)
    arrets.construire(con, p.rayon_fusion_m)
    for etape in ETAPES_AVANT_TRACES:
        print(f"  {etape}")
        con.execute(_sql(etape))
    print("  tracés manquants")
    traces.completer(con, osm)
    for etape in ETAPES_APRES_TRACES:
        print(f"  {etape}")
        con.execute(_sql(etape))
