# Construction de la webmap (Node 24), puis service statique par nginx sans droits root.
FROM node:24-alpine AS construction
WORKDIR /web
COPY package.json package-lock.json ./
RUN npm ci --no-fund --no-audit
COPY . .
RUN npm run build

# nginx 1.31.6 ou plus (failles corrigées en 2026) ; l'image « unprivileged » tourne
# sous l'utilisateur nginx (uid 101) et écoute sur le port 8080.
FROM nginxinc/nginx-unprivileged:1.31.7-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/securite.conf /etc/nginx/snippets/securite.conf
COPY --from=construction /web/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://127.0.0.1:8080/ || exit 1
