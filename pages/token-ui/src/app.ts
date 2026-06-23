/* ============================================================
   API Tokens — application controller.

   Renders the redesigned Kubeflow UI using the design-system web
   components (<kf-toolbar>, <kf-card>, <kf-status-icon>, <kf-chip>,
   <kf-icon-button>, <kf-panel>, <kf-input>, <kf-button>) and wires
   them to the API client. Functionality mirrors the original Svelte
   app exactly: list, create (with one-time secret reveal), extend,
   and delete tokens, plus demo mode and namespace-aware refresh.
   ============================================================ */

import type { Token, Scope, TokenExtensionDuration } from './types.js';
import type { KfInputElement } from '../../shared/kf-elements.js';
import * as api from './api.js';
import { config } from './config.js';
import { esc, must, maybe, formatDate, isExpired } from '../../shared/dom.js';

interface State {
	tokens: Token[];
	scopes: Scope[];
	loading: boolean;
	error: string | null;
	selectedScopes: Set<string>;
	nameInput: string;
	busy: { create: boolean; delete: boolean; extend: boolean };
	activeToken: Token | null;
}

const state: State = {
	tokens: [],
	scopes: [],
	loading: true,
	error: null,
	selectedScopes: new Set(),
	nameInput: '',
	busy: { create: false, delete: false, extend: false },
	activeToken: null
};

const EXTEND_OPTIONS: Array<{ value: TokenExtensionDuration; label: string }> = [
	{ value: '720h', label: '30 days' },
	{ value: '4380h', label: '6 months' },
	{ value: '8760h', label: '12 months' }
];

/* ----------------------------- DOM refs ----------------------------- */
const tableSlot = must('#table-slot');
const errorSlot = must('#error-slot');
const apiNotice = must('#api-notice');

/* ----------------------------- table render ----------------------------- */
function renderError(): void {
	if (!state.error) {
		errorSlot.innerHTML = '';
		return;
	}
	errorSlot.innerHTML = `
		<div class="error-strip">
			<kf-panel type="error" title="Error">${esc(state.error)}</kf-panel>
		</div>`;
	const panel = maybe('#error-slot .kf-panel');
	// kf-panel has no built-in dismiss; provide one to match the original UX.
	if (panel) {
		const dismiss = document.createElement('button');
		dismiss.type = 'button';
		dismiss.className = 'error-dismiss';
		dismiss.textContent = 'Dismiss';
		dismiss.addEventListener('click', () => {
			state.error = null;
			renderError();
		});
		panel.appendChild(dismiss);
	}
}

function renderTable(): void {
	if (state.loading) {
		tableSlot.innerHTML = `
			<div class="empty-state">
				<span class="kf-spinner" style="width:28px;height:28px;display:inline-block;"></span>
				<div style="margin-top: 12px;">Loading tokens…</div>
			</div>`;
		return;
	}

	if (state.tokens.length === 0) {
		tableSlot.innerHTML = `
			<div class="empty-state">
				<span class="material-icons">vpn_key</span>
				<div style="margin-top: 12px;">No tokens yet. Create one to get started.</div>
			</div>`;
		return;
	}

	const rows = state.tokens
		.map((t) => {
			const expired = isExpired(t.expires_at);
			const scopes = t.scopes
				.map((s) => `<kf-chip color="blue" size="sm">${esc(s)}</kf-chip>`)
				.join('');
			const statusPhase = expired ? 'error' : 'ready';
			const statusLabel = expired ? 'Expired' : 'Active';
			return `
				<tr class="kf-row ${expired ? 'row--expired' : ''}" data-id="${esc(t.id)}">
					<td style="width: 120px;">
						<kf-status-icon phase="${statusPhase}" label="${statusLabel}"></kf-status-icon>
					</td>
					<td style="font-weight: var(--font-weight-medium);">${esc(t.name)}</td>
					<td><div class="scope-cell">${scopes}</div></td>
					<td class="${expired ? 'col--expired' : ''}">${esc(formatDate(t.expires_at))}</td>
					<td class="col--secondary">${esc(formatDate(t.created_at))}</td>
					<td class="kf-right" style="width: 110px;">
						<div class="kf-row__actions">
							<kf-icon-button icon="more_time" title="Extend" size="36" data-action="extend" data-id="${esc(t.id)}"></kf-icon-button>
							<kf-icon-button icon="delete" color="warn" title="Delete" size="36" data-action="delete" data-id="${esc(t.id)}"></kf-icon-button>
						</div>
					</td>
				</tr>`;
		})
		.join('');

	tableSlot.innerHTML = `
		<div class="kf-table-wrap">
			<table class="kf-table">
				<thead>
					<tr>
						<th style="width: 120px;">Status</th>
						<th>Name</th>
						<th>Scopes</th>
						<th>Expires</th>
						<th>Created</th>
						<th class="kf-right" style="width: 110px;">Actions</th>
					</tr>
				</thead>
				<tbody>${rows}</tbody>
			</table>
		</div>`;

	tableSlot.querySelectorAll<HTMLElement>('kf-icon-button[data-action]').forEach((btn) => {
		btn.addEventListener('click', () => {
			const id = btn.getAttribute('data-id');
			const action = btn.getAttribute('data-action');
			const token = state.tokens.find((x) => x.id === id);
			if (!token) return;
			if (action === 'extend') openExtendDialog(token);
			else if (action === 'delete') openDeleteDialog(token);
		});
	});
}

function rerender(): void {
	renderError();
	renderTable();
}

/* ----------------------------- dialog plumbing ----------------------------- */
function openDialog(id: string): void {
	const el = document.getElementById(id);
	if (el) el.setAttribute('data-open', 'true');
}
function closeDialog(id: string, force = false): void {
	const el = document.getElementById(id);
	if (!el) return;
	if (!force && el.classList.contains('is-busy')) return; // can't close while busy
	el.classList.remove('is-busy');
	el.setAttribute('data-open', 'false');
}
function setDialogBusy(id: string, busy: boolean): void {
	document.getElementById(id)?.classList.toggle('is-busy', busy);
}
function setDialogError(slotId: string, message: string | null): void {
	const slot = document.getElementById(slotId);
	if (!slot) return;
	slot.innerHTML = message ? `<kf-panel type="error">${esc(message)}</kf-panel>` : '';
}

// Close on backdrop click & Escape.
document.querySelectorAll<HTMLElement>('.kf-overlay').forEach((overlay) => {
	overlay.addEventListener('click', (e) => {
		if (e.target === overlay) closeDialog(overlay.id);
	});
});
document.addEventListener('keydown', (e) => {
	if (e.key !== 'Escape') return;
	document
		.querySelectorAll<HTMLElement>('.kf-overlay[data-open="true"]')
		.forEach((el) => closeDialog(el.id));
});
document.querySelectorAll<HTMLElement>('[data-close]').forEach((btn) => {
	btn.addEventListener('click', () => closeDialog(btn.getAttribute('data-close') as string));
});

/* ----------------------------- create dialog ----------------------------- */
const btnNew = must('#btn-new');
const inpName = must<KfInputElement>('#inp-name');
const scopeListEl = must('#scope-list');
const btnCreateSubmit = must('#btn-create-submit');

function renderScopeList(): void {
	scopeListEl.innerHTML = state.scopes
		.map(
			(s) => `
			<label class="scope-option">
				<input type="checkbox" data-scope="${esc(s.id)}" ${state.selectedScopes.has(s.id) ? 'checked' : ''} />
				<div>
					<div class="scope-option__name">${esc(s.name)}</div>
					${s.description ? `<div class="scope-option__desc">${esc(s.description)}</div>` : ''}
				</div>
			</label>`
		)
		.join('');
	scopeListEl.querySelectorAll<HTMLInputElement>('input[data-scope]').forEach((cb) => {
		cb.addEventListener('change', () => {
			const id = cb.getAttribute('data-scope') as string;
			if (cb.checked) state.selectedScopes.add(id);
			else state.selectedScopes.delete(id);
			syncCreateButton();
		});
	});
}

function syncCreateButton(): void {
	const ok =
		state.nameInput.trim().length > 0 && state.selectedScopes.size > 0 && !state.busy.create;
	if (ok) btnCreateSubmit.removeAttribute('disabled');
	else btnCreateSubmit.setAttribute('disabled', '');
}

inpName.addEventListener('input', () => {
	state.nameInput = inpName.value;
	syncCreateButton();
});
// Enter in the name field submits, matching the original form behaviour.
inpName.addEventListener('keydown', (e) => {
	if ((e as KeyboardEvent).key === 'Enter') {
		e.preventDefault();
		submitCreate();
	}
});

btnNew.addEventListener('click', () => {
	if (state.loading) return;
	state.nameInput = '';
	inpName.value = '';
	state.selectedScopes = new Set();
	setDialogError('create-error', null);
	renderScopeList();
	syncCreateButton();
	openDialog('dlg-create');
	setTimeout(() => maybe<HTMLInputElement>('input', inpName)?.focus(), 50);
});

async function submitCreate(): Promise<void> {
	const name = state.nameInput.trim();
	if (!name || state.selectedScopes.size === 0 || state.busy.create) return;
	state.busy.create = true;
	setDialogBusy('dlg-create', true);
	setDialogError('create-error', null);
	syncCreateButton();
	try {
		const result = await api.createToken({ name, scopes: [...state.selectedScopes] });
		state.tokens = await api.listTokens();
		rerender();
		closeDialog('dlg-create', true);
		openSecretDialog(result.token.name, result.secret);
	} catch (err) {
		setDialogError('create-error', err instanceof Error ? err.message : 'Failed to create token');
	} finally {
		state.busy.create = false;
		setDialogBusy('dlg-create', false);
		syncCreateButton();
	}
}

btnCreateSubmit.addEventListener('click', submitCreate);

/* ----------------------------- delete dialog ----------------------------- */
function openDeleteDialog(token: Token): void {
	state.activeToken = token;
	must('#delete-name').textContent = token.name;
	setDialogError('delete-error', null);
	openDialog('dlg-delete');
}

must('#btn-delete-submit').addEventListener('click', async () => {
	if (state.busy.delete || !state.activeToken) return;
	state.busy.delete = true;
	setDialogBusy('dlg-delete', true);
	setDialogError('delete-error', null);
	try {
		await api.deleteToken(state.activeToken.id);
		state.tokens = await api.listTokens();
		rerender();
		closeDialog('dlg-delete', true);
		state.activeToken = null;
	} catch (err) {
		setDialogError('delete-error', err instanceof Error ? err.message : 'Failed to delete token');
	} finally {
		state.busy.delete = false;
		setDialogBusy('dlg-delete', false);
	}
});

/* ----------------------------- extend dialog ----------------------------- */
function renderExtendOptions(): void {
	const group = must('#extend-options');
	group.innerHTML = EXTEND_OPTIONS.map(
		(o, i) => `
		<label class="radio-card">
			<input type="radio" name="duration" value="${o.value}" ${i === 0 ? 'checked' : ''} />
			<span class="radio-card__label">${esc(o.label)}</span>
		</label>`
	).join('');
}

function openExtendDialog(token: Token): void {
	state.activeToken = token;
	must('#extend-name').textContent = token.name;
	renderExtendOptions();
	setDialogError('extend-error', null);
	openDialog('dlg-extend');
}

must('#btn-extend-submit').addEventListener('click', async () => {
	if (state.busy.extend || !state.activeToken) return;
	const checked = maybe<HTMLInputElement>('#extend-options input[name="duration"]:checked');
	if (!checked) return;
	const duration = checked.value as TokenExtensionDuration;
	state.busy.extend = true;
	setDialogBusy('dlg-extend', true);
	setDialogError('extend-error', null);
	try {
		await api.extendToken(state.activeToken.id, duration);
		state.tokens = await api.listTokens();
		rerender();
		closeDialog('dlg-extend', true);
		state.activeToken = null;
	} catch (err) {
		setDialogError('extend-error', err instanceof Error ? err.message : 'Failed to extend token');
	} finally {
		state.busy.extend = false;
		setDialogBusy('dlg-extend', false);
	}
});

/* ----------------------------- secret dialog ----------------------------- */
function openSecretDialog(name: string, secret: string): void {
	must('#secret-name').textContent = name;
	must('#secret-value').textContent = secret;
	const copyBtn = must('#btn-copy-secret');
	copyBtn.setAttribute('label', 'Copy');
	copyBtn.setAttribute('icon', 'content_copy');
	openDialog('dlg-secret');
}

must('#btn-copy-secret').addEventListener('click', async () => {
	const valueEl = must('#secret-value');
	const value = valueEl.textContent ?? '';
	try {
		await navigator.clipboard.writeText(value);
	} catch {
		// Fallback for browsers without async clipboard access.
		const range = document.createRange();
		range.selectNodeContents(valueEl);
		const sel = window.getSelection();
		sel?.removeAllRanges();
		sel?.addRange(range);
		try {
			document.execCommand('copy');
		} catch {
			/* ignore */
		}
		sel?.removeAllRanges();
	}
	const btn = must('#btn-copy-secret');
	btn.setAttribute('label', 'Copied!');
	btn.setAttribute('icon', 'check');
	setTimeout(() => {
		btn.setAttribute('label', 'Copy');
		btn.setAttribute('icon', 'content_copy');
	}, 2000);
});

/* ----------------------------- initial load & refresh ----------------------------- */
async function loadAll(): Promise<void> {
	const [tokens, scopes] = await Promise.all([api.listTokens(), api.listScopes()]);
	state.tokens = tokens;
	state.scopes = scopes;
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
 * When embedded in the Kubeflow Central Dashboard (an iframe), the namespace
 * is selected by the parent frame. Poll for changes and refresh — mirrors the
 * behaviour of the original App.svelte onMount interval.
 */
function startNamespacePolling(): void {
	if (window.parent === window) return;
	let current = api.getNamespace();
	setInterval(async () => {
		const ns = api.getNamespace();
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
	apiNotice.textContent = config.apiNotice;
	void load();
	startNamespacePolling();
}
