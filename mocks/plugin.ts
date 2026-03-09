import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import type { Plugin } from 'vite';

interface Token {
	id: string;
	name: string;
	scopes: string[];
	expires_at: string;
	created_at: string;
}

interface Scope {
	id: string;
	name: string;
	description: string;
}

function durationToMs(duration: unknown): number | null {
	if (typeof duration !== 'string') return null;
	const match = duration.match(/^(\d+)h$/);
	if (!match) return null;
	return Number(match[1]) * 60 * 60 * 1000;
}

export function mockApi(): Plugin {
	const mocksDir = join(import.meta.dirname, 'api');

	let tokens: Token[] = [];
	let scopes: Scope[] = [];

	function loadFixtures() {
		tokens = JSON.parse(readFileSync(join(mocksDir, 'tokens.json'), 'utf-8'));
		scopes = JSON.parse(readFileSync(join(mocksDir, 'scopes.json'), 'utf-8'));
	}

	function json(res: any, status: number, body: unknown) {
		res.writeHead(status, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify(body));
	}

	function readBody(req: any): Promise<string> {
		return new Promise((resolve) => {
			let data = '';
			req.on('data', (chunk: string) => (data += chunk));
			req.on('end', () => resolve(data));
		});
	}

	return {
		name: 'mock-api',
		configureServer(server) {
			loadFixtures();

			server.middlewares.use(async (req, res, next) => {
				const rawUrl = req.url ?? '';
				const { pathname: url } = new URL(rawUrl, 'http://localhost');

				if (url === '/api/scopes' && req.method === 'GET') {
					return json(res, 200, scopes);
				}

				if (url === '/api/tokens' && req.method === 'GET') {
					return json(res, 200, tokens);
				}

				if (url === '/api/tokens' && req.method === 'POST') {
					const body = JSON.parse(await readBody(req));
					const token: Token = {
						id: `tok_${randomBytes(6).toString('hex')}`,
						name: body.name,
						scopes: body.scopes,
						expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
						created_at: new Date().toISOString()
					};
					tokens.push(token);
					const secret = `sk_${randomBytes(24).toString('hex')}`;
					return json(res, 201, { token, secret });
				}

				const tokenMatch = url.match(/^\/api\/tokens\/([^/]+)$/);
				if (tokenMatch) {
					const id = decodeURIComponent(tokenMatch[1]);

					if (req.method === 'DELETE') {
						tokens = tokens.filter((t) => t.id !== id);
						return json(res, 204, null);
					}

					if (req.method === 'PATCH') {
						const token = tokens.find((t) => t.id === id);
						if (!token) return json(res, 404, { error: 'Not found' });
						const bodyRaw = await readBody(req);
						const body = bodyRaw ? JSON.parse(bodyRaw) : {};
						const durationMs = durationToMs(body.duration) ?? 720 * 60 * 60 * 1000;
						token.expires_at = new Date(Date.now() + durationMs).toISOString();
						return json(res, 200, token);
					}
				}

				next();
			});
		}
	};
}
