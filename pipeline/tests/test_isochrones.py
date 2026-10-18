"""Encodage publié des temps de trajet ; aucun moteur Java nécessaire."""

import math

from atlas.isochrones import encoder


def test_minutes_et_absences_ne_sont_pas_confondues():
    ids = ["origine", "proche", "seuil", "lointain", "absent"]
    assert encoder(ids, {"origine": 0, "proche": 12.1, "seuil": 45, "lointain": 46}) == bytes([0, 13, 45, 255, 255])


def test_arrondi_ne_fait_pas_franchir_un_seuil_a_tort():
    assert encoder(["a", "b", "c"], {"a": 15, "b": 15.1, "c": 44.1}) == bytes([15, 16, 45])


def test_temps_invalides_restent_inaccessibles():
    assert encoder(["a", "b", "c"], {"a": math.nan, "b": math.inf, "c": -1}) == bytes([255, 255, 255])
