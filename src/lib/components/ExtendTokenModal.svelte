<script lang="ts">
	import type { Token, TokenExtensionPeriod } from '$lib/types';
	import Modal from './Modal.svelte';

	let {
		token,
		onconfirm,
		oncancel
	}: {
		token: Token;
		onconfirm: (period: TokenExtensionPeriod) => void;
		oncancel: () => void;
	} = $props();

	const options: Array<{ value: TokenExtensionPeriod; label: string }> = [
		{ value: '30d', label: '30 days' },
		{ value: '6m', label: '6 months' },
		{ value: '12m', label: '12 months' }
	];

	let selectedPeriod = $state<TokenExtensionPeriod>('30d');

	function submit() {
		onconfirm(selectedPeriod);
	}
</script>

<Modal title="Extend Token" onclose={oncancel}>
	<form onsubmit={e => { e.preventDefault(); submit(); }}>
		<p class="mb-4 text-gray-600">
			Select how long to extend <span class="font-semibold text-gray-900">{token.name}</span>.
		</p>
		<div class="mb-6 space-y-2">
			{#each options as option (option.value)}
				<label class="flex cursor-pointer items-center gap-3 rounded border border-gray-200 p-3 hover:bg-gray-50">
					<input
						type="radio"
						name="extend-period"
						bind:group={selectedPeriod}
						value={option.value}
						class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
					/>
					<span class="text-sm font-medium text-gray-900">{option.label}</span>
				</label>
			{/each}
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
				class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
			>
				Extend
			</button>
		</div>
	</form>
</Modal>
