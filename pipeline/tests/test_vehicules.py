"""Courses heure par heure pour l'animation des véhicules, sur le mini-réseau (voir conftest.py)."""

import json

import pytest

from atlas import vehicules


def test_lisser_repartit_une_minute_selon_la_distance():
    # Trois arrêts affichés à la même minute : le temps se répartit selon la distance
    # jusqu'au prochain arrêt où l'heure change.
    assert vehicules.lisser([0, 100, 200, 300, 400], [0, 60, 60, 60, 120]) == [0, 60, 80, 100, 120]


def test_lisser_garde_les_horaires_a_la_seconde():
    assert vehicules.lisser([0, 0.4, 1.5], [0, 47, 131]) == [0, 47, 131]


def test_lisser_prolonge_une_fin_de_course_a_heure_egale():
    # Dernier intervalle connu : 600 m en 60 s. Les 300 m suivants prennent 30 s.
    assert vehicules.lisser([0, 600, 900], [0, 60, 60]) == [0, 60, 90]


def test_lisser_sans_distances_avance_par_le_rang():
    assert vehicules.lisser([0, 0, 0, 0], [0, 60, 60, 120]) == [0, 60, 90, 120]
    assert vehicules.lisser([0, 0, 0], [0, 360, 360]) == [0, 360, 390]


def test_lisser_ne_recule_jamais():
    heures = vehicules.lisser([0, 50, 50, 300, 320, 900, 950], [0, 0, 60, 60, 60, 120, 120])
    assert heures == sorted(heures)


def test_en_circulation_retient_les_courses_qui_chevauchent_l_heure():
    courses = [
        ("A", ["x", "y"], [7 * 3600 + 3000, 8 * 3600 + 120]),  # partie avant 8 h
        ("B", ["x", "y"], [8 * 3600 + 3540, 9 * 3600 + 60]),  # finit après 9 h
        ("C", ["x", "y"], [9 * 3600, 9 * 3600 + 60]),  # part à 9 h pile
        ("D", ["x", "y"], [7 * 3600, 7 * 3600 + 600]),  # finie avant 8 h
    ]
    retenues = vehicules.en_circulation(courses, 8 * 3600, 9 * 3600)
    assert [c[0] for c in retenues] == ["A", "B"]
    assert retenues[0] == ["A", ["x", "y"], 7 * 3600 + 3000, [720]]


@pytest.fixture(scope="module")
def heures(con, parametres, tmp_path_factory):
    dossier = tmp_path_factory.mktemp("vehicules")
    vehicules.exporter(con, parametres, dossier)
    return {f.stem: json.loads(f.read_text(encoding="utf-8")) for f in dossier.iterdir()}


def test_un_fichier_par_heure_du_jour_de_service(heures):
    assert len(heures) == 24
    assert heures["04h"]["debut"] == 4 * 3600
    # 1 h du matin appartient encore au jour de service commencé la veille à 4 h.
    assert heures["01h"]["debut"] == 25 * 3600


def test_course_du_matin(heures):
    # T1 : Gare Centrale (quais S1/S2 fusionnés) → Place Haute → Mairie, 8 h 00, 8 h 03, 8 h 06.
    (course,) = heures["08h"]["courses"]
    route, arrets, depart, ecarts = course
    assert route == "TRAM"
    assert len(arrets) == 3 and arrets[0] != arrets[1] != arrets[2]
    assert depart == 8 * 3600 and ecarts == [180, 180]


def test_course_apres_minuit(heures):
    (course,) = heures["01h"]["courses"]
    assert course[2] == 25 * 3600 + 600


def test_fin_de_course_a_heure_egale_prolongee(heures):
    # T8 : 14 h 00, puis S7 et S8 affichés tous deux à 14 h 06. Les distances, reconstituées
    # faute de tracé, valent 1 km puis 1 km : S8 arrive 6 min après S7, au même rythme.
    (course,) = heures["14h"]["courses"]
    assert course[0] == "N1" and course[3] == [360, 360]


def test_courses_exclues_ou_absentes_du_jour(heures):
    # Ligne scolaire (T6, 7 h 30), service retiré (T4, 9 h), service du dimanche (T5, 10 h).
    assert heures["07h"]["courses"] == []
    assert heures["09h"]["courses"] == []
    assert heures["10h"]["courses"] == []
