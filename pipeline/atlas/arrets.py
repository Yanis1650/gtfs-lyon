"""Regroupement des quais en arrêts logiques.

Le GTFS décrit des quais physiques : « Bellecour » compte un quai par sens et par mode.
Pour la carte, on regroupe les quais de même nom qui sont proches, et ceux qui
partagent une même station mère.
"""

import math
import unicodedata

import duckdb

R_TERRE_M = 6_371_008.8


def normaliser(nom: str) -> str:
    sans_accents = unicodedata.normalize("NFKD", nom).encode("ascii", "ignore").decode()
    return " ".join(sans_accents.lower().replace("-", " ").replace("'", " ").split())


def distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R_TERRE_M * math.asin(math.sqrt(a))


class _Union:
    def __init__(self, n: int):
        self.parent = list(range(n))

    def trouver(self, i: int) -> int:
        while self.parent[i] != i:
            self.parent[i] = self.parent[self.parent[i]]
            i = self.parent[i]
        return i

    def unir(self, i: int, j: int) -> None:
        ri, rj = self.trouver(i), self.trouver(j)
        if ri != rj:
            self.parent[max(ri, rj)] = min(ri, rj)


def regrouper(quais: list[tuple[str, str, float, float, str | None]], rayon_m: float) -> dict[str, int]:
    """quais : (stop_id, nom, lat, lon, station_mère). Renvoie stop_id → indice du groupe."""
    u = _Union(len(quais))
    par_nom: dict[str, list[int]] = {}
    par_station: dict[str, int] = {}
    for i, (_, nom, _, _, station) in enumerate(quais):
        par_nom.setdefault(normaliser(nom), []).append(i)
        if station:
            if station in par_station:
                u.unir(i, par_station[station])
            else:
                par_station[station] = i
    for indices in par_nom.values():
        for a, i in enumerate(indices):
            for j in indices[a + 1 :]:
                if distance_m(quais[i][2], quais[i][3], quais[j][2], quais[j][3]) <= rayon_m:
                    u.unir(i, j)
    return {quais[i][0]: u.trouver(i) for i in range(len(quais))}


def construire(con: duckdb.DuckDBPyConnection, rayon_m: float) -> None:
    """Crée `arrets_quais` (stop_id → arret_id) et `arrets` (un point par arrêt logique)."""
    quais = con.sql(
        """
        select stop_id, stop_name, stop_lat::double, stop_lon::double, nullif(parent_station, '')
        from stops
        where coalesce(location_type, '0') in ('0', '')
        order by stop_id
        """
    ).fetchall()
    groupes = regrouper(quais, rayon_m)
    # Identifiant stable : le plus petit stop_id du groupe.
    representant: dict[int, str] = {}
    for stop_id, g in groupes.items():
        if g not in representant or stop_id < representant[g]:
            representant[g] = stop_id
    lignes = [(stop_id, f"a{representant[g]}") for stop_id, g in groupes.items()]
    con.sql("create or replace table arrets_quais (stop_id varchar, arret_id varchar)")
    con.executemany("insert into arrets_quais values (?, ?)", lignes)
    con.sql(
        """
        create or replace table arrets as
        select q.arret_id,
               mode(s.stop_name) as nom,
               avg(s.stop_lat::double) as lat,
               avg(s.stop_lon::double) as lon,
               count(*) as quais
        from arrets_quais q join stops s using (stop_id)
        group by q.arret_id
        """
    )
