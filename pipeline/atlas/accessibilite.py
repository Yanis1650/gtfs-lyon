"""Accessibilité en transports en commun, carreau par carreau.

1. `preparer_carreaux` (DuckDB) : carreaux Insee de 200 m habités de la Métropole.
2. `calculer` (r5py, moteur R5 de Conveyal) : pour chaque carreau, la population
   joignable en 30 et 45 minutes en transports en commun et à pied, celle joignable
   à pied seulement, et le temps d'accès à quelques grands pôles. Départs entre 8 h
   et 9 h le jour de référence, durée médiane sur la fenêtre.

L'étape r5py tourne dans le conteneur `pipeline` (Java 21), voir le Dockerfile.
"""

import datetime as dt
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import duckdb

from .config import Parametres
from .gtfs_r5 import preparer_gtfs_r5

TAILLE_LOT = 200
FILS = max(1, (os.cpu_count() or 2) - 1)


def _chemin(p: Path) -> str:
    return "'" + str(p).replace("'", "''") + "'"


def preparer_carreaux(con: duckdb.DuckDBPyConnection, p: Parametres) -> None:
    """L'identifiant Inspire « CRS3035RES200mN2530000E3841600 » donne le coin
    sud-ouest du carreau en ETRS89-LAEA (EPSG:3035) : on en tire son centre."""
    con.execute(
        f"""
        create or replace table carreaux as
        with bruts as (
            select idcar_200m as idcar,
                   ind::double as ind,
                   men::double as men,
                   men_pauv::double as men_pauv,
                   ind_snv::double as ind_snv,
                   regexp_extract(idcar_200m, 'N(\\d+)E(\\d+)', ['n', 'e']) as coin
            from read_csv({_chemin(p.filosofi_csv)}, header = true, all_varchar = true)
            where lcog_geo like '69%'
        ),
        metropole as (
            select ST_Union_Agg(geom) as geom from ST_Read({_chemin(p.communes)})
        )
        select b.idcar, b.ind, b.men, b.men_pauv, b.ind_snv,
               b.coin.e::int as e, b.coin.n::int as n,
               ST_Transform(ST_Point(b.coin.e::int + 100, b.coin.n::int + 100),
                            'EPSG:3035', 'EPSG:4326', always_xy := true) as centre
        from bruts b, metropole m
        where b.ind > 0
          and ST_Intersects(m.geom,
                            ST_Transform(ST_Point(b.coin.e::int + 100, b.coin.n::int + 100),
                                         'EPSG:3035', 'EPSG:4326', always_xy := true));
        """
    )
    con.execute(
        f"""
        copy (select idcar, ind, e, n, ST_X(centre) as lon, ST_Y(centre) as lat from carreaux)
        to {_chemin(p.carreaux)} (format parquet)
        """
    )
    n, pop = con.sql("select count(*), round(sum(ind)) from carreaux").fetchone()
    print(f"  {n} carreaux habités, {pop:,.0f} habitants".replace(",", " "))


def calculer(p: Parametres, limite: int | None = None) -> None:
    """`limite` : ne traite que les N premiers carreaux, pour mesurer la durée du calcul."""
    # Importés ici : r5py, Java et numpy ne sont présents que dans le conteneur.
    import geopandas as gpd
    import pandas as pd
    from r5py import TransportMode, TransportNetwork, TravelTimeMatrix

    carreaux = pd.read_parquet(p.carreaux)
    if limite:
        carreaux = carreaux.head(limite)
    points = gpd.GeoDataFrame(
        {"id": carreaux["idcar"]},
        geometry=gpd.points_from_xy(carreaux["lon"], carreaux["lat"]),
        crs="EPSG:4326",
    )
    population = carreaux.set_index("idcar")["ind"]
    gtfs = preparer_gtfs_r5(p.gtfs_zip, p.base.parent / "gtfs_r5.zip", p.agences_exclues)
    print(f"  réseau R5 : {p.osm_pbf.name} + {gtfs.name}")
    reseau = TransportNetwork(p.osm_pbf, [gtfs])
    commun = dict(
        departure=dt.datetime.combine(p.date_ref, dt.time(p.heure_depart)),
        departure_time_window=dt.timedelta(minutes=p.fenetre_depart_min),
        percentiles=[50],
        speed_walking=3.6,
    )
    tc = [TransportMode.TRANSIT, TransportMode.WALK]

    resultats = pd.DataFrame(index=population.index)

    # Temps depuis chaque pôle vers tous les carreaux : six origines seulement.
    poles = gpd.GeoDataFrame(
        {"id": list(p.poles)},
        geometry=gpd.points_from_xy([lon for _, _, lon in p.poles.values()],
                                    [lat for _, lat, _ in p.poles.values()]),
        crs="EPSG:4326",
    )
    temps = TravelTimeMatrix(reseau, origins=poles, destinations=points, transport_modes=tc,
                             max_time=dt.timedelta(minutes=90), **commun)
    depuis_poles = temps.pivot(index="to_id", columns="from_id", values="travel_time")
    for pole in p.poles:
        resultats[f"t_{pole}"] = depuis_poles[pole]
    print("  temps depuis les pôles : fait")

    # Population joignable : carreaux vers carreaux. r5py traite les origines une à une ;
    # JPype rendant la main pendant les appels Java, on répartit les lots sur des threads.
    def lot_joignable(lot, modes, seuils):
        matrice = TravelTimeMatrix(reseau, origins=lot, destinations=points, transport_modes=modes,
                                   max_time=dt.timedelta(minutes=max(seuils)), **commun)
        matrice = matrice.dropna(subset=["travel_time"])
        matrice["pop"] = matrice["to_id"].map(population)
        return {s: matrice[matrice["travel_time"] <= s].groupby("from_id")["pop"].sum() for s in seuils}

    lots = [points.iloc[i : i + TAILLE_LOT] for i in range(0, len(points), TAILLE_LOT)]
    for modes, prefixe, seuils in ((tc, "pop_tc", p.seuils_min), ([TransportMode.WALK], "pop_marche", (30,))):
        cumuls = {s: [] for s in seuils}
        with ThreadPoolExecutor(max_workers=FILS) as executeur:
            taches = [executeur.submit(lot_joignable, lot, modes, seuils) for lot in lots]
            for fait, tache in enumerate(as_completed(taches), start=1):
                for s, serie in tache.result().items():
                    cumuls[s].append(serie)
                print(f"  {prefixe} : lot {fait}/{len(lots)}")
        for s in seuils:
            resultats[f"{prefixe}{s}"] = pd.concat(cumuls[s]).reindex(population.index).fillna(0).round()

    resultats.index.name = "idcar"
    resultats.reset_index().to_parquet(p.accessibilite, index=False)
    print(f"  écrit {p.accessibilite.name}")
