-- Bilan de chaque course : du premier départ à la dernière arrivée.
create or replace table courses_bilan as
select trip_id,
       route_id,
       arg_min(dep_s, seq) as debut_s,
       arg_max(arr_s, seq) as fin_s,
       arg_max(km, seq) - arg_min(km, seq) as km
from passages
group by trip_id, route_id;

-- Vitesse commerciale par ligne et par période (rapport de sommes, voir 05_troncons.sql).
-- La période d'une course est celle de son heure de départ ; une course sans distance
-- connue n'entre pas dans le calcul.
create or replace table lignes_periodes as
select b.route_id,
       p.nom as periode,
       count(*) as courses,
       sum(b.km) as km_cumules,
       sum(b.fin_s - b.debut_s) / 3600.0 as heures_cumulees,
       sum(b.km) / nullif(sum(b.fin_s - b.debut_s) / 3600.0, 0) as vitesse_kmh
from courses_bilan b
join periodes p on b.debut_s >= p.debut * 3600 and b.debut_s < p.fin * 3600
where b.km is not null
group by all;

create or replace table lignes as
select c.route_id,
       any_value(c.ligne) as ligne,
       any_value(c.nom_ligne) as nom,
       any_value(c.couleur) as couleur,
       any_value(c.mode) as mode,
       count(*) as courses,
       sum(b.km) as km_cumules,
       sum(b.km) / nullif(sum(b.fin_s - b.debut_s) filter (where b.km is not null) / 3600.0, 0)
           as vitesse_kmh,
       -- Longueur de la course la plus fréquente, pour situer la ligne.
       mode(round(b.km, 1)) as longueur_km
from courses c
join courses_bilan b using (trip_id, route_id)
group by c.route_id;

-- Tracé de la ligne : la forme la plus utilisée dans chaque sens, simplifiée à 5 m.
create or replace table lignes_geo as
with usage_forme as (
    select route_id, direction_id, shape_id, count(*) as n
    from courses
    where shape_id is not null
    group by all
),
retenues as (
    select route_id, direction_id, arg_max(shape_id, n) as shape_id
    from usage_forme
    group by all
)
select r.route_id,
       ST_Transform(
           ST_SimplifyPreserveTopology(ST_Collect(list(f.geom)), 5),
           'EPSG:2154', 'EPSG:4326', always_xy := true) as geom
from retenues r
join formes f using (shape_id)
group by r.route_id;
