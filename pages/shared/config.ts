/*
 * Shared runtime-configuration reader.
 *
 * Each page ships a plain `config.js` that sets `window.__APP_CONFIG__` before
 * the app module loads, so a deployment can be retargeted WITHOUT rebuilding the
 * static bundle (see scripts/build.mjs, which regenerates it from env vars).
 *
 * Pages are mounted under their own path prefix (e.g. `/home/`, `/token-ui/`)
 * and are typically embedded as iframes inside the dashboard chrome. Because the
 * API prefix defaults to `<base>/api` — resolved at runtime from the page's base
 * URL — the same bundle works under any mount path without a build-time base.
 */

/** Runtime configuration injected via `config.js` (`window.__APP_CONFIG__`). */
export interface AppConfig {
	/** Where API calls are routed. Defaults to `<base>/api`. */
	apiPrefix?: string;
	/** When true, reads run against static JSON fixtures (demo / GitHub Pages). */
	demo?: boolean;
	/** Page-specific extras are read directly off the raw object. */
	[key: string]: unknown;
}

declare global {
	interface Window {
		__APP_CONFIG__?: AppConfig;
	}
}

const raw: AppConfig = (typeof window !== 'undefined' && window.__APP_CONFIG__) || {};

/**
 * Base href the page is served under (e.g. `/home/` or `/token-ui/`), resolved
 * from the document so the app works under any mount path without a build-time
 * base.
 */
const basePath = new URL('.', document.baseURI).pathname.replace(/\/$/, '');

export const baseConfig = {
	/** The raw, untyped config object — pages read their own extra fields here. */
	raw,
	apiPrefix: raw.apiPrefix ?? `${basePath}/api`,
	demo: raw.demo ?? false
} as const;
