"""Courses du jour de référence, heure par heure, pour animer les véhicules sur la carte.

Chaque fichier `vehicules/08h.json` décrit les courses en circulation entre 8 h et 9 h :
ligne, suite d'arrêts et heure de passage à chacun. La carte déplace ensuite chaque
véhicule le long des tronçons déjà publiés (troncons.geojson), d'un arrêt au suivant.

Les horaires du flux sont presque tous arrondis à la minute : trois arrêts de suite
peuvent porter la même heure. `lisser` répartit alors le temps selon la distance,
entre deux arrêts où l'heure change, pour que le véhicule avance sans à-coups.
"""

import json
from itertools import groupby
from pathlib import Path

import duckdb

from .config import Parametres


def lisser(distances: list[float], temps: list[int]) -> list[float]:
    """Heures de passage lissées. Les ancres sont les arrêts où l'heure change (et le premier) :
    elles gardent leur heure, et les arrêts intermédiaires reçoivent une heure proportionnelle
    à la distance parcourue entre deux ancres."""
    n = len(temps)
    lisses = [float(t) for t in temps]
    if n < 2:
        return lisses
    ancres = [i for i in range(n) if i == 0 or temps[i] > temps[i - 1]]
    for a, b in zip(ancres, ancres[1:]):
        for j in range(a + 1, b):
            part = _part(distances, a, b, j)
            lisses[j] = temps[a] + part * (temps[b] - temps[a])

    # Fin de course à heure égale : on prolonge au rythme du dernier intervalle connu.
    fin = ancres[-1]
    if fin < n - 1:
        if len(ancres) > 1:
            a = ancres[-2]
            duree, dist = temps[fin] - temps[a], distances[fin] - distances[a]
        else:
            duree, dist = 0, 0.0
        for j in range(fin + 1, n):
            if dist > 0 and distances[j] > distances[fin]:
                lisses[j] = temps[fin] + (distances[j] - distances[fin]) * duree / dist
            else:
                # Sans distance exploitable : une demi-minute par arrêt.
                lisses[j] = temps[fin] + 30.0 * (j - fin)
    return lisses


def _part(distances: list[float], a: int, b: int, j: int) -> float:
    """Avancement de l'arrêt j entre les ancres a et b : par la distance, sinon par le rang."""
    dd = distances[b] - distances[a]
    return (distances[j] - distances[a]) / dd if dd > 0 else (j - a) / (b - a)


def courses_du_jour(con: duckdb.DuckDBPyConnection) -> list[tuple[str, list[str], list[int]]]:
    """(ligne, arrêts, heures lissées en secondes) pour chaque course du jour de référence."""
    lignes = con.sql(
        """
        select trip_id, route_id, arret_id, km,
               -- Une seule heure par arrêt : le départ, et l'arrivée au terminus.
               case when lead(seq) over w is null then arr_s else dep_s end as t
        from passages
        window w as (partition by trip_id order by seq)
        order by trip_id, seq
        """
    ).fetchall()
    courses = []
    for _, groupe in groupby(lignes, key=lambda r: r[0]):
        passages = []
        for _, route, arret, km, t in groupe:
            # Un arrêt répété (boucle au terminus) ne fait pas avancer le véhicule.
            if passages and passages[-1][1] == arret:
                continue
            passages.append((route, arret, km or 0.0, t))
        if len(passages) < 2:
            continue
        heures = lisser([p[2] for p in passages], [p[3] for p in passages])
        courses.append((passages[0][0], [p[1] for p in passages], [round(h) for h in heures]))
    return courses


def en_circulation(courses: list[tuple[str, list[str], list[int]]], debut: int, fin: int) -> list:
    """Les courses qui circulent pendant [debut, fin), même parties plus tôt ou finies plus tard.
    Heures en écarts successifs : des nombres courts, que gzip compresse bien."""
    return [
        [route, arrets, heures[0], [b - a for a, b in zip(heures, heures[1:])]]
        for route, arrets, heures in courses
        if heures[0] < fin and heures[-1] >= debut
    ]


def exporter(con: duckdb.DuckDBPyConnection, p: Parametres, dossier: Path) -> None:
    """Un fichier par tranche horaire du jour de service, nommé d'après l'heure de début."""
    dossier.mkdir(parents=True, exist_ok=True)
    courses = courses_du_jour(con)
    total = 0
    for i in range(24):
        debut = (p.heure_debut_service + i) * 3600
        chemin = dossier / f"{(p.heure_debut_service + i) % 24:02d}h.json"
        contenu = {"debut": debut, "courses": en_circulation(courses, debut, debut + 3600)}
        texte = json.dumps(contenu, separators=(",", ":"))
        chemin.write_text(texte, encoding="utf-8")
        total += chemin.stat().st_size
    print(f"  vehicules/ : 24 fichiers, {total / 1e6:.1f} Mo, {len(courses)} courses")
