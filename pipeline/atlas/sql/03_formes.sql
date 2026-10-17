-- Tracé de chaque forme GTFS utilisée ce jour-là, en Lambert-93 pour mesurer en mètres.
-- Les tracés absents du flux sont ajoutés ensuite par atlas/traces.py.
create or replace table formes as
select shape_id,
       ST_Transform(
           ST_MakeLine(list(ST_Point(shape_pt_lon::double, shape_pt_lat::double)
                            order by shape_pt_sequence::int)),
           'EPSG:4326', 'EPSG:2154', always_xy := true) as geom,
       max(try_cast(nullif(shape_dist_traveled, '') as double)) as km_total
from shapes
where shape_id in (select shape_id from courses where shape_id is not null)
group by shape_id;
