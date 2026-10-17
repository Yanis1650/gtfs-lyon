-- Chaque arrêt desservi par chaque course du jour, rattaché à son arrêt logique.
create or replace table passages as
select st.trip_id,
       c.route_id,
       c.mode,
       c.shape_id,
       st.stop_id,
       q.arret_id,
       st.stop_sequence::int as seq,
       hms_en_s(st.arrival_time) as arr_s,
       hms_en_s(st.departure_time) as dep_s,
       try_cast(nullif(st.shape_dist_traveled, '') as double) as km,
       -- Au terminus, le véhicule dépose sans prendre : ce n'est pas un départ.
       coalesce(nullif(st.pickup_type, ''), '0') <> '1' as montee_possible
from stop_times st
join courses c using (trip_id)
join arrets_quais q using (stop_id);

-- Tranche horaire du jour de service : 0 = 4 h-5 h … 23 = 3 h-4 h le lendemain.
create or replace macro tranche(s) as
    least(greatest(s // 3600 - getvariable('heure_debut'), 0), 23)::int;
