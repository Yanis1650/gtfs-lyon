# Interface Atlas

Cette page décrit l’interface du dépôt. Elle conserve la palette crème, ardoise et terracotta,
les trois familles typographiques et les classes de données de l’atlas.

## Téléphone et tablette : moins de 900 px

- L’application tient dans la hauteur disponible de l’écran, avec les marges de sécurité du téléphone.
- L’en-tête contient le titre, le thème et, quand la largeur le permet, la date des horaires.
- La navigation du bas donne toujours accès à L’offre, La vitesse et L’accessibilité.
- La commande Carte utilise tout l’espace central. Le déplacement se fait avec un doigt ; le zoom utilise les gestes de la carte.
- La commande voisine ouvre Arrêts et recherche, Lignes et filtres ou Résultats et détails, selon la vue.
- Le panneau défile indépendamment. La carte ne reste pas figée au-dessus des recherches et des fiches.
- Une sélection sur la carte ouvre sa fiche. Le bouton Carte permet de revenir au cadrage conservé.
- La recherche d’arrêt et les choix d’indicateur sont placés au début de leur panneau.
- Animer les véhicules et Vue 3D sont directement visibles en haut de la carte ; le satellite conserve un pictogramme seul.
- Un balayage horizontal dans un panneau revient à la carte. Le défilement vertical, les champs et les graphiques gardent leur usage.
- Dans l’accessibilité, les boutons 30 min, 45 min et Depuis un pôle, puis le choix du départ, sont accessibles sur la carte.
- Ce bandeau se replie avec la flèche : une commande compacte conserve la durée ou le pôle actif et permet de le rouvrir sans perdre les réglages.
- Isochrones affiche les zones habitées à 15/30/45 min depuis un carreau : survol puis clic pour fixer sur bureau, toucher sur téléphone ([méthode](isochrones.md)).
- Le bouton Aide ouvre un guide des trois usages, avec des raccourcis vers les vues et une explication des gestes.
- Les liens Méthode et sources, Mentions légales et Code source se trouvent au bas du panneau défilant.

Il n’existe plus de mode carte agrandie distinct : Carte est déjà l’espace consacré à la carte.

## Barre horaire et animation

Dans L’offre, la barre d’environ 52 px regroupe lecture/pause, heure et curseur fin.
Elle reste présente au-dessus de la navigation du bas, y compris pendant la lecture d’une fiche.
Sur bureau, elle flotte sur la carte, avec une largeur plafonnée à 640 px.

Le bouton Animer les véhicules, mis en avant sur la carte, active la simulation en un clic.
La carte zoome au niveau 17 sur un véhicule en circulation, de préférence un tram dans le cadrage,
pour montrer sa modélisation. Un cadrage déjà rapproché est conservé ; une heure sans véhicule ne crée pas de démonstration fictive.
Vue 3D incline et rapproche la carte pour montrer les bâtiments et les véhicules en volume.
Le bouton Options d’animation conserve les vitesses ×1, ×10 ou ×60 et une commande des véhicules accessible pendant la lecture d’une fiche.
Un clic à l’extérieur ou Échap ferme le menu. Les cibles principales gardent 44 px de hauteur.
Le libellé Théorique ou Simulation précise la nature de l’affichage ; les horaires ne décrivent pas les retards réels.
En simulation, le curseur choisit la minute, suit l’horloge des véhicules et suspend la lecture pendant le glissement ; le relâchement restaure l’état de lecture précédent.
L’activation respecte la préférence système de réduction des animations.

## Bureau : à partir de 900 px

- En-tête de 78 px avec titre, onglets segmentés, date et thème.
- Colonne de lecture de 340 px, puis 360 px à partir de 1 440 px ; seule cette colonne défile.
- Carte et panneau visibles ensemble ; barre horaire compacte flottante.
- Animer les véhicules et Vue 3D mis en avant dès l’ouverture ; satellite compact, identifié au survol et pour les lecteurs d’écran.
- Résultats principaux des fiches mis en valeur ; totaux journaliers séparés des mesures horaires.
- Fond atténué et halo sur l’arrêt sélectionné, avec conservation des classes de données.
- Légende repliable, détail complet des classes et position au-dessus de la barre horaire.
- Crédits cartographiques natifs repliés au premier chargement, en bas à gauche, séparés de la légende.

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
- repli et réouverture des commandes d’accessibilité, avec conservation de la mesure et du pôle sélectionnés ;
- isochrones pendant un mouvement continu, réseau lent, départ fixé, seuils, effacement et retour aux indicateurs ;
- curseur au clavier, lecture/pause et options d’animation ;
- thème sombre, fond satellite et vue 3D ;
- petits écrans, hauteur réduite en paysage et disposition bureau.
- logique de retour par balayage : gauche, droite, petits mouvements, défilement vertical, diagonale et geste lent.

Le [contrôle responsive local](http://localhost:5180/verification-mobile.html), défini dans `web/verification-mobile.html`,
propose 320 × 568, 390 × 568, 390 × 844 et 844 × 390. Il n’est pas inclus dans la construction de production.
Captures : [commandes et modèles](images/atlas-mobile.png), [panneau mobile et retour à la carte](images/atlas-mobile-exploration.png),
[durées sur la carte](images/atlas-accessibilite-mobile.png), [bandeau replié](images/atlas-accessibilite-repliee.png), [bureau](images/atlas-bureau.png) et [paysage](images/atlas-paysage.png).
Ces vérifications dans le navigateur ne remplacent pas un essai sur téléphone physique, notamment pour le clavier et le balayage tactiles.
La compilation contrôle TypeScript ; les tests du pipeline et la règle des fichiers de 200 lignes complètent ces contrôles.
