<script lang="ts">
	import type { Token, TokenExtensionDuration } from '$lib/types';
	import Modal from './Modal.svelte';
	import Spinner from './Spinner.svelte';
	import ErrorBanner from './ErrorBanner.svelte';

	let {
		token,
		onconfirm,
		oncancel
	}: {
		token: Token;
		onconfirm: (duration: TokenExtensionDuration) => Promise<void>;
		oncancel: () => void;
	} = $props();

	const options: Array<{ value: TokenExtensionDuration; label: string }> = [
		{ value: '720h', label: '30 days' },
		{ value: '4380h', label: '6 months' },
		{ value: '8760h', label: '12 months' }
	];

	let selectedDuration = $state<TokenExtensionDuration>('720h');
	let loading = $state(false);
	let error = $state<string | null>(null);

	async function submit() {
		if (loading) return;
		loading = true;
		error = null;
		try {
			await onconfirm(selectedDuration);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to extend token';
		} finally {
			loading = false;
		}
	}
</script>

<Modal title="Extend Token" onclose={oncancel} busy={loading}>
	<form onsubmit={e => { e.preventDefault(); submit(); }}>
		{#if error}
			<ErrorBanner message={error} ondismiss={() => (error = null)} />
		{/if}
		<p class="mb-4 text-sm text-gray-600">
			Select how long to extend <span class="font-semibold text-gray-900">{token.name}</span>.
		</p>
		<div class="mb-6 space-y-2">
			{#each options as option (option.value)}
				<label class="flex cursor-pointer items-center gap-3 rounded border border-gray-200 p-3 hover:bg-gray-50 has-[:checked]:border-kubeflow-blue has-[:checked]:bg-blue-50">
					<input
						type="radio"
						name="extend-period"
						bind:group={selectedDuration}
						value={option.value}
						disabled={loading}
						class="h-4 w-4 border-gray-300 text-kubeflow-blue focus:ring-kubeflow-blue"
					/>
					<span class="text-sm font-medium text-gray-900">{option.label}</span>
				</label>
			{/each}
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
				disabled={loading}
				class="flex items-center gap-2 rounded bg-kubeflow-blue px-4 py-2 text-sm font-medium uppercase tracking-wide text-white hover:bg-kubeflow-blue-dark disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if loading}<Spinner />{/if}
				Extend
			</button>
		</div>
	</form>
</Modal>
