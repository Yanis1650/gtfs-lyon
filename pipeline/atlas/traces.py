"""Reconstitution des tracés absents du GTFS (métro, tram, funiculaires, quelques bus).

Pour chaque suite d'arrêts sans tracé, on cherche parmi les relations OpenStreetMap
de la ligne celle qui passe au plus près des arrêts, et dans leur ordre. À défaut,
on relie les arrêts en ligne droite. Chaque arrêt reçoit alors sa position
kilométrique le long du tracé retenu, comme le ferait `shape_dist_traveled`.
"""

from dataclasses import dataclass
from pathlib import Path

import duckdb

from . import osm

# Écart moyen arrêt-tracé au-delà duquel une relation est jugée étrangère au parcours.
ECART_MAX_M = 120.0
# Part maximale d'arrêts rencontrés à rebours le long d'une relation acceptable.
INVERSIONS_MAX = 0.1


@dataclass(frozen=True)
class Choix:
    rel_id: int
    inverse: bool
    ecart_moyen_m: float


def choisir(candidats: dict[int, list[tuple[float, float]]]) -> Choix | None:
    """candidats : relation → [(fraction le long du tracé, distance en m)] dans l'ordre des arrêts.

    Retient la relation la plus proche des arrêts parmi celles qui les rencontrent
    dans l'ordre (éventuellement à rebours du sens de numérisation).
    """
    meilleur = None
    for rel_id, positions in candidats.items():
        if len(positions) < 2:
            continue
        fractions = [f for f, _ in positions]
        montees = sum(b > a for a, b in zip(fractions, fractions[1:]))
        descentes = sum(b < a for a, b in zip(fractions, fractions[1:]))
        inverse = descentes > montees
        inversions = min(montees, descentes) / (len(fractions) - 1)
        ecart = sum(d for _, d in positions) / len(positions)
        if inversions > INVERSIONS_MAX or ecart > ECART_MAX_M:
            continue
        if meilleur is None or ecart < meilleur.ecart_moyen_m:
            meilleur = Choix(rel_id, inverse, ecart)
    return meilleur


def positions_km(fractions: list[float], longueur_km: float, inverse: bool) -> list[float]:
    """Positions kilométriques des arrêts, rendues croissantes."""
    km, precedent = [], 0.0
    for f in fractions:
        valeur = (1 - f if inverse else f) * longueur_km
        precedent = max(precedent, valeur)
        km.append(precedent)
    return km


def completer(con: duckdb.DuckDBPyConnection, pbf: Path | None) -> None:
    """Donne un tracé et des positions kilométriques à toutes les courses qui n'en ont pas."""
    con.execute(
        """
        create or replace table motifs_sans_trace as
        with suites as (
            select trip_id, list(stop_id order by seq) as arrets
            from passages where shape_id is null or km is null
            group by trip_id
        )
        select row_number() over (order by c.route_id, s.arrets::varchar) as motif_id,
               c.route_id, c.ligne, s.arrets, list(s.trip_id) as trips
        from suites s join courses c using (trip_id)
        group by c.route_id, c.ligne, s.arrets;

        create or replace temp table motifs_arrets as
        select m.motif_id, a.rang - 1 as rang, a.stop_id,
               ST_Transform(ST_Point(s.stop_lon::double, s.stop_lat::double),
                            'EPSG:4326', 'EPSG:2154', always_xy := true) as pt
        from motifs_sans_trace m,
             unnest(m.arrets) with ordinality as a(stop_id, rang)
        join stops s on s.stop_id = a.stop_id;
        """
    )
    if pbf is not None and pbf.exists():
        osm.charger_relations(con, pbf)
    else:
        con.sql("create or replace temp table osm_lignes (rel_id bigint, ref varchar, geom geometry)")

    candidats: dict[int, dict[int, list[tuple[float, float]]]] = {}
    for motif_id, rel_id, f, d in con.sql(
        """
        select ma.motif_id, o.rel_id, ST_LineLocatePoint(o.geom, ma.pt), ST_Distance(o.geom, ma.pt)
        from motifs_arrets ma
        join motifs_sans_trace m using (motif_id)
        join osm_lignes o on o.ref = m.ligne
        order by ma.motif_id, o.rel_id, ma.rang
        """
    ).fetchall():
        candidats.setdefault(motif_id, {}).setdefault(rel_id, []).append((f, d))

    longueurs = dict(con.sql("select rel_id, ST_Length(geom) / 1000 from osm_lignes").fetchall())
    traces, kms = [], []
    for (motif_id,) in con.sql("select motif_id from motifs_sans_trace order by motif_id").fetchall():
        choix = choisir(candidats.get(motif_id, {}))
        if choix is None:
            traces.append((motif_id, f"arrets:{motif_id}", "arrets", None, None))
            continue
        shape_id = f"osm:{choix.rel_id}" + (":inverse" if choix.inverse else "")
        traces.append((motif_id, shape_id, "osm", choix.rel_id, round(choix.ecart_moyen_m, 1)))
        fractions = [f for f, _ in candidats[motif_id][choix.rel_id]]
        for rang, km in enumerate(positions_km(fractions, longueurs[choix.rel_id], choix.inverse)):
            kms.append((motif_id, rang, km))

    con.sql(
        """create or replace table traces_reconstitues
           (motif_id bigint, shape_id varchar, source varchar, rel_id bigint, ecart_moyen_m double)"""
    )
    con.sql("create or replace temp table motifs_km (motif_id bigint, rang int, km double)")
    if traces:
        con.executemany("insert into traces_reconstitues values (?, ?, ?, ?, ?)", traces)
    if kms:
        con.executemany("insert into motifs_km values (?, ?, ?)", kms)

    con.execute(
        """
        -- Tracés OSM retenus, retournés si la relation est numérisée à rebours.
        insert into formes
        select distinct t.shape_id,
               case when t.shape_id like '%:inverse' then ST_Reverse(o.geom) else o.geom end,
               ST_Length(o.geom) / 1000
        from traces_reconstitues t join osm_lignes o using (rel_id)
        where t.shape_id not in (select shape_id from formes);

        -- À défaut, la ligne brisée qui relie les arrêts.
        insert into formes
        select t.shape_id, ST_MakeLine(list(ma.pt order by ma.rang)) as geom, null
        from traces_reconstitues t join motifs_arrets ma using (motif_id)
        where t.source = 'arrets'
        group by t.shape_id;
        update formes set km_total = ST_Length(geom) / 1000 where km_total is null;

        insert into motifs_km
        select motif_id, rang, sum(pas_m) over (partition by motif_id order by rang) / 1000
        from (
            select ma.motif_id, ma.rang,
                   coalesce(ST_Distance(lag(ma.pt) over (partition by ma.motif_id order by ma.rang), ma.pt), 0)
                       as pas_m
            from motifs_arrets ma join traces_reconstitues t using (motif_id)
            where t.source = 'arrets'
        );

        create or replace temp table courses_motifs as
        select unnest(m.trips) as trip_id, m.motif_id, t.shape_id
        from motifs_sans_trace m join traces_reconstitues t using (motif_id);

        update courses set shape_id = cm.shape_id
        from courses_motifs cm where courses.trip_id = cm.trip_id;

        update passages set shape_id = r.shape_id, km = r.km
        from (
            select p.trip_id, p.seq, cm.shape_id, mk.km
            from (select trip_id, seq, row_number() over (partition by trip_id order by seq) - 1 as rang
                  from passages) p
            join courses_motifs cm using (trip_id)
            join motifs_km mk on mk.motif_id = cm.motif_id and mk.rang = p.rang
        ) r
        where passages.trip_id = r.trip_id and passages.seq = r.seq;
        """
    )
