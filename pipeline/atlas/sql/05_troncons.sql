-- Un tronçon relie deux arrêts logiques consécutifs d'une course.
create or replace table troncons_courses as
select * from (
    select trip_id,
           route_id,
           mode,
           shape_id,
           seq,
           arret_id as de,
           lead(arret_id) over w as vers,
           km as km_de,
           lead(km) over w as km_vers,
           dep_s as t_de,
           lead(arr_s) over w as t_vers
    from passages
    window w as (partition by trip_id order by seq)
)
where vers is not null and vers <> de;

-- Les horaires sont arrondis à la minute : sur un inter-arrêt de 150 m, le bus « met »
-- 0 ou 1 minute. La vitesse d'un tronçon se mesure donc sur une fenêtre glissante de
-- cinq inter-arrêts centrée sur lui, où l'arrondi (± 30 s) pèse peu.
create or replace table troncons_fenetres as
select *,
       sum(km_vers - km_de) over fenetre as km_fenetre,
       sum(t_vers - t_de) over fenetre as s_fenetre
from troncons_courses
where km_de is not null and km_vers is not null
window fenetre as (partition by trip_id order by seq rows between 2 preceding and 2 following);

-- Agrégation par couple d'arrêts, sens par sens.
-- La vitesse est un rapport de sommes (km cumulés / heures cumulées), pas une moyenne
-- de vitesses : chaque course pèse selon sa durée. Une course sans distance connue
-- n'entre ni au numérateur ni au dénominateur.
create or replace table troncons as
with vitesses as (
    select de, vers,
           sum(km_vers - km_de) as km_cumules,
           sum(km_fenetre) / nullif(sum(s_fenetre) / 3600.0, 0) as vitesse_kmh
    from troncons_fenetres
    group by de, vers
),
agg as (
    select de, vers,
           count(*) as courses,
           list_transform(range(24), i -> coalesce(histogram(tranche(t_de))[i], 0)) as profil,
           list(distinct route_id order by route_id) as route_ids,
           mode(mode) as mode
    from troncons_courses
    group by de, vers
),
usage_forme as (
    select de, vers, shape_id, km_de, km_vers, count(*) as n
    from troncons_courses
    where shape_id is not null and km_de is not null and km_vers > km_de
    group by all
),
forme as (
    -- Le tracé le plus emprunté entre les deux arrêts sert de géométrie.
    select de, vers, arg_max(struct_pack(shape_id, km_de, km_vers), n) as f
    from usage_forme
    group by de, vers
)
select a.*,
       v.km_cumules,
       v.vitesse_kmh,
       f.f.shape_id as shape_id,
       f.f.km_de as fkm_de,
       f.f.km_vers as fkm_vers
from agg a
left join vitesses v using (de, vers)
left join forme f using (de, vers);

create or replace table troncons_geo as
select t.*,
       ST_Transform(
           coalesce(
               case when fo.km_total > 0 then
                   ST_LineSubstring(fo.geom,
                                    greatest(least(t.fkm_de / fo.km_total, 1), 0),
                                    greatest(least(t.fkm_vers / fo.km_total, 1), 0))
               end,
               -- Sans tracé exploitable, on relie les deux arrêts en ligne droite.
               ST_Transform(ST_MakeLine(ST_Point(ad.lon, ad.lat), ST_Point(av.lon, av.lat)),
                            'EPSG:4326', 'EPSG:2154', always_xy := true)
           ),
           'EPSG:2154', 'EPSG:4326', always_xy := true) as geom
from troncons t
left join formes fo using (shape_id)
join arrets ad on ad.arret_id = t.de
join arrets av on av.arret_id = t.vers;
