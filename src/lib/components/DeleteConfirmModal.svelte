<script lang="ts">
	import type { Token } from '$lib/types';
	import Modal from './Modal.svelte';
	import Spinner from './Spinner.svelte';
	import ErrorBanner from './ErrorBanner.svelte';

	let {
		token,
		onconfirm,
		oncancel
	}: { token: Token; onconfirm: () => Promise<void>; oncancel: () => void } = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);

	async function confirm() {
		loading = true;
		error = null;
		try {
			await onconfirm();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete token';
		} finally {
			loading = false;
		}
	}
</script>

<Modal title="Delete Token" onclose={oncancel} busy={loading}>
	{#if error}
		<ErrorBanner message={error} ondismiss={() => (error = null)} />
	{/if}
	<p class="mb-6 text-sm text-gray-600">
		Are you sure you want to delete the token <span class="font-semibold text-gray-900">{token.name}</span>? This action cannot be undone.
	</p>
	<div class="flex justify-end gap-3">
		<button
			onclick={oncancel}
			disabled={loading}
			class="rounded px-4 py-2 text-sm font-medium uppercase tracking-wide text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			Cancel
		</button>
		<button
			onclick={confirm}
			disabled={loading}
			class="flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-sm font-medium uppercase tracking-wide text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{#if loading}<Spinner />{/if}
			Delete
		</button>
	</div>
</Modal>
