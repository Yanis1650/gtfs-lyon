"""Chargement d'un flux GTFS dans DuckDB.

Tout est lu en texte puis converti explicitement : l'inférence de types de DuckDB
transformerait sinon des identifiants comme « 0012 » en entiers.
"""

from pathlib import Path

import duckdb

# Tables lues, et colonnes facultatives à créer vides si le flux ne les fournit pas.
TABLES = {
    "agency": [],
    "routes": ["route_color", "route_text_color", "route_long_name"],
    "trips": ["shape_id", "direction_id", "trip_headsign"],
    "stops": ["location_type", "parent_station"],
    "stop_times": ["shape_dist_traveled", "pickup_type"],
    "calendar": [],
    "calendar_dates": [],
    "shapes": ["shape_dist_traveled"],
}

COLONNES_CALENDAR = (
    "service_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday, start_date, end_date"
)


def connecter(base: Path | str = ":memory:") -> duckdb.DuckDBPyConnection:
    con = duckdb.connect(str(base))
    con.sql("install spatial; load spatial;")
    # « 25:10:00 » : les heures GTFS dépassent 24 h pour les courses d'après minuit.
    con.sql(
        """
        create or replace macro hms_en_s(t) as
            case when nullif(trim(t), '') is not null then
                split_part(t, ':', 1)::int * 3600
                + split_part(t, ':', 2)::int * 60
                + split_part(t, ':', 3)::int
            end
        """
    )
    con.sql(
        """
        create or replace macro mode_gtfs(rt) as case
            when rt = 1 or rt between 400 and 405 then 'metro'
            when rt = 0 or rt between 900 and 906 then 'tram'
            when rt = 11 or rt = 800 then 'trolleybus'
            when rt = 7 or rt = 1400 then 'funiculaire'
            when rt = 4 or rt in (1000, 1200) then 'navette_fluviale'
            when rt = 2 or rt between 100 and 117 then 'train'
            else 'bus'
        end
        """
    )
    return con


def _lire(con: duckdb.DuckDBPyConnection, fichier: Path) -> str:
    chemin = str(fichier).replace("'", "''")
    return f"read_csv('{chemin}', header = true, all_varchar = true, quote = '\"')"


def charger(con: duckdb.DuckDBPyConnection, dossier: Path) -> None:
    for table, facultatives in TABLES.items():
        fichier = dossier / f"{table}.txt"
        if not fichier.exists():
            if table == "calendar":
                # Un flux peut ne décrire son calendrier que par calendar_dates.
                colonnes = ", ".join(f"null::varchar as {c.strip()}" for c in COLONNES_CALENDAR.split(","))
                con.sql(f"create or replace table calendar as select {colonnes} limit 0")
                continue
            raise FileNotFoundError(fichier)
        con.sql(f"create or replace table {table} as select * from {_lire(con, fichier)}")
        presentes = {r[0] for r in con.sql(f"select column_name from (describe {table})").fetchall()}
        for colonne in facultatives:
            if colonne not in presentes:
                con.sql(f"alter table {table} add column {colonne} varchar")
