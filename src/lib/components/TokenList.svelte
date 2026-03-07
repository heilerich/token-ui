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
	<div class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
		<p class="text-gray-500">No tokens yet. Create one to get started.</p>
	</div>
{:else}
	<div class="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
		<table class="w-full text-left text-sm">
			<thead class="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
				<tr>
					<th class="px-4 py-3">Name</th>
					<th class="px-4 py-3">Scopes</th>
					<th class="px-4 py-3">Expires</th>
					<th class="px-4 py-3">Created</th>
					<th class="px-4 py-3 text-right">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200">
				{#each tokens as token (token.id)}
					{@const expired = isExpired(token.expires_at)}
					<tr class="hover:bg-gray-50" class:bg-red-50={expired}>
						<td class="px-4 py-3 font-medium text-gray-900">{token.name}</td>
						<td class="px-4 py-3">
							<div class="flex flex-wrap gap-1">
								{#each token.scopes as scope}
									<span class="inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
										{scope}
									</span>
								{/each}
							</div>
						</td>
						<td class="px-4 py-3 whitespace-nowrap" class:text-red-600={expired}>
							{formatDate(token.expires_at)}
							{#if expired}
								<span class="text-xs font-medium">(expired)</span>
							{/if}
						</td>
						<td class="px-4 py-3 whitespace-nowrap text-gray-500">
							{formatDate(token.created_at)}
						</td>
						<td class="px-4 py-3 text-right">
							<div class="flex justify-end gap-2">
								<button
									onclick={() => onextend(token)}
									class="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
								>
									Extend
								</button>
								<button
									onclick={() => ondelete(token)}
									class="rounded border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
								>
									Delete
								</button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
