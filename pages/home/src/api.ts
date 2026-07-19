import type { HomeData } from './types.js';
import { baseConfig } from '../../shared/config.js';
import { fetchWithRetry, isDemo } from '../../shared/http.js';

const K8S_PREFIX = (baseConfig.raw.k8sApiPrefix as string | undefined) ?? '/api/k8s';
const CONFIGMAP_PATH = '/api/v1/namespaces/kubeflow/configmaps/dashboard-home';
const DEMO_MOCK = new URL('../mocks/api/configmap.json', import.meta.url).href;

export async function loadHomeData(): Promise<HomeData> {
	const url = isDemo ? DEMO_MOCK : `${K8S_PREFIX}${CONFIGMAP_PATH}`;
	const res = isDemo ? await fetch(url) : await fetchWithRetry(url, { method: 'GET' });

	if (!res.ok) {
		const text = await res.text().catch(() => res.statusText);
		throw new Error(`ConfigMap fetch failed: ${res.status} ${text}`);
	}

	const cm: { data?: Record<string, string> } = await res.json();
	const raw = cm.data ?? {};

	return {
		services: raw.services ? JSON.parse(raw.services) : [],
		announcements: raw.announcements ? JSON.parse(raw.announcements) : [],
	};
}
