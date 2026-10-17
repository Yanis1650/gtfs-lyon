# Publication LinkedIn — Lyon sans voiture

Le texte à copier est dans `post.txt`. Les visuels suivent la charte du site et utilisent les données du projet, sans tracés générés par IA.

## Proposition de publication

Joindre les trois images portrait, dans cet ordre, avec `post.txt` :

1. `images/01-atlas.png` : le projet et l’ampleur de l’offre.
2. `images/02-vitesses-T1-T3.png` : une comparaison concrète, avec les précautions de lecture.
3. `images/03-explorer.png` : les trois usages et l’adresse du site.

Dimensions : 1 080 × 1 350 pixels. Ces fichiers peuvent être joints comme série de trois images. Aucun PDF n’est nécessaire.

Autre option : utiliser `images/capture-satellite-3d.png` seule pour mettre l’accent sur la démonstration visuelle. C’est la capture fournie, conservée sans modification ; ses petits textes sont moins lisibles dans un fil d’actualité.
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
- Capture 3D : photographies aériennes IGN BD ORTHO, Licence Ouverte 2.0 ; fond/tracés OpenStreetMap et données TCL selon les crédits du site.
- Les cartes des visuels sont des extraits géographiques : les totaux décrivent l’ensemble du périmètre GTFS retenu, hors lignes scolaires.

## Modifier les visuels

Les originaux vectoriels sont dans `sources/`. Le générateur est `outils/generer_linkedin.cjs` et demande Node.js et `sharp`.

Avec `sharp` disponible localement :

```powershell
node outils/generer_linkedin.cjs
```

Si `sharp` est fourni dans un autre dossier de dépendances, définir `ATLAS_SHARP_MODULES` sur ce dossier `node_modules` avant la commande. Le générateur relit les données du site et actualise aussi l’image d’aperçu publique.

Les fichiers de ce dossier sont préparés pour une publication manuelle. Aucun contenu n’a été envoyé à LinkedIn.
