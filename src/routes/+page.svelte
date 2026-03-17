<script lang="ts">
  import { onMount } from "svelte";
  import type { Token, Scope, TokenExtensionDuration } from "$lib/types";
  import * as api from "$lib/api";
  import TokenList from "$lib/components/TokenList.svelte";
  import CreateTokenModal from "$lib/components/CreateTokenModal.svelte";
  import DeleteConfirmModal from "$lib/components/DeleteConfirmModal.svelte";
  import SecretDisplayModal from "$lib/components/SecretDisplayModal.svelte";
  import ExtendTokenModal from "$lib/components/ExtendTokenModal.svelte";

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
      error = e instanceof Error ? e.message : "Failed to load tokens";
    }
  }

  async function loadScopes() {
    try {
      scopes = await api.listScopes();
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load scopes";
    }
  }

  onMount(() => {
    Promise.all([loadTokens(), loadScopes()]).then(() => {
      loading = false;
    });

    let currentNamespace = api.getNamespace();
    const interval =
      window.parent !== window
        ? setInterval(async () => {
            const ns = api.getNamespace();
            if (ns !== currentNamespace) {
              currentNamespace = ns;
              await Promise.all([loadTokens(), loadScopes()]);
            }
          }, 500)
        : undefined;

    return () => clearInterval(interval);
  });

  async function handleCreate(name: string, selectedScopes: string[]) {
    try {
      const result = await api.createToken({ name, scopes: selectedScopes });
      showCreateModal = false;
      createdSecret = { name: result.token.name, secret: result.secret };
      await loadTokens();
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to create token";
    }
  }

  async function handleDelete() {
    if (!tokenToDelete) return;
    try {
      await api.deleteToken(tokenToDelete.id);
      tokenToDelete = null;
      await loadTokens();
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to delete token";
    }
  }

  async function handleExtend(duration: TokenExtensionDuration) {
    if (!tokenToExtend) return;
    try {
      await api.extendToken(tokenToExtend.id, duration);
      tokenToExtend = null;
      await loadTokens();
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to extend token";
    }
  }
</script>

<svelte:head>
  <title>API Tokens</title>
</svelte:head>

<div>
  <div class="bg-white shadow">
    <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
      <h1 class="text-xl font-medium text-gray-800">API Tokens</h1>
      <button
        onclick={() => (showCreateModal = true)}
        disabled={loading}
        class="flex items-center gap-1 rounded border border-kubeflow-blue px-4 py-2 text-sm font-medium uppercase tracking-wide text-kubeflow-blue hover:bg-blue-50 disabled:opacity-50"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        New Token
      </button>
    </div>

    {#if error}
      <div class="mx-6 mt-4 flex items-center gap-3 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <span class="flex-1">{error}</span>
        <button onclick={() => (error = null)} class="font-medium underline">Dismiss</button>
      </div>
    {/if}

    {#if loading}
      <div class="py-16 text-center text-sm text-gray-500">Loading…</div>
    {:else}
      <TokenList
        {tokens}
        ondelete={(t) => (tokenToDelete = t)}
        onextend={(t) => (tokenToExtend = t)}
      />
    {/if}
  </div>
</div>

{#if showCreateModal}
  <CreateTokenModal
    {scopes}
    oncreate={handleCreate}
    oncancel={() => (showCreateModal = false)}
  />
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
