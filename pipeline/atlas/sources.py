"""Téléchargement des sources ouvertes, chacune dans son propre dossier."""

import shutil
import urllib.request
import zipfile
from pathlib import Path

from .config import BRUTES, SOURCES


def telecharger(nom: str, forcer: bool = False) -> Path:
    url, fichier = SOURCES[nom]
    dossier = BRUTES / nom
    dossier.mkdir(parents=True, exist_ok=True)
    cible = dossier / fichier
    if cible.exists() and not forcer:
        return cible
    print(f"  téléchargement {nom} …")
    requete = urllib.request.Request(url, headers={"User-Agent": "atlas-lyon/0.1"})
    with urllib.request.urlopen(requete, timeout=600) as reponse, open(cible, "wb") as sortie:
        shutil.copyfileobj(reponse, sortie)
    return cible


def extraire(archive: Path, forcer: bool = False) -> Path:
    """Décompresse l'archive dans un dossier frère `extracted/`, sans sortir de celui-ci."""
    dossier = archive.parent / "extracted"
    if dossier.exists() and any(dossier.iterdir()) and not forcer:
        return dossier
    dossier.mkdir(exist_ok=True)
    with zipfile.ZipFile(archive) as z:
        for membre in z.namelist():
            chemin = (dossier / membre).resolve()
            if not chemin.is_relative_to(dossier.resolve()):
                raise ValueError(f"chemin suspect dans {archive.name} : {membre}")
        z.extractall(dossier)
    return dossier


def tout_telecharger(forcer: bool = False) -> None:
    for nom in SOURCES:
        chemin = telecharger(nom, forcer)
        if chemin.suffix == ".zip":
            extraire(chemin, forcer)
