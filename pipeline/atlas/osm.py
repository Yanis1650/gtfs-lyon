"""Lecture des relations « ligne » d'OpenStreetMap et assemblage de leur tracé.

DuckDB lit le fichier .pbf (ST_ReadOSM) ; les chemins de chaque relation sont
ensuite enchaînés, dans l'ordre de la relation, en une seule ligne.
"""

import math
from pathlib import Path

import duckdb

# Rôles des membres d'une relation qui décrivent la voie (les autres sont des arrêts).
ROLES_VOIE = ("", "forward", "backward")

def assembler(chemins: list[list[int]], coords: dict[int, tuple[float, float]]) -> list[int]:
    """Enchaîne les chemins (listes de nœuds) d'une relation en une seule suite de nœuds.

    Chaque chemin est retourné si besoin pour prolonger le précédent ; une
    discontinuité est franchie par le bout le plus proche.
    """
    chemins = [c for c in chemins if len(c) >= 2]
    if not chemins:
        return []
    premier = chemins[0]
    if len(chemins) > 1 and premier[0] in (chemins[1][0], chemins[1][-1]):
        premier = premier[::-1]
    suite = list(premier)
    for chemin in chemins[1:]:
        fin = suite[-1]
        if chemin[0] == fin:
            suite.extend(chemin[1:])
        elif chemin[-1] == fin:
            suite.extend(chemin[-2::-1])
        else:
            def ecart(n):
                (x0, y0), (x1, y1) = coords[fin], coords[n]
                return math.hypot(x1 - x0, y1 - y0)

            suite.extend(chemin if ecart(chemin[0]) <= ecart(chemin[-1]) else chemin[::-1])
    return suite


def charger_relations(con: duckdb.DuckDBPyConnection, pbf: Path) -> None:
    """Crée `osm_lignes(rel_id, ref, geom)` (Lambert-93) pour les lignes sans tracé."""
    source = "ST_ReadOSM('" + str(pbf).replace("'", "''") + "')"
    con.execute(
        f"""
        create or replace temp table osm_rel as
        select id as rel_id, tags['ref'] as ref, refs, ref_types, ref_roles
        from {source}
        where kind = 'relation' and tags['type'] = 'route'
          and tags['ref'] in (select distinct ligne from motifs_sans_trace);

        create or replace temp table osm_membres as
        select rel_id, ref, unnest(range(len(refs))) as pos, unnest(refs) as membre,
               unnest(ref_types) as type, unnest(ref_roles) as role
        from osm_rel;

        delete from osm_membres
        where type <> 'way' or not list_contains({list(ROLES_VOIE)}, coalesce(role, ''));

        create or replace temp table osm_chemins as
        select id, refs from {source}
        where kind = 'way' and id in (select membre from osm_membres);

        create or replace temp table osm_noeuds as
        select id, lon, lat from {source}
        where kind = 'node' and id in (select unnest(refs) from osm_chemins);
        """
    )
    coords = {i: (x, y) for i, x, y in con.sql("select id, lon, lat from osm_noeuds").fetchall()}
    chemins = dict(con.sql("select id, refs from osm_chemins").fetchall())
    relations: dict[int, tuple[str, list[list[int]]]] = {}
    for rel_id, ref, membre in con.sql("select rel_id, ref, membre from osm_membres order by rel_id, pos").fetchall():
        if membre in chemins:
            relations.setdefault(rel_id, (ref, []))[1].append(chemins[membre])
    lignes = []
    for rel_id, (ref, liste) in relations.items():
        noeuds = [n for n in assembler(liste, coords) if n in coords]
        if len(noeuds) >= 2:
            wkt = "LINESTRING(" + ", ".join(f"{coords[n][0]} {coords[n][1]}" for n in noeuds) + ")"
            lignes.append((rel_id, ref, wkt))
    con.sql("create or replace temp table osm_lignes (rel_id bigint, ref varchar, geom geometry)")
    if lignes:
        con.executemany(
            """insert into osm_lignes select ?, ?,
               ST_Transform(ST_GeomFromText(?), 'EPSG:4326', 'EPSG:2154', always_xy := true)""",
            lignes,
        )
