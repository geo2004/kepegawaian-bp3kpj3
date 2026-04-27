<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let selectedYear = $state(data.stats.selectedYear);
	const YEARS = [2026, 2027, 2028, 2029, 2030];

	function changeYear(year: number) {
		selectedYear = year;
		goto(`/admin?year=${year}`, { keepFocus: true });
	}
</script>

<svelte:head>
	<title>Admin Dashboard — Kepegawaian BP3KP Jawa III</title>
</svelte:head>

<div class="p-8">
	<!-- Header -->
	<div class="mb-6 flex flex-wrap items-start justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
			<p class="text-gray-500 mt-1">Ringkasan status KGB seluruh pegawai — Tahun {selectedYear}</p>
		</div>
		<!-- Year Filter -->
		<div class="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
			{#each YEARS as year}
				<button
					onclick={() => changeYear(year)}
					class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors {selectedYear === year
						? 'bg-white text-blue-600 shadow-sm'
						: 'text-gray-500 hover:text-gray-800'}"
				>
					{year}
				</button>
			{/each}
		</div>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-2 {data.stats.dalam60Hari !== null ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4 mb-8">
		<div class="bg-white rounded-xl border border-gray-200 p-5">
			<p class="text-sm text-gray-500">Total Pegawai Aktif</p>
			<p class="text-3xl font-bold text-gray-900 mt-1">{data.stats.total}</p>
		</div>
		<div class="bg-white rounded-xl border border-orange-200 p-5">
			<p class="text-sm text-orange-600">Pegawai Eligible KGB</p>
			<p class="text-3xl font-bold text-orange-600 mt-1">{data.stats.eligibleTahunIni}</p>
		</div>
		{#if data.stats.dalam60Hari !== null}
			<div class="bg-white rounded-xl border border-yellow-200 p-5">
				<p class="text-sm text-yellow-600">Dalam 60 Hari</p>
				<p class="text-3xl font-bold text-yellow-600 mt-1">{data.stats.dalam60Hari}</p>
			</div>
		{/if}
		<div class="bg-white rounded-xl border border-green-200 p-5">
			<p class="text-sm text-green-600">Sudah Diproses</p>
			<p class="text-3xl font-bold text-green-600 mt-1">{data.stats.sudahDiproses}</p>
		</div>
		<div class="bg-white rounded-xl border border-blue-200 p-5">
			<p class="text-sm text-blue-600">Belum Diproses</p>
			<p class="text-3xl font-bold text-blue-600 mt-1">{data.stats.belumProses}</p>
		</div>
	</div>

	<!-- By Type -->
	<div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
		<h2 class="font-semibold text-gray-900 mb-4">Komposisi Pegawai</h2>
		<div class="flex flex-wrap gap-4">
			{#each Object.entries(data.stats.byType) as [type, count]}
				{#if count > 0}
					<div class="text-center">
						<p class="text-2xl font-bold text-gray-900">{count}</p>
						<p class="text-xs text-gray-500 mt-0.5">{type.replace('_', ' ')}</p>
					</div>
				{/if}
			{/each}
		</div>
	</div>

	<!-- Quick Actions -->
	<div class="grid grid-cols-2 gap-4">
		<a
			href="/admin/employees/new"
			class="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-5 flex items-center gap-3 transition-colors"
		>
			<span class="text-2xl">➕</span>
			<div>
				<p class="font-semibold">Tambah Pegawai</p>
				<p class="text-sm text-blue-200">Input data manual</p>
			</div>
		</a>
		<a
			href="/admin/import"
			class="bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-5 flex items-center gap-3 transition-colors"
		>
			<span class="text-2xl">📂</span>
			<div>
				<p class="font-semibold text-gray-900">Import XLSX</p>
				<p class="text-sm text-gray-500">Upload file spreadsheet</p>
			</div>
		</a>
	</div>
</div>
