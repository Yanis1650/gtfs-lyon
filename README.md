# Lyon sans voiture

**Jusqu’où va le réseau TCL ?** Une carte interactive du réseau de transports en commun lyonnais, calculée à partir
des horaires théoriques GTFS publiés par SYTRAL Mobilités : l’offre heure par heure, la vitesse commerciale tronçon par
tronçon et l’accessibilité en transports en commun, carreau de 200 m par carreau de 200 m.

Toutes les mesures portent sur un jour de référence : le mardi 17 novembre 2026, jour de semaine en période scolaire.

## Trois vues

| Vue | Ce qu’elle montre |
|---|---|
| **L’offre** | Courses par heure sur chaque tronçon entre deux arrêts, départs à chaque arrêt ; un curseur fait défiler la journée de 4 h à 4 h. Les véhicules s’animent d’après les horaires théoriques, dix fois plus vite que la réalité, à vitesse réelle ou soixante fois plus vite au choix. Une recherche permet de trouver un arrêt. |
| **La vitesse** | Vitesse commerciale de chaque tronçon (divergente autour de l’allure typique du réseau) et classement des lignes, par période. |
| **L’accessibilité** | Part des habitants de la Métropole joignables en 30 et 45 minutes depuis chaque carreau habité, et temps de trajet depuis six grands pôles. |

Sur chaque vue, la carte passe en vue satellite (photographies aériennes de l’IGN) et en relief : carte inclinée,
immeubles à leur hauteur OpenStreetMap.

## Navigation

Sur téléphone et tablette (moins de 900 px), les trois vues restent accessibles dans la barre du bas. Le bouton
**Carte** affiche la carte sur tout l’espace disponible : on la déplace directement avec un doigt. Le bouton voisin
ouvre **Arrêts et recherche**, **Lignes et filtres** ou **Résultats et détails**, selon la vue. Ce panneau défile indépendamment,
sans carte figée au-dessus. Toucher un arrêt, un tronçon ou un carreau ouvre sa fiche ; le bouton Carte permet d’y revenir.
Un balayage horizontal dans le panneau ramène aussi à la carte. Le bouton **Aide** explique les trois usages et permet de les ouvrir.

Dans l’offre, **Animer les véhicules** et **Vue 3D** sont visibles en tête de carte, sur téléphone comme sur bureau.
La barre horaire fine reste accessible pendant la lecture des fiches ; ses réglages regroupent les vitesses ×1, ×10 et ×60. Le libellé distingue les horaires théoriques
de la simulation. La légende peut se replier et son détail expose toutes les classes.
L’activation des véhicules rapproche la carte d’un véhicule en circulation pour montrer sa modélisation ; Satellite reste une commande distincte.
Dans l’accessibilité, **30 min**, **45 min** et **Depuis un pôle**, avec le choix du départ, se règlent sur la carte ; le bandeau se replie en conservant le choix actif.
Le mode **Isochrones** suit le survol sans attendre l’arrêt de la souris, ou le toucher sur mobile, et trace les zones habitées joignables à 15/30/45 min ([méthode, fluidité et recalcul](docs/isochrones.md)).

À partir de 900 px, carte et panneau apparaissent côte à côte, avec les onglets dans l’en-tête et la barre horaire
flottante sur la carte. L’adresse partage la vue (`#offre`, `#vitesse`, `#acces`), pas encore l’heure ou la sélection.
La description et les captures de l’interface sont dans [docs/refonte-atlas.md](docs/refonte-atlas.md).

## Chaîne de traitement

```
GTFS TCL ──► DuckDB (SQL) ──► arrêts logiques, courses du jour, tronçons, lignes ──► GeoJSON ──► Vue 3 + MapLibre
OSM (.pbf) ─┘  └─► tracés manquants reconstitués                                     ▲
Insee Filosofi 2021 ──► carreaux habités ──► r5py / R5 (Docker, Java 21) ─────────────┘
```

- **Arrêts logiques.** Les quais de même nom distants de moins de 250 m, ou rattachés à une même station, forment un arrêt.
- **Tracés reconstitués.** Le flux ne fournit pas le tracé du métro, du tram et des funiculaires. Pour chaque suite
  d’arrêts sans tracé, la chaîne retient la relation OpenStreetMap de la ligne qui passe au plus près des arrêts, dans leur
  ordre ; 76 suites sur 78 sont ainsi recalées, à un écart moyen de 1 à 10 m.
- **Vitesse commerciale.** Rapport de sommes (kilomètres cumulés sur heures cumulées), jamais moyenne de vitesses. Les
  horaires étant arrondis à la minute, la vitesse d’un tronçon est mesurée sur une fenêtre de cinq inter-arrêts.
- **Véhicules en circulation.** Pour chaque course, une heure par arrêt ; quand le flux donne la même minute à plusieurs
  arrêts de suite, le temps est réparti selon la distance. La carte déplace chaque véhicule le long des tronçons publiés,
  avec un court arrêt puis une accélération et un freinage. Un fichier par heure, 50 Ko compressés au plus. De près,
  chaque véhicule prend son gabarit (bus de 12 m, articulés de 18 m, trams en cinq modules, métros voiture par voiture),
  chaque caisse suivant la courbe de la voie ; métros et funiculaires, souterrains, restent à plat sous les immeubles.
- **Accessibilité.** r5py (moteur R5 de Conveyal) : départs minute par minute entre 8 h et 9 h, durée médiane, marche
  à 3,6 km/h comprise, sur les 7 879 carreaux habités de la Métropole. L’archive transmise à R5 exclut les mêmes agences
  scolaires que l’offre ; les références aux lignes et courses exclues sont retirées des tables GTFS.

Le détail est repris dans la fenêtre « Méthode et sources » de la carte.

## Communication LinkedIn

Le dossier `Linkedin/` contient le post, trois visuels portrait, la capture 3D, les textes alternatifs et les sources
modifiables. Son `README.md` décrit l’ordre des images et les précautions de lecture.

L’image de partage de 1 200 × 627 pixels est dans `web/public/partage/lyon-sans-voiture.png` et déclarée dans les
métadonnées de la page. Les visuels sont régénérables avec `node outils/generer_linkedin.cjs` (Node.js et `sharp` requis).

## Lancer le projet

Pour consulter les données déjà exportées : Node.js 24. Aucun recalcul n’est nécessaire.

```powershell
cd web
npm ci
npm run dev -- --host 127.0.0.1 --port 5180 --strictPort
```

Ouvrir [localhost:5180](http://localhost:5180/). Le fond de carte et les photographies aériennes demandent une connexion.
Le [contrôle responsive local](http://localhost:5180/verification-mobile.html) propose les petits écrans, le portrait
et le paysage. Cette page de développement ne fait pas partie du site construit pour la production.

Pour recalculer les données : Python 3.11+ et Docker ; R5 et Java 21 s’exécutent dans le conteneur du pipeline.

```bash
# 1. Chaîne de traitement (DuckDB)
cd pipeline
python -m venv .venv && .venv/Scripts/python -m pip install -e ".[dev]"   # bin/python sous Linux et macOS
.venv/Scripts/python -m atlas telecharger
.venv/Scripts/python -m atlas calculer

# 2. Accessibilité (r5py, Java 21) dans le conteneur
cd ..
docker compose --profile pipeline run --rm pipeline accessibilite

# 3. Export des couches, puis la carte
pipeline/.venv/Scripts/python -m atlas exporter
cd web && npm install && npm run dev
```

La chaîne complète tient aussi dans le conteneur : `docker compose --profile pipeline run --rm pipeline tout`.

## Tests

Depuis la racine du dépôt, sous PowerShell :

```powershell
pipeline/.venv/Scripts/python -m pytest pipeline/tests
pipeline/.venv/Scripts/python outils/verifier_longueurs.py
cd web
npm run build
npm test
```

Les calculs sont vérifiés sur un mini-réseau GTFS (`tests/conftest.py`) dont chaque résultat se calcule à la main :
services actifs avec ajouts et retraits, exclusion des lignes scolaires, heures après minuit, terminus, vitesse
pondérée, fenêtre glissante, reconstitution des tracés. Chaque test a été éprouvé par mutation : on casse
volontairement le code qu’il couvre et on vérifie qu’il échoue.

La compilation vérifie aussi TypeScript. La CI ajoute l’audit des dépendances de production et la recherche de secrets.
Le parcours manuel de l’interface et les limites des vérifications mobiles sont décrits dans la documentation de l’interface.

## Déploiement sur le serveur

Le dépôt définit une CI de vérification. La commande prévue pour reconstruire le site sur le serveur, depuis le dépôt
actualisé, est `docker compose up -d --build web`. Elle utilise nginx derrière le réseau externe `traefik-public`.
Le domaine peut être défini avec `ATLAS_DOMAINE` ; sa valeur par défaut est `atlas-lyon.drekky.fr`.
L’envoi des commits et cette reconstruction sont deux étapes distinctes.

## Organisation

Règle du dépôt : aucun fichier de plus de 200 lignes (`python outils/verifier_longueurs.py`, aussi lancé par la CI).

```
pipeline/atlas/       chaîne de traitement (Python + SQL DuckDB)
  sql/                une étape par fichier, de 01_courses à 06_lignes
  osm.py, traces.py   lecture des relations OpenStreetMap, reconstitution des tracés
  accessibilite.py    carreaux Insee et calcul r5py
  isochrones.py       temps R5 par origine, pour les isochrones interactives
  vehicules.py        courses heure par heure, horaires lissés, pour l'animation
pipeline/tests/       mini-réseau GTFS et tests
web/src/
  carte/              MapLibre : fond recoloré, satellite et relief, expressions, couches, interactions
  composants/         en-tête, navigation mobile, onglets, barre horaire, panneaux, fiches, légendes, fenêtres
  etat/               thème, vue active, statistiques, horloge des véhicules
  simulation/         position des véhicules le long des tronçons, gabarits et maquettes 3D, calque de dessin
web/deploy/           nginx et ses en-têtes de sécurité
web/public/data/      couches GeoJSON produites par la chaîne
compose.yaml          webmap (nginx derrière Traefik) et conteneur de la chaîne
docs/                 description de l’interface et captures de vérification
Linkedin/             publication, visuels, sources et archive du kit
```

## Charte

L’interface suit une charte sobre : fond crème, ardoise pour les éléments d’action, terracotta en touches,
Space Grotesk, IBM Plex Sans et IBM Plex Mono servies depuis le site, commandes arrondies à 7 px. Les données en reprennent
les rampes : ardoise pour les quantités, terracotta pour les temps, et une échelle divergente terracotta-ardoise pour
les vitesses. Le fond OpenFreeMap est recoloré aux mêmes teintes. Mise en page pensée d’abord pour le téléphone,
puis pour le bureau (une colonne de lecture et la carte en pleine hauteur, à partir de 900 px).

La direction **Atlas** utilise un en-tête compact, une navigation adaptée au téléphone, une colonne de lecture
resserrée sur bureau et des fiches qui mettent le résultat principal en valeur. La barre horaire mesure environ 52 px ;
les réglages secondaires se déplient à la demande. Les marges de sécurité de l’écran sont prises en compte sur mobile.

## Sécurité

Le site est **statique** : ni serveur applicatif, ni base, ni formulaire, ni cookie, ni mesure d’audience.
Seuls les journaux d’accès du serveur web gardent des adresses IP, bornés à trois fichiers de 10 Mo (`compose.yaml`),
comme le décrivent les mentions légales.

- nginx 1.31.7 sans droits root (`nginx-unprivileged`), conteneur en lecture seule, sans capacités
  (`cap_drop: ALL`, `no-new-privileges`), mémoire et processeur limités, aucun port publié (Traefik seulement).
- En-têtes sur toutes les réponses, erreurs 400, 404, 405 et 414 comprises : CSP stricte (seuls tiers : les
  tuiles OpenFreeMap et, en vue satellite, les photographies de l’IGN, sans `blob:`), HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`. Version de nginx masquée.
- Une adresse inconnue répond un vrai 404 ; fichiers cachés jamais servis ; seuls `GET` et `HEAD` sont acceptés.
- Polices hébergées sur le site, aucune requête vers Google.
- Textes venus des données échappés avant tout affichage en HTML.
- CI : tests, typage, construction, `npm audit --omit=dev`, gitleaks, actions épinglées par empreinte SHA ;
  Dependabot chaque semaine. Image sans les pages d’exemple de nginx.

Vérifié le 17/10/2026 sur l’image de production lancée en local, puis relu par une session indépendante selon une
liste de contrôle de sécurité (aucun point bloquant ; ses trois écarts mineurs sont corrigés). À refaire en ligne le
jour du déploiement : redirection HTTPS, en-têtes à travers Traefik, `verifier.py` et `scanner.py`.

## Sources et licences

- Horaires théoriques GTFS du réseau TCL, SYTRAL Mobilités, via data.gouv.fr (ODbL).
- Insee, Filosofi 2021, données carroyées à 200 m (Licence Ouverte).
- Contributeurs OpenStreetMap : tracés, réseau piéton, fond de carte OpenFreeMap, hauteur des immeubles (ODbL).
- IGN, BD ORTHO® : photographies aériennes de la vue satellite (Licence Ouverte 2.0).

Les couches dérivées publiées dans `web/public/data/` sont diffusées sous la même licence ODbL.
Elles décrivent l’offre théorique publiée, pas la circulation réelle.

Conçu et développé par Yanis Lepesant · [portfolio](https://portfolio.drekky.fr/) · yanis@drekky.fr
