<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let search = $state(data.filters.search ?? '');
	let lokasi = $state(data.filters.lokasi ?? '');
	let tipe = $state(data.filters.tipe ?? '');

	function applyFilters() {
		const params = new URLSearchParams();
		if (search) params.set('search', search);
		if (lokasi) params.set('lokasi', lokasi);
		if (tipe) params.set('tipe', tipe);
		goto(`/admin/employees?${params.toString()}`);
	}

	const TIPE_LABELS: Record<string, string> = {
		PNS: 'PNS',
		PPPK: 'PPPK',
		PPPK_PARUH_WAKTU: 'PPPK Paruh Waktu',
		CPNS: 'CPNS',
	};

	const TIPE_BADGE: Record<string, string> = {
		PNS: 'bg-blue-100 text-blue-700',
		PPPK: 'bg-purple-100 text-purple-700',
		PPPK_PARUH_WAKTU: 'bg-indigo-100 text-indigo-700',
		CPNS: 'bg-amber-100 text-amber-700',
	};
</script>

<svelte:head><title>Daftar Pegawai — Admin Kepegawaian</title></svelte:head>

<!-- Full-height column: header + filters sit above; table scrolls independently -->
<div class="flex flex-col h-full">

	<!-- Page header -->
	<div class="flex items-center justify-between px-6 pt-6 pb-3 shrink-0">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Daftar Pegawai</h1>
			<p class="text-gray-500 mt-0.5 text-sm">{data.employees.length} pegawai ditemukan</p>
		</div>
		<a
			href="/admin/employees/new"
			class="px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
			style="background:#0E5B73;"
		>
			+ Tambah Pegawai
		</a>
	</div>

	<!-- Filters -->
	<div class="px-6 pb-3 shrink-0">
		<div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
			<div class="flex-1 min-w-48">
				<input
					type="text"
					bind:value={search}
					onkeydown={(e) => e.key === 'Enter' && applyFilters()}
					placeholder="Cari nama / NIP..."
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
				/>
			</div>
			<select
				bind:value={tipe}
				class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
			>
				<option value="">Semua Tipe</option>
				{#each Object.entries(TIPE_LABELS) as [val, label]}
					<option value={val}>{label}</option>
				{/each}
			</select>
			<select
				bind:value={lokasi}
				class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
			>
				<option value="">Semua Lokasi</option>
				<option value="Yogyakarta">Yogyakarta</option>
				<option value="Rusun ASN Jawa Tengah">Rusun ASN Jawa Tengah</option>
				<option value="Keduanya">Keduanya</option>
			</select>
			<button
				onclick={applyFilters}
				class="px-4 py-2 text-white text-sm font-medium rounded-lg"
				style="background:#0E5B73;"
			>
				Filter
			</button>
		</div>
	</div>

	<!-- Table — scrolls vertically, header stays sticky -->
	<div class="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-6">
		<div class="bg-white rounded-xl border border-gray-200">
			<table class="w-full text-sm" style="table-layout: fixed;">
				<colgroup>
					<col style="width:22%">  <!-- Nama -->
					<col style="width:14%">  <!-- NIP -->
					<col style="width:10%">  <!-- Tipe -->
					<col style="width:6%">   <!-- Gol -->
					<col style="width:24%">  <!-- Jabatan -->
					<col style="width:13%">  <!-- Lokasi -->
					<col style="width:5%">   <!-- JK -->
					<col style="width:6%">   <!-- Aksi -->
				</colgroup>
				<thead class="sticky top-0 z-10" style="box-shadow: 0 1px 0 #e5e7eb;">
					<tr class="bg-gray-50">
						<th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama</th>
						<th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">NIP / NRP</th>
						<th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipe</th>
						<th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Gol.</th>
						<th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Jabatan</th>
						<th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Lokasi</th>
						<th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">JK</th>
						<th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each data.employees as emp}
						<tr class="hover:bg-gray-50">
							<td class="px-4 py-3">
								<a
									href="/admin/employees/{emp.id}"
									class="font-medium hover:underline truncate block"
									style="color:#0E5B73"
								>{emp.nama}</a>
								{#if emp.sub_unit}
									<div class="text-xs text-gray-400 mt-0.5 truncate">{emp.sub_unit}</div>
								{/if}
							</td>
							<td class="px-4 py-3 font-mono text-xs text-gray-500 truncate">{emp.nip_nrp ?? '—'}</td>
							<td class="px-4 py-3">
								<span class="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap {TIPE_BADGE[emp.employee_type] ?? 'bg-gray-100 text-gray-600'}">
									{TIPE_LABELS[emp.employee_type] ?? emp.employee_type}
								</span>
							</td>
							<td class="px-4 py-3 text-gray-700 text-xs">{emp.golongan ?? '—'}</td>
							<td class="px-4 py-3">
								<div class="text-gray-700 truncate">{emp.jabatan ?? '—'}</div>
								{#if emp.jabatan_perbendaharaan}
									<div class="text-xs text-gray-400 truncate mt-0.5">{emp.jabatan_perbendaharaan}</div>
								{/if}
							</td>
							<td class="px-4 py-3 text-xs text-gray-600 truncate">{emp.lokasi_berkantor}</td>
							<td class="px-4 py-3 text-xs text-gray-600">
								{emp.jenis_kelamin === 'Laki-laki' ? 'L' : emp.jenis_kelamin === 'Perempuan' ? 'P' : '—'}
							</td>
							<td class="px-4 py-3">
								<div class="flex gap-2">
									<a href="/admin/employees/{emp.id}" class="text-xs font-medium hover:underline" style="color:#0E5B73">
										Edit
									</a>
									<form method="POST" action="?/delete" class="inline">
										<input type="hidden" name="id" value={emp.id} />
										<button
											type="submit"
											onclick={(e) => {
												if (!confirm(`Hapus pegawai "${emp.nama}"?`)) e.preventDefault();
											}}
											class="text-xs text-red-500 hover:text-red-700 font-medium"
										>
											Hapus
										</button>
									</form>
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="8" class="px-4 py-12 text-center text-gray-400">Tidak ada data.</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
