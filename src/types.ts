export interface Token {
	id: string;
	name: string;
	scopes: string[];
	expires_at: string;
	created_at: string;
}

export interface CreateTokenRequest {
	name: string;
	scopes: string[];
}

export interface CreateTokenResponse {
	token: Token;
	secret: string;
}

export interface Scope {
	id: string;
	name: string;
	description: string;
}

export type TokenExtensionDuration = '720h' | '4380h' | '8760h';

export interface ExtendTokenRequest {
	duration: TokenExtensionDuration;
}

/**
 * Runtime configuration injected via `config.js` (`window.__APP_CONFIG__`).
 * Replaces the build-time `import.meta.env.VITE_*` variables used by the old
 * Vite build, so the same static bundle can be configured per deployment
 * without rebuilding.
 */
export interface AppConfig {
	/** Where API calls are routed. Defaults to `<base>/api`. */
	apiPrefix?: string;
	/** When true, mutations run against in-memory fixtures (GitHub Pages demo). */
	demo?: boolean;
	/** Informational notice shown in the table footer. */
	apiNotice?: string;
}

declare global {
	interface Window {
		__APP_CONFIG__?: AppConfig;
	}
}
