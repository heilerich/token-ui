/* ============================================================
   Home dashboard — application controller.

   Renders two API-driven regions on top of the Kubeflow Design
   System tokens: an announcements panel and a grid of platform
   service cards. The page is content-only — the surrounding
   top bar / sidebar chrome is provided by the host that embeds
   this page (as an iframe), not by this project.

   Mirrors the token-ui page: this module owns all state and view
   logic; the API client (api.ts) stays a thin transport.
   ============================================================ */

import type {
	Announcement,
	AnnouncementCategory,
	PlatformService,
	StatusTone
} from './types.js';
import * as api from './api.js';
import { getNamespace } from '../../shared/http.js';
import { esc, must } from '../../shared/dom.js';

interface State {
	services: PlatformService[];
	announcements: Announcement[];
	loading: boolean;
	error: string | null;
}

const state: State = {
	services: [],
	announcements: [],
	loading: true,
	error: null
};

/* ----------------------------- DOM refs ----------------------------- */
const errorSlot = must('#error-slot');
const announcementsSlot = must('#announcements-slot');
const servicesSlot = must('#services-slot');

/* ----------------------------- mappings ----------------------------- */
const KNOWN_TONES = new Set<StatusTone>(['success', 'warning', 'error', 'info', 'neutral']);

/** A status badge's tone, falling back to `neutral` for unknown/missing values. */
function toneClass(tone: StatusTone | undefined): StatusTone {
	return tone && KNOWN_TONES.has(tone) ? tone : 'neutral';
}

/** Material Icons glyph used for an announcement, derived from its category. */
const ANNOUNCEMENT_ICON: Record<AnnouncementCategory, string> = {
	info: 'info',
	important: 'warning'
};

/* ----------------------------- render ----------------------------- */
function renderError(): void {
	if (!state.error) {
		errorSlot.innerHTML = '';
		return;
	}
	errorSlot.innerHTML = `
		<div class="error-strip">
			<kf-panel type="error" title="Couldn't load the dashboard">${esc(state.error)}</kf-panel>
		</div>`;
}

function announcementHtml(a: Announcement): string {
	const category: AnnouncementCategory = a.category === 'important' ? 'important' : 'info';
	const icon = ANNOUNCEMENT_ICON[category];
	const link = a.link
		? `<div class="announcement__link">
				<a class="lib-link" href="${esc(a.link.href)}">${esc(a.link.label)}</a>
			</div>`
		: '';
	return `
		<div class="announcement announcement--${category}">
			<span class="material-icons announcement__icon">${esc(icon)}</span>
			<div class="announcement__content">
				<div class="announcement__title">${esc(a.title)}</div>
				<div class="announcement__body">${esc(a.body)}</div>
				${link}
			</div>
		</div>`;
}

function renderAnnouncements(): void {
	if (state.announcements.length === 0) {
		// Nothing to show — hide the whole panel rather than render an empty card.
		announcementsSlot.innerHTML = '';
		return;
	}
	const items = state.announcements.map(announcementHtml).join('');
	announcementsSlot.innerHTML = `
		<div class="card announcements">
			<div class="card__header">
				<span class="card__title">Announcements</span>
			</div>
			<div class="announcements__grid">${items}</div>
		</div>`;
}

function serviceCardHtml(s: PlatformService): string {
	const badge = s.status
		? `<span class="badge badge--${toneClass(s.status.tone)}">${esc(s.status.label)}</span>`
		: '';
	const cta = s.cta && s.cta.trim() ? s.cta : 'Open';
	return `
		<a class="service-card" href="${esc(s.href)}">
			${badge}
			<span class="material-icons service-card__icon">${esc(s.icon)}</span>
			<div class="service-card__title">${esc(s.title)}</div>
			<div class="service-card__desc">${esc(s.description)}</div>
			<div class="service-card__cta">${esc(cta)}<span class="material-icons">arrow_forward</span></div>
		</a>`;
}

function renderServices(): void {
	if (state.loading) {
		servicesSlot.innerHTML = `
			<div class="empty-state">
				<span class="kf-spinner" style="width:28px;height:28px;display:inline-block;"></span>
				<div style="margin-top: 12px;">Loading services…</div>
			</div>`;
		return;
	}
	if (state.services.length === 0) {
		servicesSlot.innerHTML = `
			<div class="empty-state">
				<span class="material-icons">apps</span>
				<div style="margin-top: 12px;">No platform services available.</div>
			</div>`;
		return;
	}
	const cards = state.services.map(serviceCardHtml).join('');
	servicesSlot.innerHTML = `
		<div class="section-label">Platform services</div>
		<div class="services-grid">${cards}</div>`;
}

function rerender(): void {
	renderError();
	renderAnnouncements();
	renderServices();
}

/* ----------------------------- load & refresh ----------------------------- */
async function loadAll(): Promise<void> {
	const [services, announcements] = await Promise.all([
		api.listServices(),
		api.listAnnouncements()
	]);
	state.services = services;
	state.announcements = announcements;
}

async function load(): Promise<void> {
	state.loading = true;
	rerender();
	try {
		await loadAll();
		state.error = null;
	} catch (err) {
		state.error = err instanceof Error ? err.message : 'Failed to load';
	} finally {
		state.loading = false;
		rerender();
	}
}

/**
 * When embedded in the Kubeflow Central Dashboard (an iframe), the namespace is
 * selected by the parent frame. Poll for changes and refresh — mirrors the
 * token-ui page's behaviour.
 */
function startNamespacePolling(): void {
	if (window.parent === window) return;
	let current = getNamespace();
	setInterval(async () => {
		const ns = getNamespace();
		if (ns !== current) {
			current = ns;
			try {
				await loadAll();
				state.error = null;
			} catch {
				/* keep last good state on transient errors */
			}
			rerender();
		}
	}, 500);
}

export function init(): void {
	void load();
	startNamespacePolling();
}
