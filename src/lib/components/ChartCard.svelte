<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		id: string;
		title: string;
		subtitle?: string;
		expandedId: string | null;
		onToggle: (id: string) => void;
		height?: string;
		expandedHeight?: string;
		center?: boolean;
		children: Snippet;
	}

	let {
		id,
		title,
		subtitle,
		expandedId,
		onToggle,
		height = 'h-44',
		expandedHeight = 'h-[420px]',
		center = false,
		children
	}: Props = $props();

	const isExpanded = $derived(expandedId === id);
	const currentHeight = $derived(isExpanded ? expandedHeight : height);
</script>

<div class="bg-white rounded-xl shadow p-4 transition-all duration-200 {isExpanded ? 'col-span-full' : ''}">
	<div class="flex items-start justify-between gap-2 mb-2">
		<div class="min-w-0">
			<span class="text-xs font-semibold text-gray-600">{title}</span>
			{#if subtitle}
				<span class="text-xs font-normal text-gray-400 ml-1">{subtitle}</span>
			{/if}
		</div>
		<button
			onclick={() => onToggle(id)}
			class="shrink-0 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
			title={isExpanded ? 'Kecilkan' : 'Perbesar'}
		>
			{#if isExpanded}
				<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="4 14 10 14 10 20"></polyline>
					<polyline points="20 10 14 10 14 4"></polyline>
					<line x1="10" y1="14" x2="3" y2="21"></line>
					<line x1="21" y1="3" x2="14" y2="10"></line>
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="15 3 21 3 21 9"></polyline>
					<polyline points="9 21 3 21 3 15"></polyline>
					<line x1="21" y1="3" x2="14" y2="10"></line>
					<line x1="3" y1="21" x2="10" y2="14"></line>
				</svg>
			{/if}
		</button>
	</div>

	<div class="{currentHeight} {center ? 'flex items-center justify-center' : ''} transition-all duration-300">
		{@render children()}
	</div>
</div>
