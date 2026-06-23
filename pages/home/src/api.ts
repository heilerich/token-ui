import type { PlatformService, Announcement } from './types.js';
import { request } from '../../shared/http.js';

/** GET /services — the platform service cards. */
export function listServices(): Promise<PlatformService[]> {
	return request('GET', '/services');
}

/** GET /announcements — the announcements panel entries. */
export function listAnnouncements(): Promise<Announcement[]> {
	return request('GET', '/announcements');
}
