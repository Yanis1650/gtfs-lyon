# Isochrones au survol

Dans L’accessibilité, le bouton **Isochrones** ajoute une exploration depuis un départ choisi sur la carte.
Sur ordinateur, survoler un carreau habité affiche les zones joignables ; cliquer fixe le départ.
Sur téléphone, toucher un carreau choisit et fixe le départ, sans ouvrir une fiche à sa place.
**Depuis le centre** fournit une alternative au pointeur, notamment après déplacement de la carte au clavier.
**Effacer le départ** réactive le suivi du survol. Désactiver Isochrones rend les indicateurs habituels.

Les boutons **15 min**, **30 min** et **45 min** choisissent la durée maximale. Les zones restent imbriquées :
la sélection 45 min montre les frontières à 15, 30 et 45 min, depuis le même départ.
Le panneau Résultats et détails affiche la population joignable depuis cette origine et la part de la Métropole.
Le bandeau de réglages et la légende restent repliables.

## Ce que mesure la carte

- Trajets théoriques TCL et marche, sur le GTFS du mardi 17 novembre 2026, hors agences scolaires.
- Temps médian pour des départs minute par minute entre 8 h et 9 h ; attente et correspondances comprises.
- Réseau piéton OpenStreetMap et vitesse de marche de 3,6 km/h, comme les autres indicateurs d’accessibilité.
- Origines et destinations : centres des 7 879 carreaux habités de 200 m, Insee Filosofi 2021.
- Frontières exactes de l’union des carreaux atteints, sans enveloppe convexe, lissage ou remplissage des trous.
- Les temps sont dirigés : aller d’un carreau A à B n’est pas assimilé à aller de B à A.

Ce sont des isochrones sur les **zones habitées évaluées**. Les espaces non habités, les accès porte à porte,
la pente détaillée, les horaires d’ouverture et l’accessibilité PMR ne sont pas décrits par cette représentation.
Le point visible est le centre du carreau choisi, pas la position exacte de la souris.
Les temps sont issus des horaires publiés, sans retards réels.

## Recalcul et publication

Les couches et les temps nécessaires sont déjà publiés dans `web/public/data/`. Aucun service d’itinéraires
supplémentaire, clé externe ou ouverture de port n’est nécessaire sur le serveur web.
Le calcul R5 s’effectue lors de la préparation des données ; le navigateur charge la ligne de l’origine choisie.

Depuis la racine du dépôt, après préparation du GTFS, du fichier OSM et des carreaux :

```powershell
docker compose --profile pipeline build pipeline
docker compose --profile pipeline run --rm pipeline isochrones
```

Le traitement écrit dans `web/public/data/isochrones/`. Pour un essai court :

```powershell
docker compose --profile pipeline run --rm pipeline isochrones --echantillon 3
```

Un essai partiel ne remplace pas le manifeste de production. Une exécution interrompue reprend les lignes
terminées de la même version. L’empreinte prend en compte les carreaux, les archives OSM et GTFS et les paramètres.
Le manifeste `index.json` n’est remplacé qu’une fois le jeu complet prêt. Les fichiers temporaires restent dans `data/`.
Après recalcul complet, reconstruire le site selon le README ; un simple push ne confirme pas le déploiement.

## Format et chargement

`index.json` contient l’ordre des identifiants, la version et les hypothèses horaires. Chaque fichier
`<version>/<numero>.bin` contient un octet par destination : une durée en minutes, arrondie au supérieur,
ou 255 si la destination est hors de la limite de 45 minutes ou non calculable.
Une ligne représente 7 879 octets, sans téléchargement de toute la matrice au premier survol.
Le client refuse les versions, chemins et tailles invalides ; le cache est limité à 24 origines.
Les requêtes obsolètes sont annulées et un résultat ancien ne peut pas remplacer une origine plus récente.
Un court délai de survol évite de charger toutes les cases traversées pendant un déplacement de souris.

Vite ignore les écritures de ce dossier pendant le calcul, pour ne pas recharger la page et réinitialiser l’horloge.
Il faut redémarrer le serveur local après la publication d’un nouveau jeu de données pour actualiser son inventaire de fichiers.

## Vérifications

Les tests Python contrôlent les seuils, les arrondis, les valeurs absentes et l’encodage.
Les tests web contrôlent les arêtes communes, les trous, les îlots, les temps dirigés, l’ordre des identifiants,
la validation des données, les erreurs de chargement et les annulations. Ils s’exécutent avec `npm test`.
`python outils/verifier_isochrones.py` vérifie aussi toutes les lignes publiées et leur cohérence avec les métadonnées et les carreaux ; la CI l’exécute.
Le [rapport du jeu publié](verification-isochrones.json) conserve les dimensions et l’empreinte de la matrice.
La compilation TypeScript et les contrôles manuels complètent ces tests : survol, départ fixé, effacement,
retour aux indicateurs, thème, satellite, 3D et petits écrans.
Un essai en navigateur ne remplace pas une vérification tactile sur téléphone physique.

Voir aussi [la description générale de l’interface](refonte-atlas.md).

Captures de vérification : [15 et 45 minutes sur mobile](images/atlas-isochrones-mobile.png)
et [isochrones sur bureau](images/atlas-isochrones-bureau.png).
