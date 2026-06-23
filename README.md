# token-ui

**Multiple independent static pages** for the Kubeflow dashboard, sharing one toolchain and design system. Each page builds to its own path prefix in the final image and is typically embedded as an iframe inside the Central Dashboard chrome.

| Prefix        | Page        | Purpose                                                            |
|---------------|-------------|-------------------------------------------------------------------|
| `/home/`      | **home**    | Dashboard home — announcements + platform service cards (API-driven). |
| `/token-ui/`  | **token-ui**| Self-service API token management (list / create / extend / delete). |

`/` redirects to `/home/`.

Built with **plain Web Components + TypeScript** on the Kubeflow Design System — no framework, no bundler, no runtime dependencies. The only build tool is the TypeScript compiler.

## Develop

```sh
npm install        # installs a single dev dependency: typescript
npm run dev        # tsc --watch + dev server with a mock API → http://localhost:5173
```

## Build

```sh
npm run build      # → dist/  (static files, ready to serve)
npm run check      # type-check only
npm run preview    # serve the demo build locally
```

Serve `dist/` with any static file server. A `Dockerfile` (Caddy) is included and serves every page from its prefix, with `/` redirecting to `/home/`.

## Configuration

Each page reads runtime configuration from its own `config.js` (`window.__APP_CONFIG__`) — no rebuild needed to retarget a deployment:

| Field       | Default              | Description                                        |
|-------------|----------------------|----------------------------------------------------|
| `apiPrefix` | `<base>/api`         | Where API calls are routed (e.g. `/home/api`)      |
| `demo`      | `false`              | Read against static JSON fixtures                  |
| `apiNotice` | (built-in)           | token-ui only — informational text in the footer   |

`scripts/build.mjs` regenerates each `config.js` from environment variables, so the Docker image / CI can configure it at build time. Per-page prefixes default to `<base>/api`, so the common case needs no overrides:

```sh
docker build \
  --build-arg API_NOTICE="…" \
  --build-arg HOME_API_PREFIX=/home/api \
  --build-arg TOKEN_UI_API_PREFIX=/token-ui/api \
  -t token-ui .
```

All fonts are self-hosted under `ds/assets/fonts` — nothing is fetched from a CDN at runtime, and the Docker build needs no network access for assets.

See [AGENTS.md](./AGENTS.md) for architecture and contribution notes.
