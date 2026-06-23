# ── Build stage ───────────────────────────────────────────────
# Compiles the TypeScript app (tsc) and assembles the static bundle.
# The only build dependency is `typescript`; all assets — including the
# Roboto and Material Icons fonts — are vendored in the repo (ds/assets),
# so no CDN or font download happens here. The build runs fully offline
# apart from `npm ci` resolving `typescript` from the configured registry.
FROM --platform=$BUILDPLATFORM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Per-deployment configuration baked into config.js at build time.
# Override with --build-arg. Leave API_PREFIX empty to use the default
# (<base>/api, resolved at runtime from the page's base URL).
ARG API_PREFIX=""
ARG API_NOTICE="Point your tool to https://example.com/v1 to access the API. Your tool should be compatible to the OpenAI API specification."
ENV API_PREFIX=${API_PREFIX}
ENV API_NOTICE=${API_NOTICE}
RUN npm run build

# ── Serve stage ───────────────────────────────────────────────
FROM caddy:2-alpine
RUN apk upgrade
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
RUN setcap -r /usr/bin/caddy
EXPOSE 8080
