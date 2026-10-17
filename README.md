# Lyon sans voiture

**Jusqu’où va le réseau TCL ?** Une carte interactive du réseau de transports en commun lyonnais, calculée à partir
des horaires théoriques GTFS publiés par SYTRAL Mobilités : l’offre heure par heure, la vitesse commerciale tronçon par
tronçon et l’accessibilité en transports en commun, carreau de 200 m par carreau de 200 m.

Toutes les mesures portent sur un jour de référence : le mardi 17 novembre 2026, jour de semaine en période scolaire.

## Trois vues

| Vue | Ce qu’elle montre |
|---|---|
| **L’offre** | Courses par heure sur chaque tronçon entre deux arrêts, départs à chaque arrêt ; un curseur fait défiler la journée de 4 h à 4 h. |
| **La vitesse** | Vitesse commerciale de chaque tronçon (divergente autour de l’allure typique du réseau) et classement des lignes, par période. |
| **L’accessibilité** | Habitants joignables en 30 et 45 minutes depuis chaque carreau habité, et temps de trajet depuis six grands pôles. |

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
- **Accessibilité.** r5py (moteur R5 de Conveyal) : départs minute par minute entre 8 h et 9 h, durée médiane, marche
  comprise, sur les 7 879 carreaux habités de la Métropole.

Le détail est repris dans la fenêtre « Méthode et sources » de la carte.

## Lancer le projet

Prérequis : Python 3.11+, Node 24, Docker.

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

```bash
cd pipeline && .venv/Scripts/python -m pytest
```

Les calculs sont vérifiés sur un mini-réseau GTFS (`tests/conftest.py`) dont chaque résultat se calcule à la main :
services actifs avec ajouts et retraits, exclusion des lignes scolaires, heures après minuit, terminus, vitesse
pondérée, fenêtre glissante, reconstitution des tracés. Chaque test a été éprouvé par mutation : on casse
volontairement le code qu’il couvre et on vérifie qu’il échoue.

## Organisation

Règle du dépôt : aucun fichier de plus de 200 lignes (`python outils/verifier_longueurs.py`, aussi lancé par la CI).

```
pipeline/atlas/       chaîne de traitement (Python + SQL DuckDB)
  sql/                une étape par fichier, de 01_courses à 06_lignes
  osm.py, traces.py   lecture des relations OpenStreetMap, reconstitution des tracés
  accessibilite.py    carreaux Insee et calcul r5py
pipeline/tests/       mini-réseau GTFS et tests
web/src/
  carte/              MapLibre : fond recoloré, expressions, couches, interactions
  composants/         en-tête, onglets, panneaux, fiches, légendes, fenêtres
  etat/               thème, vue active, statistiques
web/deploy/           nginx et ses en-têtes de sécurité
web/public/data/      couches GeoJSON produites par la chaîne
compose.yaml          webmap (nginx derrière Traefik) et conteneur de la chaîne
```

## Charte

L’interface suit la charte de Drekky Studio : fond crème, ardoise pour les éléments d’action, terracotta en touches,
Space Grotesk, IBM Plex Sans et IBM Plex Mono servies depuis le site, arrondi unique de 3 px. Les données en reprennent
les rampes : ardoise pour les quantités, terracotta pour les temps, et une échelle divergente terracotta-ardoise pour
les vitesses. Le fond OpenFreeMap est recoloré aux mêmes teintes. Mise en page pensée d’abord pour le téléphone,
puis pour le bureau (une colonne de lecture et la carte en pleine hauteur, à partir de 900 px).

## Sécurité

Le site est **statique** : ni serveur applicatif, ni base, ni formulaire, ni cookie, ni mesure d’audience.
Seuls les journaux d’accès du serveur web gardent des adresses IP, bornés à trois fichiers de 10 Mo (`compose.yaml`),
comme le décrivent les mentions légales.

- nginx 1.31.7 sans droits root (`nginx-unprivileged`), conteneur en lecture seule, sans capacités
  (`cap_drop: ALL`, `no-new-privileges`), mémoire et processeur limités, aucun port publié (Traefik seulement).
- En-têtes sur toutes les réponses, erreurs 400, 404, 405 et 414 comprises : CSP stricte (seul tiers : les
  tuiles OpenFreeMap, sans `blob:`), HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`. Version de nginx masquée.
- Une adresse inconnue répond un vrai 404 ; fichiers cachés jamais servis ; seuls `GET` et `HEAD` sont acceptés.
- Polices hébergées sur le site, aucune requête vers Google.
- Textes venus des données échappés avant tout affichage en HTML.
- CI : tests, typage, construction, `npm audit --omit=dev`, gitleaks, actions épinglées par empreinte SHA ;
  Dependabot chaque semaine. Image sans les pages d’exemple de nginx.

Vérifié le 17/10/2026 sur l’image de production lancée en local, puis relu par une session indépendante selon la
liste de contrôle du studio (aucun point bloquant ; ses trois écarts mineurs sont corrigés). À refaire en ligne le
jour du déploiement : redirection HTTPS, en-têtes à travers Traefik, `verifier.py` et `scanner.py`.

## Sources et licences

- Horaires théoriques GTFS du réseau TCL, SYTRAL Mobilités, via data.gouv.fr (ODbL).
- Insee, Filosofi 2021, données carroyées à 200 m (Licence Ouverte).
- Contributeurs OpenStreetMap : tracés, réseau piéton, fond de carte OpenFreeMap (ODbL).

Les couches dérivées publiées dans `web/public/data/` sont diffusées sous la même licence ODbL.
Elles décrivent l’offre théorique publiée, pas la circulation réelle.

Conçu et développé par Yanis Lepesant, [Drekky Studio](https://studio.drekky.fr).
