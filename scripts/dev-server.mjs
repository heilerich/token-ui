/*
 * Development server — zero dependencies (Node built-ins only).
 *
 * Replaces the old Vite dev server + mock plugin. It:
 *   1. compiles the TypeScript app with `tsc --watch` (incremental rebuilds),
 *   2. serves the static page (index.html, app.css, ds/, favicon) from source,
 *   3. serves the compiled modules from dist/app,
 *   4. provides the mock CRUD API at /api/* (dev), or static JSON fixtures when
 *      DEMO=true (preview), mirroring the production demo build.
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
const PORT = Number(process.env.PORT || 5173);
const DEMO = process.env.DEMO === 'true';

const MIME = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.woff2': 'font/woff2',
	'.map': 'application/json; charset=utf-8'
};

/* ------------------------------- mock API ------------------------------- */
let tokens = [];
let scopes = [];

async function loadFixtures() {
	tokens = JSON.parse(await readFile(join(root, 'mocks', 'api', 'tokens.json'), 'utf8'));
	scopes = JSON.parse(await readFile(join(root, 'mocks', 'api', 'scopes.json'), 'utf8'));
}

function durationToMs(duration) {
	if (typeof duration !== 'string') return null;
	const match = duration.match(/^(\d+)h$/);
	return match ? Number(match[1]) * 60 * 60 * 1000 : null;
}

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

async function handleApi(req, res, url) {
	if (url.pathname === '/api/scopes' && req.method === 'GET') return sendJson(res, 200, scopes);
	if (url.pathname === '/api/tokens' && req.method === 'GET') return sendJson(res, 200, tokens);

	if (url.pathname === '/api/tokens' && req.method === 'POST') {
		const body = JSON.parse((await readBody(req)) || '{}');
		const token = {
			id: `tok_${randomBytes(6).toString('hex')}`,
			name: body.name,
			scopes: body.scopes,
			expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
			created_at: new Date().toISOString()
		};
		tokens.push(token);
		return sendJson(res, 201, { token, secret: `sk_${randomBytes(24).toString('hex')}` });
	}

	const match = url.pathname.match(/^\/api\/tokens\/([^/]+)$/);
	if (match) {
		const id = decodeURIComponent(match[1]);
		if (req.method === 'DELETE') {
			tokens = tokens.filter((t) => t.id !== id);
			return sendJson(res, 204, null);
		}
		if (req.method === 'PATCH') {
			const token = tokens.find((t) => t.id === id);
			if (!token) return sendJson(res, 404, { error: 'Not found' });
			const body = JSON.parse((await readBody(req)) || '{}');
			const ms = durationToMs(body.duration) ?? 720 * 60 * 60 * 1000;
			token.expires_at = new Date(Date.now() + ms).toISOString();
			return sendJson(res, 200, token);
		}
	}
	return false;
}

/* ------------------------------- static ------------------------------- */
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

const server = createServer(async (req, res) => {
	const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

	// Runtime config is generated so DEMO mode works without a file copy.
	if (url.pathname === '/config.js') {
		const cfg = DEMO ? { demo: true } : {};
		const js = `window.__APP_CONFIG__ = ${JSON.stringify(cfg)};\n`;
		res.writeHead(200, { 'Content-Type': MIME['.js'] });
		res.end(js);
		return;
	}

	// Demo: serve fixtures as static JSON (api.ts requests /api/<name>.json).
	if (DEMO && url.pathname.startsWith('/api/') && url.pathname.endsWith('.json')) {
		const name = url.pathname.replace('/api/', '');
		if (await serveFile(res, join(root, 'mocks', 'api', name))) return;
		res.writeHead(404);
		res.end('Not found');
		return;
	}

	// Dev: live mock CRUD API.
	if (!DEMO && url.pathname.startsWith('/api/')) {
		const handled = await handleApi(req, res, url);
		if (handled !== false) return;
		res.writeHead(404);
		res.end('Not found');
		return;
	}

	// Compiled app modules.
	if (url.pathname.startsWith('/app/')) {
		const file = join(root, 'dist', normalize(url.pathname));
		if (await serveFile(res, file)) return;
		res.writeHead(404);
		res.end('Not found');
		return;
	}

	// Static files from project root, then from static/ (robots.txt, etc.).
	const rel = url.pathname === '/' ? 'index.html' : normalize(url.pathname).replace(/^([/\\])+/, '');
	if (await serveFile(res, join(root, rel))) return;
	if (await serveFile(res, join(root, 'static', rel))) return;

	// SPA fallback.
	if (await serveFile(res, join(root, 'index.html'))) return;
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

await loadFixtures();
startCompiler();
server.listen(PORT, () => {
	console.log(`Dev server running → http://localhost:${PORT}${DEMO ? '  (demo mode)' : ''}`);
});
