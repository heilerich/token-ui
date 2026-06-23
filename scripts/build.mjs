/*
 * Static build assembler — zero dependencies (Node built-ins only).
 *
 * Assumes `tsc` has already emitted the compiled app modules into dist/app.
 * This script copies the static assets into dist/ and (re)generates config.js
 * from environment variables so the bundle can be configured per deployment:
 *
 *   API_PREFIX  — where API calls are routed (e.g. /api or /token-ui/api)
 *   API_NOTICE  — informational footer text
 *   DEMO        — "true" to build the in-memory demo (GitHub Pages)
 */
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

const demo = process.env.DEMO === 'true';

async function copy(rel) {
	await cp(join(root, rel), join(dist, rel), { recursive: true });
}

async function main() {
	// dist/app is produced by tsc — keep it, clear everything else.
	for (const entry of ['index.html', 'app.css', 'favicon.svg', 'config.js', 'ds', 'api']) {
		await rm(join(dist, entry), { recursive: true, force: true });
	}
	await mkdir(dist, { recursive: true });

	// Static assets.
	await copy('index.html');
	await copy('app.css');
	await copy('favicon.svg');
	await copy('ds');

	// Contents of static/ are served from the site root (e.g. robots.txt).
	if (existsSync(join(root, 'static'))) {
		await cp(join(root, 'static'), dist, { recursive: true });
	}

	// Runtime config: start from the committed default, then apply env overrides.
	const cfg = {};
	if (process.env.API_PREFIX) cfg.apiPrefix = process.env.API_PREFIX;
	if (process.env.API_NOTICE) cfg.apiNotice = process.env.API_NOTICE;
	if (demo) cfg.demo = true;

	if (Object.keys(cfg).length > 0) {
		await writeFile(
			join(dist, 'config.js'),
			`window.__APP_CONFIG__ = ${JSON.stringify(cfg, null, '\t')};\n`
		);
	} else {
		await copy('config.js');
	}

	// Demo mode ships the fixtures as static JSON for the in-memory client.
	if (demo) {
		await cp(join(root, 'mocks', 'api'), join(dist, 'api'), { recursive: true });
	}

	if (!existsSync(join(dist, 'app', 'main.js'))) {
		throw new Error('dist/app/main.js missing — did `tsc` run before this script?');
	}

	const notice = await readFile(join(dist, 'config.js'), 'utf8').catch(() => '');
	console.log(`Build complete → ${dist}${demo ? ' (demo)' : ''}`);
	if (cfg.apiPrefix) console.log(`  apiPrefix: ${cfg.apiPrefix}`);
	void notice;
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
