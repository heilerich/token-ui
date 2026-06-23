# AGENTS.md

## Project Overview

This repo hosts **multiple independent static pages** for the Kubeflow dashboard, built from a shared toolchain and design system. Each page is a self-contained static app served from its own path prefix in the final image and is typically embedded as an iframe inside the Central Dashboard chrome (the top bar / sidebar are provided by that host, not by these pages).

Current pages:

| Prefix        | Page        | Purpose                                                                 |
|---------------|-------------|-------------------------------------------------------------------------|
| `/home/`      | **home**    | Dashboard home — API-driven announcements + platform service cards.     |
| `/token-ui/`  | **token-ui**| Self-service API token management (list / create / extend / delete).    |

The site root `/` redirects to `/home/`.

All pages are served behind a backend proxy that provides the actual API endpoints; the frontends carry no business logic.

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
ds/                       # Vendored Kubeflow Design System — SHARED, served at /ds
├── styles.css            # Entry point (@imports tokens + base); self-hosted fonts only
├── kf-elements.js        # Custom-element runtime (<kf-*> tags)
├── tokens/*.css          # Color / type / spacing / font tokens
└── assets/fonts/*.woff2  # Roboto + Material Icons, self-hosted (no CDN)
pages/
├── shared/               # SHARED TypeScript modules (compiled to /shared)
│   ├── config.ts         # Reads window.__APP_CONFIG__ → baseConfig (apiPrefix, demo)
│   ├── http.ts           # fetch transport: prefix, namespace, retry, demo, JSON
│   ├── dom.ts            # Tiny DOM helpers (esc, querySelector wrappers, dates)
│   └── kf-elements.d.ts  # Ambient types for the vendored custom elements
├── home/                 # Page → served at /home/
│   ├── index.html        # Content-only shell (no top bar / sidebar — host provides it)
│   ├── app.css           # Page styles (DS tokens)
│   ├── config.js         # Runtime config (window.__APP_CONFIG__); per-deploy override
│   ├── favicon.svg
│   ├── mocks/api/        # Fixtures (services.json, announcements.json)
│   └── src/              # types.ts, api.ts, app.ts, main.ts
└── token-ui/             # Page → served at /token-ui/
    ├── index.html, app.css, config.js, favicon.svg
    ├── mocks/api/        # Fixtures (tokens.json, scopes.json)
    └── src/              # types.ts, config.ts, api.ts, app.ts, main.ts
scripts/
├── build.mjs             # Multi-page static assembler (Node built-ins only)
└── dev-server.mjs        # Dev/preview server + per-page mock APIs (Node built-ins only)
static/                   # Served from site root (robots.txt, / → /home/ redirect)
.github/workflows/        # CI build + GitHub Pages demo deployment
```

### How a page resolves shared resources

Each page references the shared design system as `../ds/...` (from `/home/` → `/ds/`)
and the compiled shared modules as `../../shared/...` (from `/home/app/x.js` → `/shared/x.js`).
Those relative specifiers are written in the source and emitted verbatim by `tsc`
(no bundler rewriting), and they resolve identically in the built `dist/` layout:

```
dist/
├── ds/                 # shared design system (one copy)
├── shared/             # shared compiled JS  (one copy)
├── index.html          # → /home/ redirect
├── home/      { index.html, app.css, config.js, favicon.svg, app/, api/(demo) }
└── token-ui/  { index.html, app.css, config.js, favicon.svg, app/, api/(demo) }
```

### Adding a new page

1. Create `pages/<name>/` with `index.html`, `app.css`, `config.js`, `favicon.svg`,
   `src/` (importing shared modules via `../../shared/*.js`), and optional `mocks/api/`.
2. Register it in the `PAGES` array of **both** `scripts/build.mjs` and
   `scripts/dev-server.mjs` (dir, prefix, env-config overrides, mock handler).
3. Add a `handle /<prefix>/*` block to the `Caddyfile`.

## Key Design Decisions

- **Multiple independent pages, shared toolchain.** Pages live under `pages/<name>/` and share the design system (`ds/`), the build tools (`scripts/`), and common TypeScript modules (`pages/shared/`). Each page builds to its own path prefix and can be embedded independently; nothing couples one page to another.
- **No backend logic in this project.** Each page's `src/api.ts` is a thin client over the shared transport (`pages/shared/http.ts`); the UI refreshes state from the server after each mutation. All lifecycle logic is a server responsibility.
- **Runtime configuration via `config.js`.** Each page ships a plain `config.js` that sets `window.__APP_CONFIG__`, so the same static bundle is configurable per deployment (`apiPrefix`, `demo`, and page-specific extras like token-ui's `apiNotice`). `scripts/build.mjs` regenerates it from env vars (`<PAGE>_API_PREFIX`, `API_NOTICE`, `DEMO`).
- **Base-path agnostic.** Asset references are relative and each page's API prefix defaults to `<base>/api` (resolved from `document.baseURI`), so `/home/` calls `/home/api`, `/token-ui/` calls `/token-ui/api`, with no rebuild needed.
- **Demo mode.** `config.demo = true` activates a client-side mock that reads initial data from static JSON (`GET <path>` → `<prefix><path>.json`). This powers the GitHub Pages preview (`npm run build:demo`).
- **Mock server in dev only.** `scripts/dev-server.mjs` provides per-page mock APIs during `npm run dev` (full CRUD for token-ui, read-only for home). Never part of a production build.
- **Self-hosted assets / airgapped.** All fonts (Roboto and Material Icons) are vendored under `ds/assets/fonts`; nothing is loaded from a CDN at runtime, and the Docker build needs no network for assets.

## API Contracts

Each page expects these endpoints relative to its configured prefix. See each page's `src/types.ts` for request/response shapes.

**home** (`/home/api`)

| Method | Path             | Description                                                    |
|--------|------------------|----------------------------------------------------------------|
| `GET`  | `/services`      | Platform service cards (icon, title, description, optional status badge) |
| `GET`  | `/announcements` | Announcements (title, body, `info`/`important` category, optional link) |

**token-ui** (`/token-ui/api`)

| Method   | Path              | Description                        |
|----------|-------------------|------------------------------------|
| `GET`    | `/tokens`         | List all tokens                    |
| `POST`   | `/tokens`         | Create a token (returns secret)    |
| `DELETE` | `/tokens/:id`     | Delete a token                     |
| `PATCH`  | `/tokens/:id`     | Extend a token's expiry            |
| `GET`    | `/scopes`         | List available scopes              |

## Scripts

| Command              | Purpose                                                  |
|----------------------|----------------------------------------------------------|
| `npm run dev`        | `tsc --watch` + dev server with mock API                 |
| `npm run build`      | Production build into `dist/` (`tsc` + assemble)          |
| `npm run build:demo` | Demo build with in-memory mock data for GitHub Pages     |
| `npm run preview`    | Serve the demo build locally                             |
| `npm run check`      | Type-check with `tsc --noEmit`                           |

## Guidelines for Contributing

- Each page is rendered by its `src/app.ts`, which owns all state and API interaction and composes the design-system `<kf-*>` web components (or plain elements styled with DS tokens). Keep view logic there; keep the API client thin (serialize/deserialize only, no business logic).
- All mutations should call the API first, then refresh state from the server (not optimistically update local state).
- Use the design-system CSS custom properties (`ds/tokens/*`) for any new styling — do not hard-code colors, spacing, or type.
- Put genuinely cross-page code in `pages/shared/`; import it as `../../shared/<name>.js` from a page's `src/`.
- Write relative module imports with explicit `.js` extensions (e.g. `import { request } from '../../shared/http.js'`) so the compiled output runs natively in the browser without a bundler. The shared-module specifiers depend on the page-code-one-level-under-prefix / shared-one-level-under-root layout — keep it.
- Do not reintroduce a runtime dependency or a bundler without a strong reason — the minimal footprint is a feature.
- The `ds/` directory is a vendored upstream artifact; prefer not to fork it. If the design system updates, re-vendor it.
