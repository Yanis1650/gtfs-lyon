# Vérification locale

Les captures de ce dossier servent à contrôler l’interface ; les images destinées à la publication sont dans `../images/`.

- `apercu-bureau.png` : classement filtré sur « T3 » et tracé de la ligne sélectionnée, à 1 280 × 720 pixels.
- `apercu-mobile.png` : interface dans une fenêtre de contenu de 390 × 844 pixels, affichée à échelle réduite dans une page de contrôle. Il s’agit d’un test de mise en page, pas d’une capture sur un téléphone physique.

Contrôles effectués :

- Recherche « part dieu » : noms avec tirets retrouvés, sélection de Gare Part-Dieu V.Merle et fiche ouverte.
- Recherche « T3 » : classement filtré, fiche à 29,5 km/h et cadrage sur le tracé.
- Recherche de ligne sans correspondance : message explicite.
- Format téléphone : horloge, indication de simulation et bouton d’animation visibles dès le premier écran.
- Les quatre visuels générés ont été ouverts et vérifiés visuellement.
- Image publique d’aperçu identique à la couverture du dossier ; chiffres du post contrôlés dans les données sources.

Le recalcul complet R5 a été exécuté hors services scolaires. Les 7 879 identifiants sont conservés ; toutes les populations sont non négatives, les résultats à 45 minutes sont au moins ceux à 30 minutes, et la marche seule ne dépasse pas les transports avec marche à 30 minutes. Le rapport est dans `recalcul-accessibilite.json`.

La compilation et les 41 tests du projet ont été exécutés pendant la préparation. Aucun déploiement sur le serveur public ni publication LinkedIn n’a été effectué.
