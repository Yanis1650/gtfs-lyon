-- Services actifs le jour de référence :
-- calendrier hebdomadaire valide ce jour-là, plus les ajouts, moins les retraits.
create or replace table services_actifs as
with jour as (
    select getvariable('date_ref')::date as d,
           strftime(getvariable('date_ref')::date, '%Y%m%d') as j
)
select service_id from (
    select c.service_id
    from calendar c, jour
    where jour.j between c.start_date and c.end_date
      and case isodow(jour.d)
            when 1 then c.monday    when 2 then c.tuesday  when 3 then c.wednesday
            when 4 then c.thursday  when 5 then c.friday   when 6 then c.saturday
            else c.sunday
          end = '1'
    union
    select cd.service_id
    from calendar_dates cd, jour
    where cd.date = jour.j and cd.exception_type = '1'
)
except
select cd.service_id
from calendar_dates cd, jour
where cd.date = jour.j and cd.exception_type = '2';

-- Courses du jour, hors agences exclues (lignes scolaires).
create or replace table courses as
select t.trip_id,
       t.route_id,
       nullif(t.shape_id, '') as shape_id,
       coalesce(nullif(t.direction_id, ''), '0') as direction_id,
       r.route_short_name as ligne,
       r.route_long_name as nom_ligne,
       '#' || upper(coalesce(nullif(r.route_color, ''), '7A7A7A')) as couleur,
       mode_gtfs(r.route_type::int) as mode
from trips t
join services_actifs using (service_id)
join routes r using (route_id)
where not list_contains(getvariable('agences_exclues'), coalesce(r.agency_id, ''));
