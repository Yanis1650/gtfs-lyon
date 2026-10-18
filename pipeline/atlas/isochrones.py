"""Temps R5 depuis les carreaux habités, publiés par origine pour le survol de la carte."""

import datetime as dt
import hashlib
import json
import math
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from .config import Parametres
from .gtfs_r5 import preparer_gtfs_r5

INACCESSIBLE = 255
MAX_MINUTES = 45


def encoder(identifiants: list[str], temps: dict[str, float]) -> bytes:
    """Une minute par octet ; 255 signifie absent ou au-delà de 45 minutes."""
    valeurs = bytearray([INACCESSIBLE]) * len(identifiants)
    for i, identifiant in enumerate(identifiants):
        t = temps.get(identifiant, math.nan)
        if math.isfinite(t) and 0 <= t <= MAX_MINUTES:
            valeurs[i] = math.ceil(t)
    return bytes(valeurs)


def calculer(p: Parametres, dossier: Path, limite: int | None = None) -> None:
    """Calcule la médiane de 8 h à 9 h, sans modifier les indicateurs déjà publiés.

    Une exécution interrompue reprend ses lignes terminées. Le manifeste n'est publié
    qu'une fois toutes les origines calculées, pour ne jamais proposer un jeu partiel.
    """
    import geopandas as gpd
    import pandas as pd
    from r5py import TransportMode, TransportNetwork, TravelTimeMatrix

    carreaux = pd.read_parquet(p.carreaux).sort_values("idcar").reset_index(drop=True)
    ids = carreaux["idcar"].tolist()
    # Les archives d'entrée font partie de l'empreinte : aucun résultat d'un ancien réseau n'est repris.
    empreinte = hashlib.sha256()
    for chemin in [p.carreaux, p.gtfs_zip, p.osm_pbf]:
        with chemin.open("rb") as flux:
            for bloc in iter(lambda: flux.read(1024 * 1024), b""):
                empreinte.update(bloc)
    regles = [p.date_ref.isoformat(), p.heure_depart, p.fenetre_depart_min,
              p.agences_exclues, MAX_MINUTES, 3.6, "r5-median-u8-v1"]
    empreinte.update(json.dumps(regles).encode())
    version = empreinte.hexdigest()[:16]
    sortie = dossier / version
    sortie.mkdir(parents=True, exist_ok=True)
    travail = p.base.parent / "isochrones-temporaires" / version
    travail.mkdir(parents=True, exist_ok=True)
    origines = range(min(limite or len(ids), len(ids)))
    manquantes = [i for i in origines if not (sortie / f"{i}.bin").is_file()
                  or (sortie / f"{i}.bin").stat().st_size != len(ids)]
    print(f"  {len(ids)} destinations, {len(manquantes)} origines à calculer, version {version}", flush=True)
    if manquantes:
        points = gpd.GeoDataFrame({"id": ids}, geometry=gpd.points_from_xy(carreaux.lon, carreaux.lat), crs=4326)
        gtfs = preparer_gtfs_r5(p.gtfs_zip, p.base.parent / "gtfs_r5.zip", p.agences_exclues)
        reseau = TransportNetwork(p.osm_pbf, [gtfs])
        commun = dict(departure=dt.datetime.combine(p.date_ref, dt.time(p.heure_depart)),
                      departure_time_window=dt.timedelta(minutes=p.fenetre_depart_min),
                      percentiles=[50], speed_walking=3.6, max_time=dt.timedelta(minutes=MAX_MINUTES),
                      transport_modes=[TransportMode.TRANSIT, TransportMode.WALK])

        def lot(indices):
            matrice = TravelTimeMatrix(reseau, origins=points.iloc[indices], destinations=points, **commun)
            par_origine = {origine: groupe for origine, groupe in matrice.groupby("from_id")}
            for i in indices:
                groupe = par_origine.get(ids[i])
                temps = dict(zip(groupe.to_id, groupe.travel_time)) if groupe is not None else {}
                temporaire = travail / f"{i}.tmp"
                temporaire.write_bytes(encoder(ids, temps))
                temporaire.replace(sortie / f"{i}.bin")
            return len(indices)

        lots = [manquantes[i:i + 100] for i in range(0, len(manquantes), 100)]
        fait = 0
        with ThreadPoolExecutor(max_workers=min(4, max(1, (os.cpu_count() or 2) - 1))) as executeur:
            taches = [executeur.submit(lot, indices) for indices in lots]
            for tache in as_completed(taches):
                fait += tache.result()
                print(f"  origines : {fait}/{len(manquantes)}", flush=True)
    if limite and limite < len(ids):
        print("  Échantillon terminé ; manifeste de production inchangé.", flush=True)
        return
    manifeste = {"format": "r5-median-u8-v1", "version": version, "ids": ids,
                 "date": p.date_ref.isoformat(), "heure": p.heure_depart,
                 "fenetre": p.fenetre_depart_min, "marche_kmh": 3.6,
                 "maximum": MAX_MINUTES, "agences_exclues": list(p.agences_exclues)}
    temporaire = travail / "index.tmp"
    temporaire.write_text(json.dumps(manifeste, separators=(",", ":")), encoding="utf-8")
    temporaire.replace(dossier / "index.json")
    print(f"  manifeste publié : {len(ids)} origines, {len(ids) ** 2 / 1e6:.1f} Mo non compressés", flush=True)
