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
	<div class="mb-4 flex items-start gap-3 rounded border border-amber-200 bg-amber-50 p-4">
		<svg class="mt-0.5 h-4 w-4 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
		</svg>
		<p class="text-sm font-medium text-amber-800">
			Copy your token now. You won't be able to see it again.
		</p>
	</div>
	<div class="mb-3">
		<span class="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Name</span>
		<p class="text-sm text-gray-900">{name}</p>
	</div>
	<div class="mb-6">
		<span class="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Secret</span>
		<div class="flex items-center gap-2">
			<code class="flex-1 break-all rounded bg-gray-100 px-3 py-2 text-sm font-mono text-gray-900">
				{secret}
			</code>
			<button
				onclick={copyToClipboard}
				class="shrink-0 rounded border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
			>
				{copied ? 'Copied!' : 'Copy'}
			</button>
		</div>
	</div>
	<div class="flex justify-end">
		<button
			onclick={onclose}
			class="rounded bg-kubeflow-blue px-4 py-2 text-sm font-medium uppercase tracking-wide text-white hover:bg-kubeflow-blue-dark"
		>
			Done
		</button>
	</div>
</Modal>
