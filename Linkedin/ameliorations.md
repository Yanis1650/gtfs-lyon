# Améliorations du projet

## Présentes dans le dépôt

- Image d’aperçu du lien, URL canonique et métadonnées de partage.
- Recherche d’arrêt tolérante aux accents, à la casse et aux tirets, avec centrage sur la carte.
- Recherche dans le classement des lignes, par numéro ou destination.
- Navigation mobile en bas, avec espaces Carte et exploration séparés ; déplacement de la carte avec un doigt.
- Animer les véhicules et Vue 3D mis en avant en tête de carte, sur mobile comme sur bureau.
- Zoom vers un véhicule en circulation pour montrer sa modélisation ; satellite compact avec un pictogramme dédié.
- Durées 30/45 minutes et pôle de départ dans un bandeau repliable sur la carte ; guide Aide et retour par balayage depuis les panneaux.
- Isochrones TCL + marche à 15/30/45 min depuis le carreau survolé ou touché ; zones habitées évaluées sur une maille de 200 m, départs entre 8 h et 9 h.
- Barre horaire d’environ 52 px, persistante pendant la lecture des fiches ; vitesses d’animation dans les réglages.
- Curseur à la minute en simulation, avec pause pendant le glissement ; génération des isochrones sans rechargement automatique de l’aperçu.
- Recherche d’arrêt et choix de l’indicateur placés en tête des panneaux ; fiches défilantes sur toute la hauteur disponible.
- Simulation et horaires théoriques explicités près de l’horloge et dans l’en-tête.
- Totaux et classement des arrêts identifiés comme portant sur la journée complète.
- Millésime de population rappelé dans la vue d’accessibilité.
- Filtre de la navette fluviale ajouté dans la vue des vitesses.
- Préparation du GTFS pour R5 corrigée : exclusion des mêmes agences scolaires que dans l’offre, y compris les références aux courses exclues.
- Vitesse de marche fixée explicitement à 3,6 km/h pour les calculs R5.

Le recalcul complet d’accessibilité a été exécuté sur les 7 879 carreaux, contrôlé puis exporté dans les données locales du site. Le rapport est dans `verification/recalcul-accessibilite.json`. Les résultats précédents ont été conservés dans les données de travail pour permettre un retour en arrière.

La présence dans le dépôt ne confirme pas l’état du serveur public. La reconstruction du site est décrite dans le README.
La description actuelle de l’interface et ses captures sont dans `../docs/refonte-atlas.md`.

## Prochaine série utile

1. **Partager un état complet.** Mémoriser heure, ligne/arrêt, cadrage, indicateur et pôle dans le lien. L’adresse conserve actuellement seulement l’onglet.
2. **Proposer trois explorations guidées.** Le réveil du réseau, deux lignes de tram à comparer, les départs depuis la Part-Dieu. Chaque entrée doit ouvrir une vue déjà cadrée et expliquée.
3. **Améliorer les erreurs de chargement.** Message clair et bouton pour réessayer si une couche ou le fond de carte ne répond pas.
4. **Rendre les vitesses comparables par contexte.** Présenter distinctement lignes urbaines, express/périurbaines et Rhônexpress avant de tirer des conclusions sur un mode entier.
5. **Comparer les moments de la semaine.** Ajouter un samedi ou un dimanche sur un même périmètre, avec un jour de référence et une provenance explicites.

Pour la communication, garder un résultat concret par publication et montrer le fonctionnement de la carte. Une courte vidéo de l’animation serait un complément utile aux images statiques ; aucune vidéo n’est incluse dans ce dossier.
