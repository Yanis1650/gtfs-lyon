# Publication LinkedIn — Lyon sans voiture

Le premier post raconte la reprise des données GTFS depuis le master, le temps d’un week-end. Le texte simple à copier est dans `post.txt` ; les autres sujets sont conservés pour des publications séparées.

## Premier post : un GIF de 10 secondes

Joindre **`images/02-part-dieu-10s.gif`** à `post.txt` :

- 10 secondes en boucle, 800 × 532 pixels, 15 images/s ; environ 1,5 Mo.
- Extrait de la capture réelle près de la Part-Dieu, recadré sur les véhicules et les bâtiments en 3D.
- Simulation à 8 h 30 et à vitesse ×1, selon les horaires théoriques TCL du 17 novembre 2026.
- Mention « prototype », précision sur la simulation et crédits intégrés ; pas de son.
- `videos/02-part-dieu-10s.mp4` fournit la même séquence au format vidéo, environ 0,3 Mo.

## Vidéo de présentation plus longue

`videos/01-reseau-anime.mp4` conserve la démonstration initiale :

- 22 secondes, 1 280 × 848 pixels, 30 images/s, H.264 ; moins de 1 Mo.
- Capture du fonctionnement réel de l’application, à 8 h 30 et à vitesse ×1, sur les horaires théoriques du 17 novembre 2026.
- Sous-titres et crédits intégrés dans une bande sous la capture ; aucune piste audio.
- `videos/01-reseau-anime.srt` conserve le texte des sous-titres ; inutile de les afficher une seconde fois par-dessus ceux de la vidéo.
- `images/01-demo-3d.png` fournit une couverture tirée de cette vidéo, utilisable aussi comme image seule.

Le lien du post est `https://atlas-lyon.drekky.fr/#offre-demo`. Il ouvre la même scène de départ,
avec un tram réellement en circulation dans les données, la 3D et la lecture à vitesse ×1.
L’heure et le cadrage restent ensuite libres ; la préférence système de réduction des mouvements met la lecture en pause.
**Déployer la version du dépôt avant de publier ce lien** : les anciens builds ne reconnaissent pas cette scène.

Les positions sont calculées à partir des horaires ; elles ne viennent pas d’un suivi GPS et ne décrivent pas les retards.
Les captures intermédiaires de l’enregistrement ne font pas partie du kit. Pour refaire une prise,
ouvrir le lien de scène, vérifier le chargement des bâtiments et enregistrer 20 à 30 secondes de l’application.
Le fichier SRT et `videos/credits.txt` permettent de conserver les textes et les crédits lors d’un nouveau montage.

## Publications suivantes

`post-vitesses.txt` conserve le texte T1/T3. Il peut accompagner `images/02-vitesses-T1-T3.png` seul.
Les isochrones peuvent faire l’objet d’une autre démonstration, centrée sur une question d’accessibilité.

Le carrousel général initial reste disponible, dans cet ordre :

1. `images/01-atlas.png` : le projet et l’ampleur de l’offre.
2. `images/02-vitesses-T1-T3.png` : une comparaison concrète, avec les précautions de lecture.
3. `images/03-explorer.png` : les trois usages et l’adresse du site.

Dimensions : 1 080 × 1 350 pixels. Ces fichiers peuvent être joints comme série de trois images. Aucun PDF n’est nécessaire.

`images/capture-satellite-3d.png` est la capture historique fournie, conservée sans modification ; ses petits textes sont moins lisibles dans un fil d’actualité.
Cette capture montre une version antérieure de l’interface. Les captures de `../docs/images/` montrent la navigation actuelle.

`textes-alternatifs.txt` fournit une description pour chaque image.

## Aperçu du lien

`images/couverture-lien.png` fait 1 200 × 627 pixels. Une copie identique est dans `web/public/partage/lyon-sans-voiture.png`, référencée dans les métadonnées du site.

Après le déploiement, vérifier l’aperçu avec le [Post Inspector LinkedIn](https://www.linkedin.com/post-inspector/). Le fichier doit être disponible sur l’adresse publique déclarée dans `og:image`. La préparation locale ne modifie pas l’aperçu du site actuellement en ligne.

## Sources et limites

- Jour de référence : 17 novembre 2026, offre théorique programmée.
- Chiffres : `web/public/data/meta.json` et `lignes.geojson` ; détails archivés dans `sources/chiffres.json`.
- Vitesses commerciales : lignes complètes, arrêts compris, rapport des distances cumulées aux durées cumulées des courses. Elles ne mesurent pas la ponctualité et ne démontrent pas les causes des différences.
- Les visuels ne publient aucun chiffre d’accessibilité.
- Tracés et horaires : SYTRAL Mobilités et contributeurs OpenStreetMap, ODbL. Population : Insee Filosofi 2021, Licence Ouverte.
- GIF, vidéos et couverture de démonstration : fond OpenFreeMap / OpenMapTiles, OpenStreetMap et horaires TCL ; les crédits sont intégrés dans les animations.
- Capture satellite historique : photographies aériennes IGN BD ORTHO, Licence Ouverte 2.0 ; fond/tracés OpenStreetMap et données TCL selon les crédits du site.
- Les cartes des visuels sont des extraits géographiques : les totaux décrivent l’ensemble du périmètre GTFS retenu, hors lignes scolaires.

## Modifier les visuels

Les originaux vectoriels sont dans `sources/`. Le générateur est `outils/generer_linkedin.cjs` et demande Node.js et `sharp`.

Avec `sharp` disponible localement :

```powershell
node outils/generer_linkedin.cjs
```

Si `sharp` est fourni dans un autre dossier de dépendances, définir `ATLAS_SHARP_MODULES` sur ce dossier `node_modules` avant la commande. Le générateur relit les données du site et actualise aussi l’image d’aperçu publique.

Les fichiers de ce dossier sont préparés pour une publication manuelle. Aucun contenu n’a été envoyé à LinkedIn.
Le [parcours d’essai de découverte](verification/parcours-decouverte.md) est prêt pour trois personnes ; ces essais restent à mener.
`kit-linkedin.zip` regroupe les fichiers de ce dossier, à l’exclusion de l’archive elle-même.
