from atlas.arrets import distance_m, normaliser, regrouper


def test_distance_d_un_centieme_de_degre_de_latitude():
    assert abs(distance_m(45.76, 4.83, 45.77, 4.83) - 1112) < 2


def test_normaliser_ignore_accents_casse_et_tirets():
    assert normaliser("Hôtel-de-Ville  Louis Pradel") == normaliser("hotel de ville louis pradel")


def test_quais_homonymes_proches_fusionnes_et_lointains_separes():
    quais = [
        ("A", "Mairie", 45.7800, 4.8300, None),
        ("B", "Mairie", 45.7801, 4.8302, None),  # 20 m
        ("C", "Mairie", 45.9000, 4.8300, None),  # 13 km
        ("D", "Place", 45.7800, 4.8300, None),  # même point, autre nom
    ]
    g = regrouper(quais, rayon_m=250)
    assert g["A"] == g["B"]
    assert g["A"] != g["C"]
    assert g["A"] != g["D"]


def test_station_mere_commune_fusionne_des_noms_differents():
    quais = [
        ("A", "Bellecour quai métro", 45.7578, 4.8320, "P1"),
        ("B", "Bellecour Le Viste", 45.7570, 4.8335, "P1"),
    ]
    g = regrouper(quais, rayon_m=250)
    assert g["A"] == g["B"]
