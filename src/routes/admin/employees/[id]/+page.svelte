<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import EmployeeForm from '$lib/components/EmployeeForm.svelte';
	import { getKgbStatusDisplay } from '$lib/utils/kgb';
	import { formatTanggal } from '$lib/utils/date';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const statusDisplay = $derived(getKgbStatusDisplay(data.employee));
	const canProcess = $derived(
		data.employee.kgb_status_category !== 'tidak_eligible' &&
			data.employee.kgb_status_category !== 'maksimum' &&
			data.employee.tanggal_kgb_berikutnya !== null
	);
</script>

<svelte:head><title>Edit {data.employee.nama} — Admin Kepegawaian</title></svelte:head>

<div class="p-8 max-w-3xl">
	<div class="mb-6">
		<a href="/admin/employees" class="text-sm text-blue-600 hover:underline">← Daftar Pegawai</a>
		<h1 class="text-2xl font-bold text-gray-900 mt-2">{data.employee.nama}</h1>
		<div class="flex items-center gap-3 mt-2">
			<span
				class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium {statusDisplay.bgClass} {statusDisplay.textClass}"
			>
				<span class="w-1.5 h-1.5 rounded-full {statusDisplay.dotClass}"></span>
				{statusDisplay.label}
			</span>
			{#if data.employee.tanggal_kgb_berikutnya}
				<span class="text-sm text-gray-500">
					KGB Berikutnya: <strong>{formatTanggal(data.employee.tanggal_kgb_berikutnya)}</strong>
				</span>
			{/if}
		</div>
	</div>

	{#if form?.success}
		<div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
			Perubahan berhasil disimpan.
		</div>
	{/if}

	<!-- Tandai Diproses -->
	{#if canProcess}
		<div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
			<div>
				<p class="font-medium text-blue-900 text-sm">Tandai KGB Sebagai Sudah Diproses</p>
				<p class="text-xs text-blue-600 mt-0.5">
					Ini akan mencatat riwayat KGB dan menggeser periode KGB berikutnya.
				</p>
			</div>
			<form method="POST" action="?/proses">
				<button
					type="submit"
					onclick={(e) => {
						if (!confirm('Tandai KGB pegawai ini sebagai sudah diproses?')) e.preventDefault();
					}}
					class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
				>
					Tandai Diproses ✓
				</button>
			</form>
		</div>
	{/if}

	<!-- Edit Form -->
	<form method="POST" action="?/update">
		<EmployeeForm employee={data.employee} error={form?.error} />
		<div class="mt-6 flex gap-3">
			<button
				type="submit"
				class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors"
			>
				Simpan Perubahan
			</button>
			<a
				href="/admin/employees"
				class="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition-colors"
			>
				Batal
			</a>
		</div>
	</form>

	<!-- Dokumen KGB -->
	<div class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Dokumen SK KGB Terakhir</h2>
		<div class="bg-white rounded-xl border border-gray-200 p-5">

			{#if form?.uploadSuccess}
				<div class="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
					Dokumen berhasil diupload.
				</div>
			{/if}
			{#if form?.deleteSuccess}
				<div class="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm">
					Dokumen berhasil dihapus.
				</div>
			{/if}
			{#if form?.error && (form.uploadSuccess === undefined && form.deleteSuccess === undefined)}
				<div class="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
					{form.error}
				</div>
			{/if}

			{#if data.hasDoc}
				<div class="flex items-center justify-between gap-4 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
					<div class="flex items-center gap-2 text-sm text-gray-700">
						<span class="text-red-500 text-lg">📄</span>
						<span class="font-medium">SK KGB — {data.employee.nama}</span>
					</div>
					<div class="flex gap-2">
						<a
							href="/documents/{data.employee.id}"
							target="_blank"
							class="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
						>
							Lihat PDF
						</a>
						<a
							href="/documents/{data.employee.id}"
							download
							class="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
						>
							Unduh
						</a>
						<form method="POST" action="?/deletedoc" class="inline">
							<button
								type="submit"
								onclick={(e) => { if (!confirm('Hapus dokumen ini?')) e.preventDefault(); }}
								class="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
							>
								Hapus
							</button>
						</form>
					</div>
				</div>
			{:else}
				<p class="text-sm text-gray-400 mb-4">Belum ada dokumen SK KGB yang diupload.</p>
			{/if}

			<form method="POST" action="?/uploaddoc" enctype="multipart/form-data">
				<div class="flex items-center gap-3">
					<input
						type="file"
						name="document"
						accept="application/pdf"
						required
						class="flex-1 text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
					/>
					<button
						type="submit"
						class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
					>
						{data.hasDoc ? 'Ganti Dokumen' : 'Upload Dokumen'}
					</button>
				</div>
				<p class="text-xs text-gray-400 mt-1.5">Format PDF, maksimal 10 MB. File lama akan diganti.</p>
			</form>
		</div>
	</div>

	<!-- KGB History -->
	{#if data.history.length > 0}
		<div class="mt-10">
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Riwayat KGB</h2>
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<table class="w-full text-sm">
					<thead>
						<tr class="bg-gray-50 border-b border-gray-200">
							<th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Periode KGB</th>
							<th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Golongan</th>
							<th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tgl Diproses</th>
							<th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Catatan</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each data.history as h}
							<tr>
								<td class="px-4 py-3 text-xs">
									{formatTanggal(h.tanggal_mulai)} → {formatTanggal(h.tanggal_kgb)}
								</td>
								<td class="px-4 py-3 text-xs text-gray-600">
									{h.golongan_sebelum ?? '-'}
									{#if h.golongan_sesudah} → {h.golongan_sesudah}{/if}
								</td>
								<td class="px-4 py-3 text-xs text-gray-600">{formatTanggal(h.tanggal_diproses)}</td>
								<td class="px-4 py-3 text-xs text-gray-500">{h.catatan ?? '-'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
