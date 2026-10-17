"""Écriture des couches de la carte en GeoJSON (coordonnées arrondies au mètre)."""

import json
from datetime import datetime, timezone
from pathlib import Path

import duckdb

from .config import Parametres

DECIMALES = 5  # ≈ 1 m à la latitude de Lyon
# Au-delà, la vitesse d'un tronçon trahit un horaire incohérent (fin de ligne tassée).
VITESSE_PLAUSIBLE_MAX = 80


def _arrondir(coords):
    if isinstance(coords[0], (int, float)):
        return [round(c, DECIMALES) for c in coords]
    return [_arrondir(c) for c in coords]


def _collection(con: duckdb.DuckDBPyConnection, sql: str) -> dict:
    """La requête renvoie une colonne `geojson` puis les propriétés."""
    resultat = con.sql(sql)
    noms = resultat.columns[1:]
    entites = []
    for geojson, *valeurs in resultat.fetchall():
        geometrie = json.loads(geojson)
        geometrie["coordinates"] = _arrondir(geometrie["coordinates"])
        entites.append({"type": "Feature", "geometry": geometrie, "properties": dict(zip(noms, valeurs))})
    return {"type": "FeatureCollection", "features": entites}


def _ecrire(chemin: Path, donnees: dict) -> None:
    chemin.write_text(json.dumps(donnees, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"  {chemin.name} : {chemin.stat().st_size / 1e6:.1f} Mo")


def exporter(con: duckdb.DuckDBPyConnection, p: Parametres, dossier: Path) -> None:
    dossier.mkdir(parents=True, exist_ok=True)

    _ecrire(
        dossier / "arrets.geojson",
        _collection(
            con,
            """
            select ST_AsGeoJSON(ST_Point(lon, lat)) as geojson,
                   arret_id as id, nom, departs, profil, route_ids as lignes, mode_principal as mode
            from arrets_offre
            order by departs
            """,
        ),
    )

    _ecrire(
        dossier / "troncons.geojson",
        _collection(
            con,
            f"""
            select ST_AsGeoJSON(geom) as geojson,
                   de, vers, courses,
                   case when vitesse_kmh <= {VITESSE_PLAUSIBLE_MAX} then round(vitesse_kmh, 1) end as vitesse,
                   mode, profil, route_ids as lignes
            from troncons_geo
            order by courses
            """,
        ),
    )

    _ecrire(
        dossier / "lignes.geojson",
        _collection(
            con,
            """
            with periodes as (
                select route_id, map(list(periode), list(round(vitesse_kmh, 1))) as vitesses
                from lignes_periodes group by route_id
            )
            select ST_AsGeoJSON(g.geom) as geojson,
                   l.route_id as id, l.ligne, l.nom, l.couleur, l.mode, l.courses,
                   round(l.vitesse_kmh, 1) as vitesse, l.longueur_km,
                   coalesce(p.vitesses, map()) as vitesses
            from lignes l
            join lignes_geo g using (route_id)
            left join periodes p using (route_id)
            order by l.mode, l.ligne
            """,
        ),
    )

    if p.accessibilite.exists():
        chemin = "'" + str(p.accessibilite).replace("'", "''") + "'"
        temps = ", ".join(f"a.t_{pole}" for pole in p.poles)
        _ecrire(
            dossier / "carreaux.geojson",
            _collection(
                con,
                f"""
                select ST_AsGeoJSON(ST_Transform(ST_MakeEnvelope(c.e, c.n, c.e + 200, c.n + 200),
                                                 'EPSG:3035', 'EPSG:4326', always_xy := true)) as geojson,
                       c.idcar as id, round(c.ind)::int as pop,
                       a.pop_tc30::int as pop_tc30, a.pop_tc45::int as pop_tc45,
                       a.pop_marche30::int as pop_marche30, {temps}
                from carreaux c join read_parquet({chemin}) a using (idcar)
                """,
            ),
        )

    par_mode = con.sql(
        """
        select mode, count(*) as lignes, sum(courses) as courses,
               round(sum(km_cumules) / sum(km_cumules / vitesse_kmh), 1) as vitesse
        from lignes where vitesse_kmh > 0
        group by mode order by courses desc
        """
    ).fetchall()
    (nb_arrets, departs) = con.sql("select count(*), sum(departs) from arrets_offre").fetchone()
    (courses, km) = con.sql("select count(*), round(sum(km)) from courses_bilan").fetchone()
    _ecrire(
        dossier / "meta.json",
        {
            "date_reference": p.date_ref.isoformat(),
            "heure_debut_service": p.heure_debut_service,
            "genere_le": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "arrets": nb_arrets,
            "departs": departs,
            "courses": courses,
            "km_commerciaux": km,
            "modes": [
                {"mode": m, "lignes": n, "courses": c, "vitesse": v} for m, n, c, v in par_mode
            ],
            "poles": [
                {"id": pole, "nom": nom, "lat": lat, "lon": lon}
                for pole, (nom, lat, lon) in p.poles.items()
            ],
            "accessibilite": {
                "heure_depart": p.heure_depart,
                "fenetre_min": p.fenetre_depart_min,
            },
            "sources": [
                {"nom": "Horaires théoriques GTFS du réseau TCL, SYTRAL Mobilités", "licence": "ODbL"},
                {"nom": "Insee, Filosofi 2021, carreaux de 200 m", "licence": "Licence Ouverte"},
                {"nom": "Contributeurs OpenStreetMap (tracés, réseau piéton, fond)", "licence": "ODbL"},
            ],
        },
    )
