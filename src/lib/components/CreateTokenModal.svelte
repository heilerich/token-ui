<script lang="ts">
	import type { Scope } from '$lib/types';
	import Modal from './Modal.svelte';

	let {
		scopes,
		oncreate,
		oncancel
	}: {
		scopes: Scope[];
		oncreate: (name: string, selectedScopes: string[]) => void;
		oncancel: () => void;
	} = $props();

	let name = $state('');
	let selectedScopes = $state<Set<string>>(new Set());

	function toggleScope(id: string) {
		const next = new Set(selectedScopes);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		selectedScopes = next;
	}

	function submit() {
		if (!name.trim() || selectedScopes.size === 0) return;
		oncreate(name.trim(), [...selectedScopes]);
	}

	let canSubmit = $derived(name.trim().length > 0 && selectedScopes.size > 0);
</script>

<Modal title="Create New Token" onclose={oncancel}>
	<form onsubmit={e => { e.preventDefault(); submit(); }}>
		<div class="mb-4">
			<label for="token-name" class="mb-1 block text-sm font-medium text-gray-700">Token Name</label>
			<input
				id="token-name"
				type="text"
				bind:value={name}
				placeholder="e.g. CI Pipeline"
				class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
			/>
		</div>

		<div class="mb-6">
			<span class="mb-2 block text-sm font-medium text-gray-700">Scopes</span>
			<div class="max-h-48 space-y-2 overflow-y-auto rounded-md border border-gray-200 p-3">
				{#each scopes as scope (scope.id)}
					<label class="flex cursor-pointer items-start gap-3 rounded p-1 hover:bg-gray-50">
						<input
							type="checkbox"
							checked={selectedScopes.has(scope.id)}
							onchange={() => toggleScope(scope.id)}
							class="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
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
				class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
			>
				Cancel
			</button>
			<button
				type="submit"
				disabled={!canSubmit}
				class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				Create Token
			</button>
		</div>
	</form>
</Modal>
