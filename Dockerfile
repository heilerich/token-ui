FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG BASE_PATH=/token-ui
ARG VITE_API_NOTICE="Point your tool to https://example.com/v1 to access the API. Your tool should be compatible to the OpenAI API specification."
RUN npm run build

FROM caddy:2-alpine
RUN apk upgrade
COPY --from=build /app/build /srv
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 8080
