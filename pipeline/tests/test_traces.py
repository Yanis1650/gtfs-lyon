"""Reconstitution des tracés absents du GTFS."""

import pytest

from atlas.osm import assembler
from atlas.traces import choisir, positions_km

COORDS = {n: (float(n), 0.0) for n in range(1, 10)}


def test_assembler_retourne_les_chemins_pour_les_enchainer():
    # Premier chemin numérisé à l'envers, deuxième aussi.
    assert assembler([[3, 2, 1], [5, 4, 3], [5, 6]], COORDS) == [1, 2, 3, 4, 5, 6]


def test_assembler_franchit_une_discontinuite_par_le_bout_le_plus_proche():
    assert assembler([[1, 2], [6, 5, 4]], COORDS) == [1, 2, 4, 5, 6]


def test_choisir_retient_la_relation_la_plus_proche_parcourue_dans_l_ordre():
    candidats = {
        10: [(0.1, 30.0), (0.5, 30.0), (0.9, 30.0)],  # dans l'ordre, à 30 m
        11: [(0.1, 5.0), (0.5, 5.0), (0.3, 5.0)],  # plus proche mais désordonnée
        12: [(0.1, 500.0), (0.5, 500.0), (0.9, 500.0)],  # trop loin
    }
    choix = choisir(candidats)
    assert (choix.rel_id, choix.inverse) == (10, False)


def test_choisir_accepte_une_relation_numerisee_a_rebours():
    choix = choisir({7: [(0.9, 10.0), (0.6, 10.0), (0.2, 10.0)]})
    assert (choix.rel_id, choix.inverse) == (7, True)


def test_choisir_ne_retient_rien_sans_candidat_valable():
    assert choisir({}) is None
    assert choisir({1: [(0.1, 900.0), (0.2, 900.0)]}) is None


def test_positions_km_croissantes_meme_a_rebours():
    assert positions_km([0.9, 0.6, 0.62, 0.2], 10.0, inverse=True) == pytest.approx([1.0, 4.0, 4.0, 8.0])


def test_ligne_sans_trace_reliee_en_ligne_droite(con):
    source, = con.sql(
        "select source from traces_reconstitues t join courses c using (shape_id) where c.trip_id = 'T8'"
    ).fetchone()
    assert source == "arrets"
    # 2 km vers l'est (2 × 0,0129° de longitude à 45,78° N) parcourus en 6 minutes.
    (vitesse,) = con.sql("select vitesse_kmh from lignes where ligne = 'N1'").fetchone()
    assert vitesse == pytest.approx(20.0, abs=0.2)
