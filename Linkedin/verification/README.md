# Vérification locale

Les captures de ce dossier servent à contrôler l’interface ; les images destinées à la publication sont dans `../images/`.
La démonstration actuelle est dans `../videos/01-reseau-anime.mp4`, avec la couverture `../images/01-demo-3d.png`.
Le protocole `parcours-decouverte.md` prépare l’essai avec trois personnes ; aucun essai externe n’a été mené par l’assistant.
Elles documentent la préparation initiale du kit. Pour l’interface actuelle, consulter `../../docs/refonte-atlas.md`
et les captures de `../../docs/images/` ; la navigation mobile et la barre horaire ont été revues depuis.

- `apercu-bureau.png` : classement filtré sur « T3 » et tracé de la ligne sélectionnée, à 1 280 × 720 pixels.
- `apercu-mobile.png` : interface dans une fenêtre de contenu de 390 × 844 pixels, affichée à échelle réduite dans une page de contrôle. Il s’agit d’un test de mise en page, pas d’une capture sur un téléphone physique.

Contrôles effectués :

- Recherche « part dieu » : noms avec tirets retrouvés, sélection de Gare Part-Dieu V.Merle et fiche ouverte.
- Recherche « T3 » : classement filtré, fiche à 29,5 km/h et cadrage sur le tracé.
- Recherche de ligne sans correspondance : message explicite.
- Ancien format téléphone : horloge, indication de simulation et bouton d’animation visibles dès le premier écran.
- Les quatre visuels générés ont été ouverts et vérifiés visuellement.
- Image publique d’aperçu identique à la couverture du dossier ; chiffres du post contrôlés dans les données sources.

Le recalcul complet R5 a été exécuté hors services scolaires. Les 7 879 identifiants sont conservés ; toutes les populations sont non négatives, les résultats à 45 minutes sont au moins ceux à 30 minutes, et la marche seule ne dépasse pas les transports avec marche à 30 minutes. Le rapport est dans `recalcul-accessibilite.json`.

La compilation et les 41 tests du projet ont été exécutés pendant la préparation. Aucun déploiement sur le serveur public ni publication LinkedIn n’a été effectué.

La scène de découverte ajoutée ensuite a été vérifiée par lien direct, bouton et aide, sur bureau et à 320 px.
Le curseur reste utilisable après lancement ; les tests web contrôlent aussi l’ancre autorisée, le démontage des
écouteurs et la réduction des animations. La vidéo a été enregistrée dans l’application, encodée puis contrôlée
par décodage des 660 images et lecture de sa durée de 22 secondes, avec vérification des sous-titres et des crédits.

La vidéo `../videos/02-part-dieu-10s.mp4` a ensuite été réenregistrée dans l’application en ×10 :
véhicules modélisés près de la Part-Dieu, retour à plat, dézoom et cadrage de Neuville à Givors.
Contrôles : 720 × 608 pixels, 30 images/s, durée de 10 secondes et décodage intégral sans erreur.
Les images rapprochées, la transition et les vues finales ont été vérifiées visuellement :
les véhicules se déplacent et les crédits restent présents. Le montage montre la carte seule,
avec une ligne de crédits discrète en IBM Plex Sans, sans titre ni bandeau descriptif.
