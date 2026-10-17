-- Offre au départ de chaque arrêt logique : total du jour et profil heure par heure.
create or replace table arrets_offre as
with departs as (
    select arret_id, route_id, mode, tranche(dep_s) as t
    from passages
    where montee_possible
),
rang_mode as (
    select * from (values
        ('metro', 1), ('train', 2), ('tram', 3), ('funiculaire', 4),
        ('trolleybus', 5), ('bus', 6), ('navette_fluviale', 7)
    ) v(mode, rang)
)
select d.arret_id,
       a.nom,
       a.lat,
       a.lon,
       count(*) as departs,
       list_transform(range(24), i -> coalesce(histogram(d.t)[i], 0)) as profil,
       list(distinct d.route_id order by d.route_id) as route_ids,
       -- Le mode le plus capacitaire qui dessert l'arrêt sert à le symboliser.
       arg_min(d.mode, r.rang) as mode_principal
from departs d
join arrets a using (arret_id)
join rang_mode r using (mode)
group by d.arret_id, a.nom, a.lat, a.lon;
