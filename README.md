# token-ui

A self-service **API token management** UI. Static single-page app, served behind a backend proxy that provides the API. It lists, creates, extends, and deletes API tokens; all authorization and lifecycle logic lives in the backend.

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

Serve `dist/` with any static file server. A `Dockerfile` (Caddy) is included.

## Configuration

The app reads runtime configuration from `config.js` (`window.__APP_CONFIG__`) — no rebuild needed to retarget a deployment:

| Field       | Default              | Description                              |
|-------------|----------------------|------------------------------------------|
| `apiPrefix` | `<base>/api`         | Where API calls are routed               |
| `demo`      | `false`              | Run against in-memory fixtures           |
| `apiNotice` | (built-in)           | Informational text in the table footer   |

`scripts/build.mjs` regenerates `config.js` from the `API_PREFIX`, `API_NOTICE`, and `DEMO` environment variables, so the Docker image / CI can configure it at build time:

```sh
docker build --build-arg API_PREFIX=/token-ui/api --build-arg API_NOTICE="…" -t token-ui .
```

All fonts are self-hosted under `ds/assets/fonts` — nothing is fetched from a CDN at runtime, and the Docker build needs no network access for assets.

See [AGENTS.md](./AGENTS.md) for architecture and contribution notes.
