/*
 * Runtime configuration for the API Tokens UI.
 *
 * This file is loaded as a plain <script> before the app and lets each
 * deployment configure the app WITHOUT rebuilding the static bundle. The
 * Docker image / deploy pipeline can overwrite this file (see scripts/build.mjs,
 * which regenerates it from environment variables).
 *
 * Fields (all optional — sensible defaults are applied in src/config.ts):
 *   apiPrefix  — where API calls are routed (default: "<base>/api")
 *   demo       — true to run against in-memory fixtures (GitHub Pages demo)
 *   apiNotice  — informational text shown in the table footer
 */
window.__APP_CONFIG__ = {
	// apiPrefix: '/api',
	// demo: false,
	// apiNotice: 'Point your tool to https://example.com/v1 ...',
};
