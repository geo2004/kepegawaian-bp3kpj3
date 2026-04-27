<script lang="ts">
	import '../app.css';
	import AppNav from '$lib/components/AppNav.svelte';
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	const hideNav = $derived($page.url.pathname === '/login');
</script>

<div class="flex flex-col h-screen overflow-hidden">
	{#if data.user && !hideNav}
		<AppNav user={data.user} isAdmin={data.isAdmin} />
	{/if}
	<div class="flex-1 min-h-0 overflow-y-auto">
		{@render children()}
	</div>
</div>
