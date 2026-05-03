<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { getKgbStatusDisplay } from '$lib/utils/kgb';
	import { formatTanggal } from '$lib/utils/date';

	let { data }: { data: PageData } = $props();

	const docIdSet = new Set(data.docIds);

	let search = $state(data.filters.search ?? '');
	let lokasi = $state(data.filters.lokasi ?? '');
	let golongan = $state(data.filters.golongan ?? '');
	let status = $state(data.filters.status ?? '');
	let selectedYear = $state(data.stats.selectedYear);
	let activeCard = $state(data.filters.card ?? '');

	const YEARS = [2026, 2027, 2028, 2029, 2030];

	function buildParams(year = selectedYear, cardVal = activeCard) {
		const params = new URLSearchParams();
		if (search) params.set('search', search);
		if (lokasi) params.set('lokasi', lokasi);
		if (golongan) params.set('golongan', golongan);
		if (status) params.set('status', status);
		params.set('year', String(year));
		if (cardVal) params.set('card', cardVal);
		return params;
	}

	function applyFilters() {
		goto(`/kgb?${buildParams().toString()}`, { keepFocus: true });
	}

	function clearFilters() {
		search = '';
		lokasi = '';
		golongan = '';
		status = '';
		activeCard = '';
		selectedYear = new Date().getFullYear();
		goto('/kgb');
	}

	function changeYear(year: number) {
		selectedYear = year;
		goto(`/kgb?${buildParams(year).toString()}`, { keepFocus: true });
	}

	function toggleCard(cardVal: string) {
		const next = activeCard === cardVal ? '' : cardVal;
		activeCard = next;
		goto(`/kgb?${buildParams(selectedYear, next).toString()}`, { keepFocus: true });
	}
</script>

<svelte:head>
	<title>KGB Monitor — BP3KP Jawa III</title>
</svelte:head>

<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Header -->
	<div class="mb-6 flex flex-wrap items-start justify-between gap-4">
		<div>
			<h2 class="text-2xl font-bold text-gray-900">Monitoring Kenaikan Gaji Berkala</h2>
			<p class="text-gray-500 mt-1">Tahun {selectedYear} — Status KGB seluruh pegawai</p>
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

	<!-- Summary Cards -->
	<div class="grid grid-cols-2 {data.stats.dalam60Hari !== null ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4 mb-8">
		<div class="bg-white rounded-xl border border-gray-200 p-5">
			<p class="text-sm text-gray-500 font-medium">Total Pegawai</p>
			<p class="text-3xl font-bold text-gray-900 mt-1">{data.stats.total}</p>
		</div>
		<button
			onclick={() => toggleCard('eligible')}
			class="text-left rounded-xl border p-5 transition-all {activeCard === 'eligible'
				? 'bg-orange-600 border-orange-600'
				: 'bg-white border-orange-200 hover:border-orange-400'}"
		>
			<p class="text-sm font-medium {activeCard === 'eligible' ? 'text-orange-100' : 'text-orange-600'}">Pegawai Eligible KGB</p>
			<p class="text-3xl font-bold mt-1 {activeCard === 'eligible' ? 'text-white' : 'text-orange-600'}">{data.stats.eligibleTahunIni}</p>
		</button>
		{#if data.stats.dalam60Hari !== null}
			<button
				onclick={() => toggleCard('dalam60hari')}
				class="text-left rounded-xl border p-5 transition-all {activeCard === 'dalam60hari'
					? 'bg-yellow-500 border-yellow-500'
					: 'bg-white border-yellow-200 hover:border-yellow-400'}"
			>
				<p class="text-sm font-medium {activeCard === 'dalam60hari' ? 'text-yellow-100' : 'text-yellow-600'}">Dalam 60 Hari</p>
				<p class="text-3xl font-bold mt-1 {activeCard === 'dalam60hari' ? 'text-white' : 'text-yellow-600'}">{data.stats.dalam60Hari}</p>
			</button>
		{/if}
		<button
			onclick={() => toggleCard('sudah')}
			class="text-left rounded-xl border p-5 transition-all {activeCard === 'sudah'
				? 'bg-green-600 border-green-600'
				: 'bg-white border-green-200 hover:border-green-400'}"
		>
			<p class="text-sm font-medium {activeCard === 'sudah' ? 'text-green-100' : 'text-green-600'}">Sudah Diproses</p>
			<p class="text-3xl font-bold mt-1 {activeCard === 'sudah' ? 'text-white' : 'text-green-600'}">{data.stats.sudahDiproses}</p>
		</button>
		<button
			onclick={() => toggleCard('belum')}
			class="text-left rounded-xl border p-5 transition-all {activeCard === 'belum'
				? 'bg-blue-600 border-blue-600'
				: 'bg-white border-blue-200 hover:border-blue-400'}"
		>
			<p class="text-sm font-medium {activeCard === 'belum' ? 'text-blue-100' : 'text-blue-600'}">Belum Diproses</p>
			<p class="text-3xl font-bold mt-1 {activeCard === 'belum' ? 'text-white' : 'text-blue-600'}">{data.stats.belumProses}</p>
		</button>
	</div>

	<!-- Filter Bar -->
	<div class="bg-white rounded-xl border border-gray-200 p-4 mb-4">
		<div class="flex flex-wrap gap-3 items-end">
			<div class="flex-1 min-w-48">
				<label class="block text-xs font-medium text-gray-600 mb-1">Cari nama / NIP</label>
				<input
					type="text"
					bind:value={search}
					onkeydown={(e) => e.key === 'Enter' && applyFilters()}
					placeholder="Nama atau NIP/NRP..."
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label class="block text-xs font-medium text-gray-600 mb-1">Lokasi</label>
				<select
					bind:value={lokasi}
					class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="">Semua Lokasi</option>
					<option value="Yogyakarta">Yogyakarta</option>
					<option value="Rusun ASN Jawa Tengah">Rusun ASN Jawa Tengah</option>
					<option value="Keduanya">Keduanya</option>
				</select>
			</div>
			<div>
				<label class="block text-xs font-medium text-gray-600 mb-1">Status KGB</label>
				<select
					bind:value={status}
					class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="">Semua Status</option>
					<option value="eligible_pending">Belum Diproses</option>
					<option value="diusulkan">Sudah Diusulkan</option>
					<option value="sudah_diproses">Sudah Diproses</option>
					<option value="tidak_eligible">Tidak Eligible</option>
					<option value="maksimum">Maksimum</option>
				</select>
			</div>
			<div class="flex gap-2">
				<button
					onclick={applyFilters}
					class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
				>
					Filter
				</button>
				<button
					onclick={clearFilters}
					class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
				>
					Reset
				</button>
			</div>
		</div>
	</div>

	<!-- Table -->
	<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="bg-gray-50 border-b border-gray-200">
						<th class="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">No</th>
						<th class="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Nama</th>
						<th class="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">NIP/NRP</th>
						<th class="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Golongan</th>
						<th class="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Jabatan</th>
						<th class="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Lokasi</th>
						<th class="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">KGB Terakhir</th>
						<th class="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">KGB Berikutnya</th>
						<th class="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
						<th class="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">SK KGB Terakhir</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each data.employees as emp, i}
						{@const statusDisplay = getKgbStatusDisplay(emp)}
						<tr class="hover:bg-gray-50 transition-colors">
							<td class="px-4 py-3 text-gray-500">{i + 1}</td>
							<td class="px-4 py-3">
								<div class="font-medium text-gray-900">{emp.nama}</div>
								{#if emp.sub_unit}
									<div class="text-xs text-gray-400">{emp.sub_unit}</div>
								{/if}
							</td>
							<td class="px-4 py-3 text-gray-600 font-mono text-xs">{emp.nip_nrp ?? '-'}</td>
							<td class="px-4 py-3 text-gray-700">{emp.golongan ?? '-'}</td>
							<td class="px-4 py-3 text-gray-600 max-w-48 truncate">{emp.jabatan ?? '-'}</td>
							<td class="px-4 py-3 text-gray-600 text-xs">{emp.lokasi_berkantor}</td>
							<td class="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
								{formatTanggal(emp.tanggal_mulai_kgb_terakhir)}
							</td>
							<td class="px-4 py-3 text-gray-700 text-xs whitespace-nowrap font-medium">
								{formatTanggal(emp.tanggal_kgb_berikutnya)}
							</td>
							<td class="px-4 py-3">
								<span
									class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium {statusDisplay.bgClass} {statusDisplay.textClass}"
								>
									<span class="w-1.5 h-1.5 rounded-full {statusDisplay.dotClass}"></span>
									{statusDisplay.label}
								</span>
							</td>
							<td class="px-4 py-3 text-center">
								{#if docIdSet.has(emp.id)}
									<a
										href="/documents/{emp.id}"
										target="_blank"
										rel="noopener noreferrer"
										title="Lihat SK KGB"
										class="inline-flex items-center justify-center w-7 h-7 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
									>
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
											<path fill-rule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0-6a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clip-rule="evenodd" />
										</svg>
									</a>
								{:else}
									<span class="text-gray-300 text-xs">—</span>
								{/if}
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="10" class="px-4 py-12 text-center text-gray-400">
								Tidak ada data pegawai ditemukan.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		{#if data.employees.length > 0}
			<div class="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
				Menampilkan {data.employees.length} pegawai
			</div>
		{/if}
	</div>
</main>
