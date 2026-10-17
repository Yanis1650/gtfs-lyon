"""Règle du dépôt : aucun fichier de code ou de configuration ne dépasse 200 lignes.

Lancé par l'intégration continue ; à lancer aussi à la main : python outils/verifier_longueurs.py
"""

import subprocess
import sys
from pathlib import Path

MAXIMUM = 200
# Fichiers produits ou figés, hors de la règle : données, verrous de dépendances, logos.
EXCLUS = ("web/public/data/", "package-lock.json", "web/src/assets/", "web/public/favicon.svg")
EXTENSIONS = {".py", ".sql", ".ts", ".vue", ".css", ".html", ".json", ".yaml", ".yml", ".toml", ".conf", ".md"}


def fichiers_suivis() -> list[Path]:
    sortie = subprocess.run(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard"],
        capture_output=True, text=True, check=True,
    ).stdout
    return [Path(f) for f in sortie.splitlines() if not any(e in f for e in EXCLUS) and Path(f).suffix in EXTENSIONS]


def main() -> int:
    trop_longs = []
    for chemin in fichiers_suivis():
        lignes = len(chemin.read_text(encoding="utf-8").splitlines())
        if lignes > MAXIMUM:
            trop_longs.append((lignes, chemin))
    for lignes, chemin in sorted(trop_longs, reverse=True):
        print(f"{chemin} : {lignes} lignes (maximum {MAXIMUM})")
    if not trop_longs:
        print(f"Tous les fichiers tiennent en {MAXIMUM} lignes.")
    return 1 if trop_longs else 0


if __name__ == "__main__":
    sys.exit(main())
