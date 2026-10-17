"""Offre du jour de référence sur le mini-réseau (voir conftest.py)."""


def _valeurs(con, sql):
    return con.sql(sql).fetchall()


def test_services_actifs_appliquent_ajouts_et_retraits(con):
    actifs = {r[0] for r in _valeurs(con, "select service_id from services_actifs")}
    assert actifs == {"SEM", "AJOUT"}


def test_courses_excluent_l_agence_scolaire(con):
    courses = {r[0] for r in _valeurs(con, "select trip_id from courses")}
    assert courses == {"T1", "T2", "T7", "T3", "T8"}


def test_quais_proches_forment_un_seul_arret(con):
    assert _valeurs(con, "select arret_id from arrets_quais where stop_id in ('S1', 'S2') group by 1") == [
        ("aS1",)
    ]
    mairies = _valeurs(con, "select count(distinct arret_id) from arrets_quais where stop_id in ('S4', 'S5')")
    assert mairies == [(2,)]


def test_departs_par_arret_sans_les_terminus(con):
    departs = dict(_valeurs(con, "select arret_id, departs from arrets_offre"))
    # aS1 : T1, T2, T7 (T3 y termine sans prendre de voyageurs).
    # aS3 : T1, T2, T7, T3.  aS4 : T3 et T8 (le tram y termine).  aS7 : T8.
    assert departs == {"aS1": 3, "aS3": 4, "aS4": 2, "aS7": 1}


def test_profil_horaire_commence_a_4h_et_range_les_heures_apres_minuit(con):
    (profil,) = con.sql("select profil from arrets_offre where arret_id = 'aS1'").fetchone()
    assert len(profil) == 24
    # 8 h → tranche 4 ; 18 h → tranche 14 ; 25 h 10 (1 h 10 du matin) → tranche 21.
    assert {i: n for i, n in enumerate(profil) if n} == {4: 1, 14: 1, 21: 1}


def test_mode_principal_retient_le_plus_capacitaire(con):
    modes = dict(_valeurs(con, "select arret_id, mode_principal from arrets_offre"))
    assert modes["aS3"] == "tram"
    assert modes["aS4"] == "bus"
