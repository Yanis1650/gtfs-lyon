# Service statique et compression

Le service `web` du [compose](../compose.yaml) sert le site construit par Vite avec nginx 1.31.7,
derrière Traefik. Il ne publie aucun port sur le serveur et conserve ses limites : un demi-cœur,
128 Mo de mémoire, lecture seule, utilisateur non root, capacités retirées et interdiction de nouveaux privilèges.

## Compression pendant la construction

Le [Dockerfile](../web/Dockerfile) construit le site, puis lance
[`deploy/precompresser.mjs`](../web/deploy/precompresser.mjs) dans l’étape Node.
Il crée une variante `.gz` à côté de chaque fichier HTML, CSS, JavaScript, JSON, GeoJSON, binaire d’isochrones,
SVG, texte ou XML. Les originaux restent présents et les dates de modification sont conservées.
Les images PNG et les polices déjà compressées ne sont pas retraitées. Aucune dépendance n’est ajoutée.
Les variantes restent dans l’image, hors du dépôt et des données sources.

La [configuration nginx](../web/deploy/nginx.conf) utilise :

```nginx
gzip off;
gzip_static on;
gzip_vary on;
gzip_proxied any;
```

`gzip_static on` choisit le fichier préparé lorsque le client accepte gzip ; les autres clients reçoivent l’original.
La compression à la volée reste désactivée. `Vary: Accept-Encoding` distingue les variantes pour les caches ;
`gzip_proxied any` permet aussi la compression lorsqu’un relais ajoute un en-tête `Via`.
Les règles de cache restent les mêmes : revalidation des données et de la page, cache long des ressources à empreinte.
Le navigateur décompresse les réponses automatiquement ; le format et les octets des lignes d’isochrones restent inchangés.

Références : [gzip statique](https://nginx.org/en/docs/http/ngx_http_gzip_static_module.html)
et [négociation des réponses](https://nginx.org/en/docs/http/ngx_http_gzip_module.html#gzip_vary).

## Vérifier l’image en local

La CI construit et lance l’image avec les restrictions de production, puis vérifie :

- gzip, identité et refus explicite de gzip, y compris pour les fichiers `.bin` ;
- égalité des octets après décompression, dates, ETag, `HEAD` et revalidation `304` ;
- cache, types MIME, en-têtes de sécurité et requête relayée avec `Via` ;
- refus des méthodes autres que GET/HEAD, vrais 404 et absence des fichiers privés ou de développement.

Reproduire sur un port local libre, depuis la racine du dépôt :

```bash
docker build -t atlas-verification ./web
docker run -d --name atlas-verification --read-only --tmpfs /tmp \
  --cap-drop ALL --security-opt no-new-privileges:true --memory 128m --cpus 0.5 \
  -p 127.0.0.1:8080:8080 atlas-verification
python outils/verifier_compression.py http://127.0.0.1:8080
docker rm -f atlas-verification
```

Sous PowerShell, utiliser une seule ligne pour `docker run` et
`pipeline/.venv/Scripts/python.exe` pour le contrôle. Celui-ci ne lance aucun test de charge.
`npm test` dans `web/` vérifie aussi la génération gzip, ses dates et ses octets.
Un simple `npm run build` produit le site Vite ; l’étape de précompression est ajoutée par le Dockerfile.

Vérification locale du 18 octobre 2026 : les 7 879 fichiers binaires passent de 62,08 à 4,75 Mo.
Avec 30 téléchargements simultanés de `troncons.geojson`, un demi-cœur et 128 Mo, le plus lent passe
de 8,95 s (ancienne image, compression dynamique) à 0,146 s (nouvelle image). Les octets décompressés
sont identiques. Ce test traverse Docker en local ; il ne mesure ni Internet ni le serveur public.

## Publier sur le serveur

Depuis le dépôt du serveur, actualisé à la version souhaitée :

```bash
docker compose up -d --build web
docker compose ps web
python3 outils/verifier_compression.py https://atlas-lyon.drekky.fr/
```

Le push Git et la reconstruction sur le serveur sont distincts. Le dernier contrôle vérifie le chemin complet
à travers Traefik. Ne pas reproduire un test de charge public pour vérifier la présence des fichiers gzip.
Le correctif n’ajoute pas de limite par adresse IP : les visiteurs d’une même entreprise ou d’un même lieu
peuvent partager une adresse. Les limites de ressources du conteneur restent en place.

## Journaux

Le compose limite les journaux du conteneur nginx à trois fichiers de 10 Mo. Traefik a son propre journal
et sa rotation est configurée sur le serveur, hors de ce dépôt. L’audit fourni pour ce déploiement indique aussi
trois fichiers de 10 Mo pour Traefik ; cette limite doit rester alignée avec les mentions légales.
