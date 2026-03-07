<script lang="ts">
	import Modal from './Modal.svelte';

	let { name, secret, onclose }: { name: string; secret: string; onclose: () => void } = $props();

	let copied = $state(false);

	async function copyToClipboard() {
		await navigator.clipboard.writeText(secret);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<Modal title="Token Created" onclose={onclose}>
	<div class="mb-4 rounded-md border border-amber-200 bg-amber-50 p-4">
		<p class="mb-2 text-sm font-medium text-amber-800">
			Copy your token now. You won't be able to see it again.
		</p>
	</div>
	<div class="mb-2">
		<span class="mb-1 block text-sm font-medium text-gray-700">Name</span>
		<p class="text-sm text-gray-900">{name}</p>
	</div>
	<div class="mb-6">
		<span class="mb-1 block text-sm font-medium text-gray-700">Secret</span>
		<div class="flex items-center gap-2">
			<code class="flex-1 break-all rounded-md bg-gray-100 px-3 py-2 text-sm font-mono text-gray-900">
				{secret}
			</code>
			<button
				onclick={copyToClipboard}
				class="shrink-0 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
			>
				{copied ? 'Copied!' : 'Copy'}
			</button>
		</div>
	</div>
	<div class="flex justify-end">
		<button
			onclick={onclose}
			class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
		>
			Done
		</button>
	</div>
</Modal>
