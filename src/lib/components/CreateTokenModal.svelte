<script lang="ts">
	import type { Scope } from '$lib/types';
	import Modal from './Modal.svelte';
	import Spinner from './Spinner.svelte';
	import ErrorBanner from './ErrorBanner.svelte';

	let {
		scopes,
		oncreate,
		oncancel
	}: {
		scopes: Scope[];
		oncreate: (name: string, selectedScopes: string[]) => Promise<void>;
		oncancel: () => void;
	} = $props();

	let name = $state('');
	let selectedScopes = $state<Set<string>>(new Set());
	let loading = $state(false);
	let error = $state<string | null>(null);

	function toggleScope(id: string) {
		const next = new Set(selectedScopes);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		selectedScopes = next;
	}

	async function submit() {
		if (!name.trim() || selectedScopes.size === 0 || loading) return;
		loading = true;
		error = null;
		try {
			await oncreate(name.trim(), [...selectedScopes]);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create token';
		} finally {
			loading = false;
		}
	}

	let canSubmit = $derived(name.trim().length > 0 && selectedScopes.size > 0 && !loading);
</script>

<Modal title="Create New Token" onclose={oncancel} busy={loading}>
	<form onsubmit={e => { e.preventDefault(); submit(); }}>
		{#if error}
			<ErrorBanner message={error} ondismiss={() => (error = null)} />
		{/if}

		<div class="mb-4">
			<label for="token-name" class="mb-1 block text-sm font-medium text-gray-700">Token Name</label>
			<input
				id="token-name"
				type="text"
				bind:value={name}
				placeholder="e.g. CI Pipeline"
				disabled={loading}
				class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-kubeflow-blue focus:ring-1 focus:ring-kubeflow-blue focus:outline-none disabled:opacity-60"
			/>
		</div>

		<div class="mb-6">
			<span class="mb-2 block text-sm font-medium text-gray-700">Scopes</span>
			<div class="max-h-48 space-y-1 overflow-y-auto rounded border border-gray-200 p-3">
				{#each scopes as scope (scope.id)}
					<label class="flex cursor-pointer items-start gap-3 rounded p-1 hover:bg-gray-50">
						<input
							type="checkbox"
							checked={selectedScopes.has(scope.id)}
							onchange={() => toggleScope(scope.id)}
							disabled={loading}
							class="mt-0.5 h-4 w-4 rounded border-gray-300 text-kubeflow-blue focus:ring-kubeflow-blue"
						/>
						<div>
							<span class="text-sm font-medium text-gray-900">{scope.name}</span>
							{#if scope.description}
								<p class="text-xs text-gray-500">{scope.description}</p>
							{/if}
						</div>
					</label>
				{/each}
			</div>
		</div>

		<div class="flex justify-end gap-3">
			<button
				type="button"
				onclick={oncancel}
				disabled={loading}
				class="rounded px-4 py-2 text-sm font-medium uppercase tracking-wide text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				Cancel
			</button>
			<button
				type="submit"
				disabled={!canSubmit}
				class="flex items-center gap-2 rounded bg-kubeflow-blue px-4 py-2 text-sm font-medium uppercase tracking-wide text-white hover:bg-kubeflow-blue-dark disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if loading}<Spinner />{/if}
				Create Token
			</button>
		</div>
	</form>
</Modal>
