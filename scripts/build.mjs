/*
 * Static build assembler — zero dependencies (Node built-ins only).
 *
 * Assumes `tsc` has already emitted the compiled modules into dist/_ts
 * (mirroring the pages/ source tree). This script assembles the final, served
 * layout under dist/:
 *
 *   dist/
 *   ├── ds/                 shared design system (one copy, served at /ds)
 *   ├── shared/             shared compiled JS  (one copy, served at /shared)
 *   ├── index.html          redirect → /home/
 *   ├── robots.txt
 *   ├── home/               { index.html, app.css, config.js, favicon, app/, api/ }
 *   └── token-ui/           { index.html, app.css, config.js, favicon, app/, api/ }
 *
 * Each page is mounted under its own path prefix; pages reference the shared
 * design system as ../ds and the shared modules as ../../shared (the compiled
 * import specifiers resolve identically in this layout).
 *
 * Per-deployment configuration is baked into each page's config.js from env vars:
 *   DEMO                  — "true" to build the in-memory demo (GitHub Pages)
 *   <PAGE>_API_PREFIX     — override a page's API prefix (e.g. HOME_API_PREFIX)
 *   API_NOTICE            — token-ui footer text
 */
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const tsOut = join(dist, '_ts');

const demo = process.env.DEMO === 'true';

/**
 * The pages assembled into the image. `dir` is the source folder under pages/;
 * `prefix` is the path it is served from. `config(env)` returns per-page runtime
 * overrides (demo is applied globally).
 */
const PAGES = [
	{
		dir: 'home',
		prefix: 'home',
		config(env) {
			const cfg = {};
			if (env.HOME_API_PREFIX) cfg.apiPrefix = env.HOME_API_PREFIX;
			return cfg;
		}
	},
	{
		dir: 'token-ui',
		prefix: 'token-ui',
		config(env) {
			const cfg = {};
			if (env.TOKEN_UI_API_PREFIX) cfg.apiPrefix = env.TOKEN_UI_API_PREFIX;
			if (env.API_NOTICE) cfg.apiNotice = env.API_NOTICE;
			return cfg;
		}
	}
];

async function copy(from, to) {
	await cp(from, to, { recursive: true });
}

async function buildPage(page) {
	const src = join(root, 'pages', page.dir);
	const out = join(dist, page.prefix);
	await rm(out, { recursive: true, force: true });
	await mkdir(out, { recursive: true });

	// Page-local static assets.
	for (const asset of ['index.html', 'app.css', 'favicon.svg']) {
		await copy(join(src, asset), join(out, asset));
	}

	// Compiled page modules: dist/_ts/<dir>/src → dist/<prefix>/app
	const compiled = join(tsOut, page.dir, 'src');
	if (!existsSync(join(compiled, 'main.js'))) {
		throw new Error(`${compiled}/main.js missing — did \`tsc\` run before this script?`);
	}
	await copy(compiled, join(out, 'app'));

	// Runtime config: start from the page's committed default, then apply env overrides.
	const cfg = page.config(process.env);
	if (demo) cfg.demo = true;
	if (Object.keys(cfg).length > 0) {
		await writeFile(
			join(out, 'config.js'),
			`window.__APP_CONFIG__ = ${JSON.stringify(cfg, null, '\t')};\n`
		);
	} else {
		await copy(join(src, 'config.js'), join(out, 'config.js'));
	}

	// Demo mode ships the fixtures as static JSON for the in-memory client.
	if (demo) {
		const mocks = join(src, 'mocks', 'api');
		if (existsSync(mocks)) await copy(mocks, join(out, 'api'));
	}

	console.log(`  /${page.prefix}/${cfg.apiPrefix ? `  apiPrefix: ${cfg.apiPrefix}` : ''}`);
}

async function main() {
	if (!existsSync(tsOut)) {
		throw new Error(`${tsOut} missing — run \`tsc\` before this script.`);
	}

	// Clear previously assembled output, but keep the fresh tsc emit (dist/_ts).
	for (const entry of ['ds', 'shared', 'index.html', 'robots.txt', ...PAGES.map((p) => p.prefix)]) {
		await rm(join(dist, entry), { recursive: true, force: true });
	}

	// Shared resources (one copy each).
	await copy(join(root, 'ds'), join(dist, 'ds'));
	await copy(join(tsOut, 'shared'), join(dist, 'shared'));

	// Per-page output.
	for (const page of PAGES) await buildPage(page);

	// Site-root files (robots.txt, the / → /home/ redirect).
	if (existsSync(join(root, 'static'))) {
		await copy(join(root, 'static'), dist);
	}

	// The tsc emit is an intermediate artifact — drop it from the served output.
	await rm(tsOut, { recursive: true, force: true });

	console.log(`Build complete → ${dist}${demo ? ' (demo)' : ''}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
