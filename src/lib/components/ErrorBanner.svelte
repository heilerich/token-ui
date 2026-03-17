<script lang="ts">
	let { message, ondismiss }: { message: string; ondismiss: () => void } = $props();
</script>

<div class="mb-4 flex items-center gap-3 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
	<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
		<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
	</svg>
	<span class="flex-1">{message}</span>
	<button type="button" onclick={ondismiss} class="font-medium underline">Dismiss</button>
</div>
