<script lang="ts">
	import type { Token } from '$lib/types';

	let {
		tokens,
		ondelete,
		onextend
	}: {
		tokens: Token[];
		ondelete: (token: Token) => void;
		onextend: (token: Token) => void;
	} = $props();

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function isExpired(iso: string): boolean {
		return new Date(iso) < new Date();
	}
</script>

{#if tokens.length === 0}
	<div class="px-6 py-16 text-center">
		<p class="text-sm text-gray-500">No tokens yet. Create one to get started.</p>
	</div>
{:else}
	<table class="w-full text-left text-sm">
		<thead>
			<tr class="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
				<th class="px-6 py-3">Name</th>
				<th class="px-6 py-3">Scopes</th>
				<th class="px-6 py-3">Expires</th>
				<th class="px-6 py-3">Created</th>
				<th class="px-6 py-3 text-right">Actions</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-100">
			{#each tokens as token (token.id)}
				{@const expired = isExpired(token.expires_at)}
				<tr class="hover:bg-gray-50" class:bg-red-50={expired}>
					<td class="px-6 py-3 font-medium text-gray-900">{token.name}</td>
					<td class="px-6 py-3">
						<div class="flex flex-wrap gap-1">
							{#each token.scopes as scope}
								<span class="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-kubeflow-blue ring-1 ring-inset ring-blue-100">
									{scope}
								</span>
							{/each}
						</div>
					</td>
					<td class="px-6 py-3 whitespace-nowrap" class:text-red-600={expired}>
						{formatDate(token.expires_at)}
						{#if expired}
							<span class="ml-1 text-xs font-medium">(expired)</span>
						{/if}
					</td>
					<td class="px-6 py-3 whitespace-nowrap text-gray-500">
						{formatDate(token.created_at)}
					</td>
					<td class="px-6 py-3 text-right">
						<div class="flex justify-end gap-2">
							<button
								onclick={() => onextend(token)}
								class="rounded px-3 py-1 text-xs font-medium uppercase tracking-wide text-kubeflow-blue hover:bg-blue-50"
							>
								Extend
							</button>
							<button
								onclick={() => ondelete(token)}
								class="rounded px-3 py-1 text-xs font-medium uppercase tracking-wide text-red-600 hover:bg-red-50"
							>
								Delete
							</button>
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
