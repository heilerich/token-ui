<script lang="ts">
	import type { Token } from '$lib/types';
	import Modal from './Modal.svelte';

	let {
		token,
		onconfirm,
		oncancel
	}: { token: Token; onconfirm: () => void; oncancel: () => void } = $props();
</script>

<Modal title="Delete Token" onclose={oncancel}>
	<p class="mb-6 text-gray-600">
		Are you sure you want to delete the token <span class="font-semibold text-gray-900">{token.name}</span>? This action cannot be undone.
	</p>
	<div class="flex justify-end gap-3">
		<button
			onclick={oncancel}
			class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
		>
			Cancel
		</button>
		<button
			onclick={onconfirm}
			class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
		>
			Delete
		</button>
	</div>
</Modal>
