/*
 * Runtime configuration for the Home dashboard page.
 *
 * Loaded as a plain <script> before the app so each deployment can configure
 * the page WITHOUT rebuilding the static bundle. The Docker image / deploy
 * pipeline can overwrite this file (see scripts/build.mjs, which regenerates it
 * from environment variables).
 *
 * Fields (all optional — sensible defaults are applied in pages/shared/config.ts):
 *   apiPrefix  — where API calls are routed (default: "<base>/api")
 *   demo       — true to read from static JSON fixtures (GitHub Pages demo)
 */
window.__APP_CONFIG__ = {
	// apiPrefix: '/home/api',
	// k8sApiPrefix: '/api/k8s',
	// demo: false,
};
