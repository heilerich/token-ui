<script lang="ts">
	import { onMount } from 'svelte';
	import type { Token, Scope, TokenExtensionDuration } from '$lib/types';
	import * as api from '$lib/api';
	import TokenList from '$lib/components/TokenList.svelte';
	import CreateTokenModal from '$lib/components/CreateTokenModal.svelte';
	import DeleteConfirmModal from '$lib/components/DeleteConfirmModal.svelte';
	import SecretDisplayModal from '$lib/components/SecretDisplayModal.svelte';
	import ExtendTokenModal from '$lib/components/ExtendTokenModal.svelte';

	let tokens = $state<Token[]>([]);
	let scopes = $state<Scope[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let showCreateModal = $state(false);
	let tokenToDelete = $state<Token | null>(null);
	let tokenToExtend = $state<Token | null>(null);
	let createdSecret = $state<{ name: string; secret: string } | null>(null);

	async function loadTokens() {
		try {
			tokens = await api.listTokens();
			error = null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load tokens';
		}
	}

	async function loadScopes() {
		try {
			scopes = await api.listScopes();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load scopes';
		}
	}

	onMount(async () => {
		await Promise.all([loadTokens(), loadScopes()]);
		loading = false;
	});

	async function handleCreate(name: string, selectedScopes: string[]) {
		try {
			const result = await api.createToken({ name, scopes: selectedScopes });
			showCreateModal = false;
			createdSecret = { name: result.token.name, secret: result.secret };
			await loadTokens();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create token';
		}
	}

	async function handleDelete() {
		if (!tokenToDelete) return;
		try {
			await api.deleteToken(tokenToDelete.id);
			tokenToDelete = null;
			await loadTokens();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete token';
		}
	}

	async function handleExtend(duration: TokenExtensionDuration) {
		if (!tokenToExtend) return;
		try {
			await api.extendToken(tokenToExtend.id, duration);
			tokenToExtend = null;
			await loadTokens();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to extend token';
		}
	}
</script>

<svelte:head>
	<title>API Tokens</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900">API Tokens</h1>
		<button
			onclick={() => (showCreateModal = true)}
			disabled={loading}
			class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
		>
			Create Token
		</button>
	</div>

	{#if error}
		<div class="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
			{error}
			<button onclick={() => (error = null)} class="ml-2 font-medium underline">Dismiss</button>
		</div>
	{/if}

	{#if loading}
		<div class="py-12 text-center text-gray-500">Loading...</div>
	{:else}
		<TokenList {tokens} ondelete={(t) => (tokenToDelete = t)} onextend={(t) => (tokenToExtend = t)} />
	{/if}
</div>

{#if showCreateModal}
	<CreateTokenModal {scopes} oncreate={handleCreate} oncancel={() => (showCreateModal = false)} />
{/if}

{#if tokenToDelete}
	<DeleteConfirmModal
		token={tokenToDelete}
		onconfirm={handleDelete}
		oncancel={() => (tokenToDelete = null)}
	/>
{/if}

{#if tokenToExtend}
	<ExtendTokenModal
		token={tokenToExtend}
		onconfirm={handleExtend}
		oncancel={() => (tokenToExtend = null)}
	/>
{/if}

{#if createdSecret}
	<SecretDisplayModal
		name={createdSecret.name}
		secret={createdSecret.secret}
		onclose={() => (createdSecret = null)}
	/>
{/if}
