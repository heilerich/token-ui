/*
 * Shared HTTP layer — the thin transport every page's API client builds on.
 *
 * Responsibilities (and nothing more): build the request URL from the configured
 * prefix, carry the Kubeflow namespace through, retry transient failures, and
 * serialize/deserialize JSON. All business logic lives in each page's `api.ts`.
 *
 * In demo mode reads are served from static JSON fixtures: a `GET` to `<path>`
 * is rewritten to `<prefix><path>.json`, mirroring the production demo build.
 */
import { baseConfig } from './config.js';

const API_PREFIX = baseConfig.apiPrefix;
/** True when the page reads from static JSON fixtures instead of a live API. */
export const isDemo = baseConfig.demo;

const MAX_RETRIES = 5;
const MAX_BACKOFF_MS = 10_000;

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
	let lastNetworkError: unknown;
	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		let res: Response;
		try {
			res = await fetch(url, options);
		} catch (networkError) {
			lastNetworkError = networkError;
			if (attempt < MAX_RETRIES) {
				await sleep(Math.min(2 ** attempt * 1000, MAX_BACKOFF_MS));
				continue;
			}
			throw networkError;
		}
		// Success or client error (4xx) — return immediately, no retry
		if (res.ok || (res.status >= 400 && res.status < 500)) {
			return res;
		}
		// Server error (5xx) — back off and retry if attempts remain
		if (attempt < MAX_RETRIES) {
			await sleep(Math.min(2 ** attempt * 1000, MAX_BACKOFF_MS));
		} else {
			return res;
		}
	}
	throw lastNetworkError ?? new Error('Request failed');
}

/**
 * The active Kubeflow namespace, selected by the parent Central Dashboard frame
 * and passed through as a `?ns=` query parameter.
 */
export function getNamespace(): string | null {
	if (typeof window === 'undefined') return null;
	return (
		new URLSearchParams(window.location.search).get('ns') ||
		new URLSearchParams(window.parent.location.search).get('ns')
	);
}

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
	let url = isDemo ? `${API_PREFIX}${path}.json` : `${API_PREFIX}${path}`;
	const ns = getNamespace();
	if (ns && !isDemo) {
		const separator = url.includes('?') ? '&' : '?';
		url = `${url}${separator}ns=${encodeURIComponent(ns)}`;
	}
	const fetchOptions: RequestInit = {
		method: isDemo ? 'GET' : method,
		headers: !isDemo && body ? { 'Content-Type': 'application/json' } : undefined,
		body: !isDemo && body ? JSON.stringify(body) : undefined
	};
	const res = isDemo ? await fetch(url, fetchOptions) : await fetchWithRetry(url, fetchOptions);
	if (!res.ok) {
		const text = await res.text().catch(() => res.statusText);
		throw new Error(`${method} ${path} failed: ${res.status} ${text}`);
	}
	if (res.status === 204 || res.headers.get('content-length') === '0') {
		return undefined as T;
	}
	return res.json();
}
