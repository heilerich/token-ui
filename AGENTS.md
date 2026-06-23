# AGENTS.md

## Project Overview

**token-ui** is a self-service API token management interface. It is a static single-page application designed to be served behind a backend proxy that provides the actual API endpoints. The frontend handles listing, creating, extending, and deleting API tokens, while all authorization and token lifecycle logic lives in the backend.

## Tech Stack

- **Framework:** None. Plain Web Components + vanilla TypeScript.
  - The UI is built from the **Kubeflow Design System** custom elements (`<kf-button>`, `<kf-card>`, `<kf-toolbar>`, `<kf-status-icon>`, `<kf-chip>`, `<kf-icon-button>`, `<kf-panel>`, `<kf-input>`), vendored under `ds/`.
- **Styling:** Plain CSS driven by the design-system CSS custom properties (`ds/tokens/*.css`). No utility framework.
- **Build:** `tsc` compiles `src/*.ts` to browser-native ES modules; a small Node script (`scripts/build.mjs`, built-ins only) assembles the static bundle into `dist/`.
- **Language:** TypeScript.
- **Dependencies:** a single dev dependency — `typescript`. No runtime dependencies.

> **Why no framework?** The design system the team adopted is itself framework-agnostic vanilla custom elements with no build step. Dropping Svelte/Tailwind/Vite removes hundreds of transitive packages, shrinking both the maintenance burden and the supply-chain attack surface. The only unavoidable tool is a TypeScript transpiler (`tsc`), since browsers can't run `.ts` directly.

## Project Structure

```
index.html                # Static shell — links the DS, page CSS, config, app module
config.js                 # Runtime config (window.__APP_CONFIG__); overridable per deploy
app.css                   # Page styles (built on DS tokens)
favicon.svg
ds/                       # Vendored Kubeflow Design System (no build step)
├── styles.css            # Entry point (@imports tokens + base); self-hosted fonts only
├── kf-elements.js        # Custom-element runtime (<kf-*> tags)
├── tokens/*.css          # Color / type / spacing / font tokens
└── assets/fonts/*.woff2  # Roboto + Material Icons, self-hosted (no CDN)
src/
├── types.ts              # Shared interfaces + AppConfig
├── config.ts             # Reads window.__APP_CONFIG__ with sensible defaults
├── api.ts                # API client — all backend communication (+ retry, demo mode)
├── dom.ts                # Tiny DOM helpers (esc, querySelector wrappers, date format)
├── app.ts                # Page controller — wires the DS components to the API
├── main.ts               # Entry point (calls app.init)
└── kf-elements.d.ts      # Ambient types for the vendored custom elements
scripts/
├── build.mjs             # Static bundle assembler (Node built-ins only)
└── dev-server.mjs        # Dev/preview server + mock API (Node built-ins only)
mocks/api/                # Fixture data (tokens.json, scopes.json)
static/                   # Served from site root (robots.txt)
.github/workflows/        # CI build + GitHub Pages demo deployment
```

## Key Design Decisions

- **No backend logic in this project.** The API client (`src/api.ts`) dispatches HTTP requests and the UI refreshes state from the server after each mutation. Scope lists, token creation, deletion, and extension are all server-side responsibilities.
- **Runtime configuration via `config.js`.** Instead of build-time env vars, a plain `config.js` sets `window.__APP_CONFIG__` so the same static bundle is configurable per deployment (`apiPrefix`, `demo`, `apiNotice`). `scripts/build.mjs` regenerates it from `API_PREFIX` / `API_NOTICE` / `DEMO` environment variables.
- **Base-path agnostic.** All asset references are relative and the API prefix defaults to `<base>/api` (resolved from `document.baseURI`), so the app works at `/`, `/token-ui/`, or any sub-path without rebuilding.
- **Demo mode.** `config.demo = true` activates a client-side mock that loads initial data from static JSON and handles mutations in memory. This powers the GitHub Pages preview (`npm run build:demo`).
- **Mock server in dev only.** `scripts/dev-server.mjs` provides a full CRUD mock API during `npm run dev`. It is never part of a production build.
- **Self-hosted assets / airgapped.** All fonts (Roboto and Material Icons) are vendored under `ds/assets/fonts`; nothing is loaded from a CDN at runtime, and the Docker build needs no network for assets.

## API Contract

The frontend expects these endpoints relative to the configured prefix:

| Method   | Path              | Description                        |
|----------|-------------------|------------------------------------|
| `GET`    | `/tokens`         | List all tokens                    |
| `POST`   | `/tokens`         | Create a token (returns secret)    |
| `DELETE` | `/tokens/:id`     | Delete a token                     |
| `PATCH`  | `/tokens/:id`     | Extend a token's expiry            |
| `GET`    | `/scopes`         | List available scopes              |

See `src/types.ts` for request/response shapes.

## Scripts

| Command              | Purpose                                                  |
|----------------------|----------------------------------------------------------|
| `npm run dev`        | `tsc --watch` + dev server with mock API                 |
| `npm run build`      | Production build into `dist/` (`tsc` + assemble)          |
| `npm run build:demo` | Demo build with in-memory mock data for GitHub Pages     |
| `npm run preview`    | Serve the demo build locally                             |
| `npm run check`      | Type-check with `tsc --noEmit`                           |

## Guidelines for Contributing

- The page is rendered by `src/app.ts`, which owns all state and API interaction and composes the design-system `<kf-*>` web components. Keep view logic there; keep the API client thin (serialize/deserialize only, no business logic).
- All mutations should call the API first, then refresh the token list from the server (not optimistically update local state).
- Use the design-system CSS custom properties (`ds/tokens/*`) for any new styling — do not hard-code colors, spacing, or type.
- Write relative module imports with explicit `.js` extensions (e.g. `import { config } from './config.js'`) so the compiled output runs natively in the browser without a bundler.
- Do not reintroduce a runtime dependency or a bundler without a strong reason — the minimal footprint is a feature.
- The `ds/` directory is a vendored upstream artifact; prefer not to fork it. If the design system updates, re-vendor it.
