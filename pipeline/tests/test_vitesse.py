"""Vitesses commerciales sur le mini-réseau (voir conftest.py).

Tram : T1 et T2 font 2,4 km en 6 min (24 km/h), T7 en 12 min (12 km/h).
La vitesse de ligne vaut 7,2 km / 0,4 h = 18 km/h ; la moyenne des vitesses
donnerait 20 km/h, ce que ces tests refusent.
"""

import pytest


def test_vitesse_de_ligne_est_un_rapport_de_sommes(con):
    vitesses = dict(con.sql("select ligne, vitesse_kmh from lignes").fetchall())
    assert vitesses["T9"] == pytest.approx(18.0)
    assert vitesses["42"] == pytest.approx(6.0)


def test_vitesse_par_periode_selon_l_heure_de_depart(con):
    lignes = con.sql(
        """
        select periode, courses, vitesse_kmh from lignes_periodes
        where route_id = 'TRAM' order by periode
        """
    ).fetchall()
    # T2 part à 25 h 10 : hors des périodes définies.
    assert lignes == [
        ("pointe_matin", 1, pytest.approx(24.0)),
        ("pointe_soir", 1, pytest.approx(12.0)),
    ]


def test_troncons_orientes_avec_vitesse_ponderee(con):
    troncons = {
        (de, vers): (courses, vitesse)
        for de, vers, courses, vitesse in con.sql(
            "select de, vers, courses, vitesse_kmh from troncons"
        ).fetchall()
    }
    assert troncons[("aS1", "aS3")] == (3, pytest.approx(18.0))
    assert troncons[("aS3", "aS1")] == (1, pytest.approx(6.0))
    assert len(troncons) == 6


def test_geometrie_du_troncon_suit_le_trace_entre_les_deux_arrets(con):
    (x0, y0, x1, y1) = con.sql(
        """
        select ST_X(ST_StartPoint(geom)), ST_Y(ST_StartPoint(geom)),
               ST_X(ST_EndPoint(geom)), ST_Y(ST_EndPoint(geom))
        from troncons_geo where de = 'aS1' and vers = 'aS3'
        """
    ).fetchone()
    assert (x0, y0) == (pytest.approx(4.83, abs=1e-5), pytest.approx(45.76, abs=1e-5))
    assert (x1, y1) == (pytest.approx(4.83, abs=1e-5), pytest.approx(45.77, abs=1e-5))


def test_inter_arret_en_zero_minute_prend_la_vitesse_de_sa_fenetre(con):
    # N1 : S4 → S7 en 6 min (1 km), S7 → S8 affiché en 0 min (1 km).
    (vitesse,) = con.sql(
        "select vitesse_kmh from troncons where de = 'aS7' and vers = 'aS8'"
    ).fetchone()
    assert vitesse == pytest.approx(20.0, abs=0.2)
