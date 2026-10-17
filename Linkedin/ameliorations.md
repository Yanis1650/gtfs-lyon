# Améliorations du projet

## Appliquées dans cette version locale

- Image d’aperçu du lien, URL canonique et métadonnées de partage.
- Recherche d’arrêt tolérante aux accents, à la casse et aux tirets, avec centrage sur la carte.
- Recherche dans le classement des lignes, par numéro ou destination.
- Carte plus compacte sur mobile ; le mode plein écran reste disponible.
- Simulation et horaires théoriques explicités près de l’horloge et dans l’en-tête.
- Totaux et classement des arrêts identifiés comme portant sur la journée complète.
- Millésime de population rappelé dans la vue d’accessibilité.
- Filtre de la navette fluviale ajouté dans la vue des vitesses.
- Préparation du GTFS pour R5 corrigée : exclusion des mêmes agences scolaires que dans l’offre, y compris les références aux courses exclues.
- Vitesse de marche fixée explicitement à 3,6 km/h pour les calculs R5.

Le recalcul complet d’accessibilité a été exécuté sur les 7 879 carreaux, contrôlé puis exporté dans les données locales du site. Le rapport est dans `verification/recalcul-accessibilite.json`. Les résultats précédents ont été conservés dans les données de travail pour permettre un retour en arrière.

Le serveur public doit être redéployé pour recevoir l’interface, l’image d’aperçu et les données corrigées.

## Prochaine série utile

1. **Partager un état complet.** Mémoriser heure, ligne/arrêt, cadrage, indicateur et pôle dans le lien. L’adresse conserve actuellement seulement l’onglet.
2. **Proposer trois explorations guidées.** Le réveil du réseau, deux lignes de tram à comparer, les départs depuis la Part-Dieu. Chaque entrée doit ouvrir une vue déjà cadrée et expliquée.
3. **Améliorer les erreurs de chargement.** Message clair et bouton pour réessayer si une couche ou le fond de carte ne répond pas.
4. **Rendre les vitesses comparables par contexte.** Présenter distinctement lignes urbaines, express/périurbaines et Rhônexpress avant de tirer des conclusions sur un mode entier.
5. **Comparer les moments de la semaine.** Ajouter un samedi ou un dimanche sur un même périmètre, avec un jour de référence et une provenance explicites.

Pour la communication, garder un résultat concret par publication et montrer le fonctionnement de la carte. Une courte vidéo de l’animation serait un complément utile aux images statiques ; aucune vidéo n’est incluse dans ce dossier.
