# AGENTS.md

## Project Overview

**token-ui** is a self-service API token management interface. It is a static single-page application that is designed to be served behind a backend proxy which provides the actual API endpoints. The frontend handles listing, creating, extending, and deleting API tokens, while all authorization and token lifecycle logic lives in the backend.

## Tech Stack

- **Framework:** SvelteKit 2 with Svelte 5 (runes mode)
- **Styling:** Tailwind CSS 4
- **Build:** Vite 7, static adapter (outputs to `build/`)
- **Language:** TypeScript

## Project Structure

```
src/
├── lib/
│   ├── api.ts              # API client — all backend communication
│   ├── types.ts             # Shared TypeScript interfaces
│   └── components/
│       ├── Modal.svelte             # Reusable modal shell
│       ├── TokenList.svelte         # Token table with actions
│       ├── CreateTokenModal.svelte  # Name + scope selection form
│       ├── DeleteConfirmModal.svelte
│       └── SecretDisplayModal.svelte  # One-time secret reveal
├── routes/
│   ├── +layout.svelte       # Root layout (imports Tailwind)
│   ├── +layout.ts           # SPA config (prerender, no SSR)
│   └── +page.svelte         # Main page — wires components + state
├── app.css                  # Tailwind entry point
└── app.html                 # HTML shell
mocks/
├── plugin.ts                # Vite dev server plugin (CRUD mock API)
└── api/
    ├── tokens.json           # Fixture data for tokens
    └── scopes.json           # Fixture data for scopes
.github/
└── workflows/
    └── deploy-pages.yml      # GitHub Pages demo deployment
```

## Key Design Decisions

- **No backend logic in this project.** The API client (`src/lib/api.ts`) dispatches HTTP requests and the UI refreshes state from the server after each mutation. Scope lists, token creation, deletion, and extension are all server-side responsibilities.
- **Configurable API prefix.** Set `VITE_API_PREFIX` at build time to control where API calls are routed (defaults to `/api`).
- **Demo mode.** Setting `VITE_DEMO=true` at build time activates a client-side mock that loads initial data from static JSON files and handles mutations in memory. This powers the GitHub Pages preview.
- **Mock server in dev only.** The Vite plugin in `mocks/plugin.ts` provides a full CRUD mock API during `npm run dev`. It is never included in production builds.

## API Contract

The frontend expects these endpoints relative to the configured prefix:

| Method   | Path              | Description                        |
|----------|-------------------|------------------------------------|
| `GET`    | `/tokens`         | List all tokens                    |
| `POST`   | `/tokens`         | Create a token (returns secret)    |
| `DELETE` | `/tokens/:id`     | Delete a token                     |
| `PATCH`  | `/tokens/:id`     | Extend a token's expiry            |
| `GET`    | `/scopes`         | List available scopes              |

See `src/lib/types.ts` for request/response shapes.

## Scripts

| Command             | Purpose                                              |
|---------------------|------------------------------------------------------|
| `npm run dev`       | Start dev server with mock API                       |
| `npm run build`     | Production build (no mocks)                          |
| `npm run build:demo`| Demo build with static mock data for GitHub Pages    |
| `npm run check`     | Type-check with svelte-check                        |

## Guidelines for Contributing

- Use Svelte 5 runes (`$state`, `$derived`, `$props`) — no legacy `let` reactivity or stores.
- Components receive callbacks as props (e.g. `ondelete`, `onclose`) — the page component owns all state and API interaction.
- Keep the API client thin: it should only serialize requests and deserialize responses, never contain business logic.
- All mutations should call the API first, then refresh the token list from the server (not optimistically update local state).
