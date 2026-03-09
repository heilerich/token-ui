import type { Token, CreateTokenRequest, CreateTokenResponse, Scope } from './types';
import { base } from '$app/paths';

const API_PREFIX = import.meta.env.VITE_API_PREFIX ?? `${base}/api`;
const DEMO_MODE = import.meta.env.VITE_DEMO === 'true';

function getNamespace(): string | null {
	if (typeof window === 'undefined') return null;
	return new URLSearchParams(window.location.search).get('ns');
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
	let url = DEMO_MODE ? `${API_PREFIX}${path}.json` : `${API_PREFIX}${path}`;
	const ns = getNamespace();
	if (ns && !DEMO_MODE) {
		const separator = url.includes('?') ? '&' : '?';
		url = `${url}${separator}ns=${encodeURIComponent(ns)}`;
	}
	const res = await fetch(url, {
		method: DEMO_MODE ? 'GET' : method,
		headers: !DEMO_MODE && body ? { 'Content-Type': 'application/json' } : undefined,
		body: !DEMO_MODE && body ? JSON.stringify(body) : undefined
	});
	if (!res.ok) {
		const text = await res.text().catch(() => res.statusText);
		throw new Error(`${method} ${path} failed: ${res.status} ${text}`);
	}
	return res.json();
}

let demoTokens: Token[] | null = null;
let nextDemoId = 1;

async function getDemoTokens(): Promise<Token[]> {
	if (!demoTokens) {
		demoTokens = await request<Token[]>('GET', '/tokens');
	}
	return demoTokens;
}

export async function listTokens(): Promise<Token[]> {
	if (DEMO_MODE) return [...(await getDemoTokens())];
	return request('GET', '/tokens');
}

export async function createToken(req: CreateTokenRequest): Promise<CreateTokenResponse> {
	if (DEMO_MODE) {
		const tokens = await getDemoTokens();
		const token: Token = {
			id: `tok_demo_${nextDemoId++}`,
			name: req.name,
			scopes: req.scopes,
			expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
			created_at: new Date().toISOString()
		};
		tokens.push(token);
		return { token, secret: `sk_demo_${crypto.randomUUID().replace(/-/g, '')}` };
	}
	return request('POST', '/tokens', req);
}

export async function deleteToken(id: string): Promise<void> {
	if (DEMO_MODE) {
		const tokens = await getDemoTokens();
		const idx = tokens.findIndex((t) => t.id === id);
		if (idx !== -1) tokens.splice(idx, 1);
		return;
	}
	return request('DELETE', `/tokens/${encodeURIComponent(id)}`);
}

export async function extendToken(id: string): Promise<Token> {
	if (DEMO_MODE) {
		const tokens = await getDemoTokens();
		const token = tokens.find((t) => t.id === id);
		if (!token) throw new Error('Token not found');
		token.expires_at = new Date(
			new Date(token.expires_at).getTime() + 90 * 24 * 60 * 60 * 1000
		).toISOString();
		return { ...token };
	}
	return request('PATCH', `/tokens/${encodeURIComponent(id)}`);
}

export async function listScopes(): Promise<Scope[]> {
	if (DEMO_MODE) return request('GET', '/scopes');
	return request('GET', '/scopes');
}
