import type { AppConfig } from './types.js';

const DEFAULT_API_NOTICE =
	'Point your tool to https://example.com/v1 to access the API. ' +
	'Your tool should be compatible to the OpenAI API specification';

const raw: AppConfig = window.__APP_CONFIG__ ?? {};

/**
 * Base href the page is served under (e.g. `/` or `/token-ui/`), resolved from
 * the document so the app works under any mount path without a build-time base.
 */
const basePath = new URL('.', document.baseURI).pathname.replace(/\/$/, '');

export const config = {
	apiPrefix: raw.apiPrefix ?? `${basePath}/api`,
	demo: raw.demo ?? false,
	apiNotice: raw.apiNotice ?? DEFAULT_API_NOTICE
} as const;
