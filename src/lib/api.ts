import type { Token, CreateTokenRequest, CreateTokenResponse, Scope } from './types';

const API_PREFIX = import.meta.env.VITE_API_PREFIX ?? '/api';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
	const res = await fetch(`${API_PREFIX}${path}`, {
		method,
		headers: body ? { 'Content-Type': 'application/json' } : undefined,
		body: body ? JSON.stringify(body) : undefined
	});
	if (!res.ok) {
		const text = await res.text().catch(() => res.statusText);
		throw new Error(`${method} ${path} failed: ${res.status} ${text}`);
	}
	return res.json();
}

export function listTokens(): Promise<Token[]> {
	return request('GET', '/tokens');
}

export function createToken(req: CreateTokenRequest): Promise<CreateTokenResponse> {
	return request('POST', '/tokens', req);
}

export function deleteToken(id: string): Promise<void> {
	return request('DELETE', `/tokens/${encodeURIComponent(id)}`);
}

export function extendToken(id: string): Promise<Token> {
	return request('PATCH', `/tokens/${encodeURIComponent(id)}`);
}

export function listScopes(): Promise<Scope[]> {
	return request('GET', '/scopes');
}
