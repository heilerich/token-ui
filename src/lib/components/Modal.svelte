<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, onclose, children }: { title: string; onclose: () => void; children: Snippet } =
		$props();

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}

	function onbackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) onclose();
	}
</script>

<svelte:window {onkeydown} />

<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
	onclick={onbackdrop}
	role="presentation"
>
	<div class="w-full max-w-lg rounded bg-white shadow-xl">
		<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
			<h2 class="text-base font-medium text-gray-900">{title}</h2>
			<button
				onclick={onclose}
				class="text-gray-400 hover:text-gray-600"
				aria-label="Close"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
		<div class="px-6 py-5">
			{@render children()}
		</div>
	</div>
</div>
