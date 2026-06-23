/*
 * Development server — zero dependencies (Node built-ins only).
 *
 * It:
 *   1. compiles every page with `tsc --watch` (incremental, into dist/_ts),
 *   2. serves each page from its path prefix (/home/, /token-ui/) out of source,
 *   3. serves the compiled modules (/{prefix}/app/* and /shared/*) from dist/_ts,
 *   4. serves the shared design system from /ds,
 *   5. provides per-page mock APIs at /{prefix}/api/* (dev), or static JSON
 *      fixtures when DEMO=true (preview), mirroring the production demo build.
 *
 * Usage: `npm run dev`  (or `npm run preview` for DEMO mode)
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tsOut = join(root, 'dist', '_ts');
const PORT = Number(process.env.PORT || 5173);
const LISTEN_ADDR = process.env.LISTEN_ADDR || 'localhost';
const DEMO = process.env.DEMO === 'true';

const MIME = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.woff2': 'font/woff2',
	'.ts': 'text/plain; charset=utf-8',
	'.map': 'application/json; charset=utf-8'
};

/* ------------------------------- helpers ------------------------------- */
function sendJson(res, status, body) {
	const data = body === null ? '' : JSON.stringify(body);
	res.writeHead(status, { 'Content-Type': MIME['.json'], 'Content-Length': Buffer.byteLength(data) });
	res.end(data);
}

function readBody(req) {
	return new Promise((resolve) => {
		let data = '';
		req.on('data', (c) => (data += c));
		req.on('end', () => resolve(data));
	});
}

async function serveFile(res, filePath) {
	try {
		const data = await readFile(filePath);
		res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
		res.end(data);
		return true;
	} catch {
		return false;
	}
}

function durationToMs(duration) {
	if (typeof duration !== 'string') return null;
	const match = duration.match(/^(\d+)h$/);
	return match ? Number(match[1]) * 60 * 60 * 1000 : null;
}

/* ------------------------------- mock state ------------------------------- */
const fixtures = {}; // dir -> { name -> parsed JSON }

async function loadFixture(dir, name) {
	const file = join(root, 'pages', dir, 'mocks', 'api', `${name}.json`);
	return JSON.parse(await readFile(file, 'utf8'));
}

/* ---- token-ui: full CRUD mock ---- */
const tokenState = { tokens: [], scopes: [] };

async function tokenUiApi(req, res, sub) {
	if (sub === '/scopes' && req.method === 'GET') return sendJson(res, 200, tokenState.scopes);
	if (sub === '/tokens' && req.method === 'GET') return sendJson(res, 200, tokenState.tokens);

	if (sub === '/tokens' && req.method === 'POST') {
		const body = JSON.parse((await readBody(req)) || '{}');
		const token = {
			id: `tok_${randomBytes(6).toString('hex')}`,
			name: body.name,
			scopes: body.scopes,
			expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
			created_at: new Date().toISOString()
		};
		tokenState.tokens.push(token);
		return sendJson(res, 201, { token, secret: `sk_${randomBytes(24).toString('hex')}` });
	}

	const match = sub.match(/^\/tokens\/([^/]+)$/);
	if (match) {
		const id = decodeURIComponent(match[1]);
		if (req.method === 'DELETE') {
			tokenState.tokens = tokenState.tokens.filter((t) => t.id !== id);
			return sendJson(res, 204, null);
		}
		if (req.method === 'PATCH') {
			const token = tokenState.tokens.find((t) => t.id === id);
			if (!token) return sendJson(res, 404, { error: 'Not found' });
			const body = JSON.parse((await readBody(req)) || '{}');
			const ms = durationToMs(body.duration) ?? 720 * 60 * 60 * 1000;
			token.expires_at = new Date(Date.now() + ms).toISOString();
			return sendJson(res, 200, token);
		}
	}
	return false;
}

/* ---- home: read-only mock ---- */
async function homeApi(req, res, sub) {
	if (req.method !== 'GET') return false;
	if (sub === '/services') return sendJson(res, 200, fixtures.home.services);
	if (sub === '/announcements') return sendJson(res, 200, fixtures.home.announcements);
	return false;
}

/* ------------------------------- pages ------------------------------- */
const PAGES = [
	{ dir: 'home', prefix: 'home', api: homeApi, fixtures: ['services', 'announcements'] },
	{ dir: 'token-ui', prefix: 'token-ui', api: tokenUiApi, fixtures: ['tokens', 'scopes'] }
];
const byPrefix = new Map(PAGES.map((p) => [p.prefix, p]));

async function loadAllFixtures() {
	for (const page of PAGES) {
		fixtures[page.dir] = {};
		for (const name of page.fixtures) {
			fixtures[page.dir][name] = await loadFixture(page.dir, name);
		}
	}
	// Seed the live token CRUD state from fixtures.
	tokenState.tokens = structuredClone(fixtures['token-ui'].tokens);
	tokenState.scopes = structuredClone(fixtures['token-ui'].scopes);
}

/* ------------------------------- server ------------------------------- */
const server = createServer(async (req, res) => {
	const url = new URL(req.url ?? '/', `http://${LISTEN_ADDR}:${PORT}`);
	const path = url.pathname;

	// Root → home.
	if (path === '/') {
		res.writeHead(302, { Location: '/home/' });
		res.end();
		return;
	}

	// Shared design system.
	if (path.startsWith('/ds/')) {
		if (await serveFile(res, join(root, normalize(path)))) return;
		res.writeHead(404);
		res.end('Not found');
		return;
	}

	// Shared compiled modules.
	if (path.startsWith('/shared/')) {
		if (await serveFile(res, join(tsOut, normalize(path)))) return;
		res.writeHead(404);
		res.end('Not found');
		return;
	}

	// Per-page routing: /<prefix>/...
	const segs = path.split('/').filter(Boolean);
	const page = segs.length > 0 ? byPrefix.get(segs[0]) : undefined;
	if (page) {
		const rest = '/' + segs.slice(1).join('/'); // path within the page

		// Runtime config — generated so DEMO mode works without a file copy.
		if (rest === '/config.js') {
			const cfg = DEMO ? { demo: true } : {};
			res.writeHead(200, { 'Content-Type': MIME['.js'] });
			res.end(`window.__APP_CONFIG__ = ${JSON.stringify(cfg)};\n`);
			return;
		}

		// API: static fixtures in demo, live mock otherwise.
		if (rest.startsWith('/api/')) {
			const sub = rest.slice('/api'.length); // e.g. /tokens or /services.json
			if (DEMO) {
				if (sub.endsWith('.json')) {
					const file = join(root, 'pages', page.dir, 'mocks', 'api', sub.replace(/^\//, ''));
					if (await serveFile(res, file)) return;
				}
				res.writeHead(404);
				res.end('Not found');
				return;
			}
			const handled = await page.api(req, res, sub);
			if (handled !== false) return;
			res.writeHead(404);
			res.end('Not found');
			return;
		}

		// Compiled page modules.
		if (rest.startsWith('/app/')) {
			const file = join(tsOut, page.dir, 'src', normalize(rest.slice('/app/'.length)));
			if (await serveFile(res, file)) return;
			res.writeHead(404);
			res.end('Not found');
			return;
		}

		// Page index + page-local static assets (app.css, favicon.svg).
		const rel = rest === '/' ? 'index.html' : normalize(rest).replace(/^([/\\])+/, '');
		if (await serveFile(res, join(root, 'pages', page.dir, rel))) return;

		// SPA fallback to the page's index.
		if (await serveFile(res, join(root, 'pages', page.dir, 'index.html'))) return;
		res.writeHead(404);
		res.end('Not found');
		return;
	}

	// Fallback: project-root files (e.g. original .ts sources for source maps).
	if (await serveFile(res, join(root, normalize(path).replace(/^([/\\])+/, '')))) return;

	res.writeHead(404);
	res.end('Not found');
});

/* ------------------------------- startup ------------------------------- */
function startCompiler() {
	const tscBin = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'tsc.cmd' : 'tsc');
	if (!existsSync(tscBin)) {
		console.warn('⚠ tsc not found — run `npm install` first. Serving without compilation.');
		return;
	}
	const tsc = spawn(tscBin, ['--watch', '--preserveWatchOutput'], { cwd: root, stdio: 'inherit' });
	process.on('exit', () => tsc.kill());
	process.on('SIGINT', () => {
		tsc.kill();
		process.exit(0);
	});
}

await loadAllFixtures();
startCompiler();
server.listen(PORT, () => {
	console.log(`Dev server running → http://${LISTEN_ADDR}:${PORT}/  (→ /home/)${DEMO ? '  [demo]' : ''}`);
});
