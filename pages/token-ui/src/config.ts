import { baseConfig } from '../../shared/config.js';

const DEFAULT_API_NOTICE =
	'Point your tool to https://example.com/v1 to access the API. ' +
	'Your tool should be compatible to the OpenAI API specification';

/**
 * Page configuration = the shared base (apiPrefix / demo) plus this page's own
 * `apiNotice`, read from the same `window.__APP_CONFIG__` object.
 */
export const config = {
	...baseConfig,
	apiNotice: (baseConfig.raw.apiNotice as string | undefined) ?? DEFAULT_API_NOTICE
} as const;
