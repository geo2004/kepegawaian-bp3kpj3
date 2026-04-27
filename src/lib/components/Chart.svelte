<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { ChartType, ChartData, ChartOptions } from 'chart.js';

	interface Props {
		type: ChartType;
		data: ChartData;
		options?: ChartOptions;
	}

	let { type, data, options = {} }: Props = $props();

	let canvas: HTMLCanvasElement;
	let chart: import('chart.js').Chart | null = null;
	let resizeObserver: ResizeObserver | null = null;

	onMount(async () => {
		const { Chart, registerables } = await import('chart.js');
		Chart.register(...registerables);
		chart = new Chart(canvas, { type, data, options });

		resizeObserver = new ResizeObserver(() => {
			chart?.resize();
		});
		if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);
	});

	onDestroy(() => {
		resizeObserver?.disconnect();
		chart?.destroy();
	});

	$effect(() => {
		if (!chart) return;
		chart.data = data;
		chart.options = options as ChartOptions;
		chart.update();
	});
</script>

<canvas bind:this={canvas} style="width:100%;height:100%;"></canvas>
