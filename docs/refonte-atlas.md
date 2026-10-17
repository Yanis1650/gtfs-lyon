# Interface Atlas

Cette page décrit l’interface du dépôt. Elle conserve la palette crème, ardoise et terracotta,
les trois familles typographiques et les classes de données de l’atlas.

## Téléphone et tablette : moins de 900 px

- L’application tient dans la hauteur disponible de l’écran, avec les marges de sécurité du téléphone.
- L’en-tête contient le titre, le thème et, quand la largeur le permet, la date des horaires.
- La navigation du bas donne toujours accès à L’offre, La vitesse et L’accessibilité.
- La commande Carte utilise tout l’espace central. Le déplacement se fait avec un doigt ; le zoom utilise les gestes de la carte.
- La commande voisine ouvre Arrêts et recherche, Lignes et filtres ou Indicateurs, selon la vue.
- Le panneau défile indépendamment. La carte ne reste pas figée au-dessus des recherches et des fiches.
- Une sélection sur la carte ouvre sa fiche. Le bouton Carte permet de revenir au cadrage conservé.
- La recherche d’arrêt et les choix d’indicateur sont placés au début de leur panneau.
- Les liens Méthode et sources, Mentions légales et Code source se trouvent au bas du panneau défilant.

Il n’existe plus de mode carte agrandie distinct : Carte est déjà l’espace consacré à la carte.

## Barre horaire et animation

Dans L’offre, la barre d’environ 52 px regroupe lecture/pause, heure et curseur fin.
Elle reste présente au-dessus de la navigation du bas, y compris pendant la lecture d’une fiche.
Sur bureau, elle flotte sur la carte, avec une largeur plafonnée à 640 px.

Le bouton Options d’animation ouvre les véhicules et les vitesses ×1, ×10 ou ×60.
Un clic à l’extérieur ou Échap ferme le menu. Les cibles principales gardent 44 px de hauteur.
Le libellé Théorique ou Simulation précise la nature de l’affichage ; les horaires ne décrivent pas les retards réels.
L’activation respecte la préférence système de réduction des animations.

## Bureau : à partir de 900 px

- En-tête de 78 px avec titre, onglets segmentés, date et thème.
- Colonne de lecture de 340 px, puis 360 px à partir de 1 440 px ; seule cette colonne défile.
- Carte et panneau visibles ensemble ; barre horaire compacte flottante.
- Résultats principaux des fiches mis en valeur ; totaux journaliers séparés des mesures horaires.
- Fond atténué et halo sur l’arrêt sélectionné, avec conservation des classes de données.
- Légende repliable, détail complet des classes et position au-dessus de la barre horaire.

## Démarrage et publication

Les commandes de lancement, de recalcul, de vérification et de déploiement sont centralisées
dans le [README](../README.md#lancer-le-projet).
L’aperçu habituel est [localhost:5180](http://localhost:5180/).
Le dépôt et l’aperçu local ne suffisent pas à confirmer la version déployée sur le serveur public.

## Vérifications de l’interface

Le parcours manuel couvre :

- navigation entre les trois vues et bascule Carte/exploration ;
- recherche d’arrêt, ouverture de fiche et retour à la carte ;
- défilement jusqu’aux sources, recherche de ligne et choix d’indicateur 30/45 minutes ;
- curseur au clavier, lecture/pause et options d’animation ;
- thème sombre, fond satellite et vue 3D ;
- petits écrans, hauteur réduite en paysage et disposition bureau.

Le [contrôle responsive local](http://localhost:5180/verification-mobile.html), défini dans `web/verification-mobile.html`,
propose 320 × 568, 390 × 568, 390 × 844 et 844 × 390. Il n’est pas inclus dans la construction de production.
Captures : [petits écrans](images/atlas-mobile.png), [fiche d’arrêt sur mobile](images/atlas-mobile-exploration.png),
[bureau](images/atlas-bureau.png) et [paysage](images/atlas-paysage.png).
Ces vérifications dans le navigateur ne remplacent pas un essai sur téléphone physique, notamment pour le clavier tactile.
La compilation contrôle TypeScript ; les tests du pipeline et la règle des fichiers de 200 lignes complètent ces contrôles.
