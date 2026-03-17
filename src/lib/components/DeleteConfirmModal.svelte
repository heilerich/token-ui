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
	<p class="mb-6 text-sm text-gray-600">
		Are you sure you want to delete the token <span class="font-semibold text-gray-900">{token.name}</span>? This action cannot be undone.
	</p>
	<div class="flex justify-end gap-3">
		<button
			onclick={oncancel}
			class="rounded px-4 py-2 text-sm font-medium uppercase tracking-wide text-gray-600 hover:bg-gray-100"
		>
			Cancel
		</button>
		<button
			onclick={onconfirm}
			class="rounded bg-red-600 px-4 py-2 text-sm font-medium uppercase tracking-wide text-white hover:bg-red-700"
		>
			Delete
		</button>
	</div>
</Modal>
