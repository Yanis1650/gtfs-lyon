# Direction visuelle Atlas

Branche : `codex/atlas-refonte-visuelle`.

La proposition conserve la palette crème, ardoise et terracotta, les trois familles typographiques et les données existantes.

## Changements

- En-tête compact sur toute la largeur : titre, navigation, date et thème.
- Onglets segmentés avec un état actif plus visible.
- Colonne de lecture de 340 à 360 pixels sur ordinateur, avec titres plus courts et casse normale pour les légendes secondaires.
- Horloge et animation placées sur la carte, accessibles pendant la lecture des fiches.
- Légende compacte sur la carte, avec le détail complet des classes à déplier. Elle suit la hauteur de la barre horaire pour éviter les chevauchements.
- Résultat principal de l’arrêt et vitesse de la ligne mis en valeur ; fiches de sélection placées avant les chiffres de contexte.
- Fond de carte atténué et halo coloré sur l’arrêt sélectionné. Les classes de données et leurs valeurs sont conservées.
- Commandes harmonisées et pied de page allégé.
- Sur téléphone : en-tête et carte restent visibles pendant le défilement ; le mode carte agrandie est conservé.

## Prévisualisation locale

```powershell
cd web
npm run dev -- --host 127.0.0.1 --port 5180 --strictPort
```

Ouvrir [localhost:5180](http://localhost:5180/).

## Vérifications

- Compilation de production et vérification TypeScript.
- Règle des fichiers de 200 lignes.
- Tests existants du projet.
- Parcours des trois vues et des indicateurs 30/45 minutes et depuis un pôle.
- Recherche et sélection d’un arrêt et d’une ligne ; sélection d’un carreau en 2D.
- Curseur horaire au clavier, animation, pause et changement de vue.
- Thème sombre, fond satellite et vue 3D.
- Mise en page à 390 × 844 et 320 × 568 pixels, animation active et carte agrandie. Ces contrôles utilisent des fenêtres de contenu dans le navigateur, pas des appareils physiques.

Les captures de la proposition sont dans `docs/images/`. La version publique n’a pas été redéployée.
