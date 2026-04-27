<script lang="ts">
	import type { ActionData } from './$types';
	import type { ParsedEmployee } from '$lib/types/app.types';

	let { form }: { form: ActionData } = $props();

	type ImportMode = 'standard' | 'enrichment';

	// Step state
	let importMode = $state<ImportMode>('standard');
	let step = $state(1);
	let file: File | null = $state(null);
	let sheets: string[] = $state([]);
	let selectedSheet = $state('');
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let workbook: any = $state(null);
	let parsedEmployees: ParsedEmployee[] = $state([]);
	let parseErrors: Array<{ row: number; message: string }> = $state([]);
	let conflictMode = $state('overwrite');
	let loading = $state(false);
	let parseError = $state('');

	async function handleFile(e: Event) {
		const input = e.target as HTMLInputElement;
		file = input.files?.[0] ?? null;
		if (!file) return;

		loading = true;
		parseError = '';
		try {
			const { parseXlsxFile } = await import('$lib/utils/xlsx-parser');
			const XLSX = await import('xlsx');
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(window as any).XLSX_INSTANCE = XLSX;
			const result = await parseXlsxFile(file);
			sheets = result.sheets;
			workbook = result.workbook;
			selectedSheet = sheets[0] ?? '';
		} catch (e) {
			parseError = `Gagal membaca file: ${e}`;
		}
		loading = false;
	}

	async function parseSelectedSheet() {
		if (!workbook || !selectedSheet) return;
		loading = true;
		parseError = '';
		try {
			if (importMode === 'enrichment') {
				// For enrichment, just advance to step 2 — server handles parsing
				step = 2;
			} else {
				const { parseSheet } = await import('$lib/utils/xlsx-parser');
				const result = parseSheet(workbook, selectedSheet);
				parsedEmployees = result.employees;
				parseErrors = result.errors;
				step = 2;
			}
		} catch (e) {
			parseError = `Gagal memparse sheet: ${e}`;
		}
		loading = false;
	}

	function reset() {
		step = 1;
		file = null;
		sheets = [];
		selectedSheet = '';
		workbook = null;
		parsedEmployees = [];
		parseErrors = [];
		parseError = '';
	}
</script>

<svelte:head><title>Import XLSX — Admin Kepegawaian</title></svelte:head>

<div class="p-8 max-w-4xl">
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-gray-900">Import Data dari XLSX</h1>
		<p class="text-gray-500 mt-1">Upload file spreadsheet untuk import atau enrichment data pegawai</p>
	</div>

	<!-- Import Mode Selector -->
	{#if step === 1}
		<div class="bg-white rounded-xl border border-gray-200 p-4 mb-6">
			<p class="text-sm font-medium text-gray-700 mb-3">Mode Import</p>
			<div class="flex gap-6">
				<label class="flex items-start gap-3 cursor-pointer">
					<input type="radio" bind:group={importMode} value="standard" class="mt-0.5" />
					<div>
						<p class="text-sm font-medium text-gray-900">Import Standar</p>
						<p class="text-xs text-gray-500">Import data pegawai baru dari spreadsheet KGB</p>
					</div>
				</label>
				<label class="flex items-start gap-3 cursor-pointer">
					<input type="radio" bind:group={importMode} value="enrichment" class="mt-0.5" />
					<div>
						<p class="text-sm font-medium text-gray-900">Enrichment Data</p>
						<p class="text-xs text-gray-500">Isi kolom Jenis Kelamin &amp; Jabatan Perbendaharaan dari spreadsheet Analytics</p>
					</div>
				</label>
			</div>
		</div>
	{/if}

	<!-- Step Indicator -->
	<div class="flex items-center gap-3 mb-8">
		{#each [['1', 'Upload File'], ['2', 'Preview / Konfirmasi'], ['3', 'Hasil']] as [num, label]}
			<div class="flex items-center gap-2">
				<div
					class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
					{step >= parseInt(num) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}"
				>
					{num}
				</div>
				<span class="text-sm {step >= parseInt(num) ? 'text-gray-900 font-medium' : 'text-gray-400'}"
					>{label}</span
				>
			</div>
			{#if num !== '3'}
				<div class="flex-1 h-px bg-gray-200"></div>
			{/if}
		{/each}
	</div>

	<!-- Step 1: Upload -->
	{#if step === 1}
		<div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
			{#if parseError}
				<div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{parseError}</div>
			{/if}

			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">Pilih File XLSX</label>
				<input
					type="file"
					accept=".xlsx,.xls"
					onchange={handleFile}
					class="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
				/>
			</div>

			{#if sheets.length > 0}
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Pilih Sheet</label>
					<select
						bind:value={selectedSheet}
						class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						{#each sheets as sheet}
							<option value={sheet}>{sheet}</option>
						{/each}
					</select>
				</div>

				{#if importMode === 'standard'}
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Jika NIP sudah ada</label>
						<div class="flex gap-4">
							<label class="flex items-center gap-2 text-sm">
								<input type="radio" bind:group={conflictMode} value="overwrite" />
								Timpa data lama
							</label>
							<label class="flex items-center gap-2 text-sm">
								<input type="radio" bind:group={conflictMode} value="skip" />
								Lewati (skip)
							</label>
						</div>
					</div>
				{/if}

				<button
					onclick={parseSelectedSheet}
					disabled={loading}
					class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
				>
					{loading ? 'Memproses...' : 'Preview Data →'}
				</button>
			{/if}

			{#if loading && sheets.length === 0}
				<p class="text-sm text-gray-500">Membaca file...</p>
			{/if}
		</div>
	{/if}

	<!-- Step 2: Preview (Standard) -->
	{#if step === 2 && importMode === 'standard'}
		<div class="space-y-4">
			<div class="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
				<div>
					<p class="font-medium text-gray-900">
						Sheet: <strong>{selectedSheet}</strong> — {parsedEmployees.length} baris siap diimport
					</p>
					{#if parseErrors.length > 0}
						<p class="text-sm text-orange-600 mt-1">{parseErrors.length} baris dilewati karena error</p>
					{/if}
				</div>
				<button onclick={reset} class="text-sm text-gray-500 hover:text-gray-700">← Ganti File</button>
			</div>

			<!-- Preview table -->
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<div class="overflow-x-auto">
					<table class="w-full text-xs">
						<thead>
							<tr class="bg-gray-50 border-b border-gray-200">
								<th class="text-left px-3 py-2 font-semibold text-gray-500">Nama</th>
								<th class="text-left px-3 py-2 font-semibold text-gray-500">NIP/NRP</th>
								<th class="text-left px-3 py-2 font-semibold text-gray-500">Tipe</th>
								<th class="text-left px-3 py-2 font-semibold text-gray-500">Golongan</th>
								<th class="text-left px-3 py-2 font-semibold text-gray-500">KGB Terakhir</th>
								<th class="text-left px-3 py-2 font-semibold text-gray-500">Status</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-100">
							{#each parsedEmployees.slice(0, 20) as emp}
								<tr>
									<td class="px-3 py-2 font-medium text-gray-900">{emp.nama}</td>
									<td class="px-3 py-2 font-mono text-gray-500">{emp.nip_nrp ?? '-'}</td>
									<td class="px-3 py-2 text-gray-600">{emp.employee_type}</td>
									<td class="px-3 py-2 text-gray-600">{emp.golongan ?? '-'}</td>
									<td class="px-3 py-2 text-gray-600">{emp.tanggal_mulai_kgb_terakhir ?? '-'}</td>
									<td class="px-3 py-2 text-gray-500">{emp.kgb_status_category}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				{#if parsedEmployees.length > 20}
					<div class="px-3 py-2 border-t text-xs text-gray-400">
						...dan {parsedEmployees.length - 20} baris lainnya
					</div>
				{/if}
			</div>

			<!-- Confirm form -->
			<form method="POST" action="?/import">
				<input type="hidden" name="filename" value={file?.name ?? ''} />
				<input type="hidden" name="sheet_name" value={selectedSheet} />
				<input type="hidden" name="conflict_mode" value={conflictMode} />
				<input type="hidden" name="employees" value={JSON.stringify(parsedEmployees)} />

				<div class="flex gap-3 mt-4">
					<button
						type="submit"
						class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors"
					>
						Konfirmasi Import {parsedEmployees.length} Pegawai
					</button>
					<button
						type="button"
						onclick={reset}
						class="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm"
					>
						Batal
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Step 2: Enrichment Confirm -->
	{#if step === 2 && importMode === 'enrichment'}
		<div class="space-y-4">
			<div class="bg-white rounded-xl border border-blue-200 p-5">
				<h2 class="font-semibold text-gray-900 mb-2">Konfirmasi Enrichment</h2>
				<p class="text-sm text-gray-600 mb-1">File: <strong>{file?.name}</strong></p>
				<p class="text-sm text-gray-600 mb-4">Sheet: <strong>{selectedSheet}</strong></p>
				<p class="text-sm text-gray-500">
					Akan membaca kolom NIP (kolom 2), Jenis Kelamin (kolom 4), dan Jabatan Perbendaharaan (kolom 10)
					dari sheet tersebut, lalu mengisi field yang kosong pada data pegawai yang cocok berdasarkan NIP/NRP.
				</p>
			</div>

			<form method="POST" action="?/enrich" enctype="multipart/form-data">
				<input type="hidden" name="sheet_name" value={selectedSheet} />
				<input
					type="hidden"
					name="file_content"
					id="file_content_input"
				/>

				<div class="flex gap-3">
					<button
						type="submit"
						onclick={async (e) => {
							e.preventDefault();
							if (!file) return;
							const ab = await file.arrayBuffer();
							const b64 = btoa(String.fromCharCode(...new Uint8Array(ab)));
							const input = document.getElementById('file_content_input') as HTMLInputElement;
							input.value = b64;
							(e.target as HTMLButtonElement).form?.submit();
						}}
						class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors"
					>
						Jalankan Enrichment
					</button>
					<button
						type="button"
						onclick={reset}
						class="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm"
					>
						Batal
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Step 3: Results -->
	{#if form?.success}
		<div class="bg-white rounded-xl border border-green-200 p-6 space-y-4">
			<div class="flex items-center gap-2 text-green-700">
				<span class="text-2xl">✅</span>
				<h2 class="text-lg font-semibold">Import Berhasil</h2>
			</div>
			<div class="grid grid-cols-3 gap-4">
				<div class="text-center p-4 bg-green-50 rounded-lg">
					<p class="text-2xl font-bold text-green-700">{form.rowsImported}</p>
					<p class="text-sm text-green-600">Baris diimport</p>
				</div>
				<div class="text-center p-4 bg-gray-50 rounded-lg">
					<p class="text-2xl font-bold text-gray-700">{form.rowsSkipped}</p>
					<p class="text-sm text-gray-600">Baris dilewati</p>
				</div>
				<div class="text-center p-4 bg-orange-50 rounded-lg">
					<p class="text-2xl font-bold text-orange-700">{form.errors?.length ?? 0}</p>
					<p class="text-sm text-orange-600">Error</p>
				</div>
			</div>

			{#if form.errors && form.errors.length > 0}
				<div>
					<p class="text-sm font-medium text-gray-700 mb-2">Detail error:</p>
					<ul class="space-y-1">
						{#each (form.errors as Array<{row: number; message: string}>) as err}
							<li class="text-xs text-red-600">Baris {err.row}: {err.message}</li>
						{/each}
					</ul>
				</div>
			{/if}

			<div class="flex gap-3">
				<a
					href="/admin/employees"
					class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
				>
					Lihat Daftar Pegawai
				</a>
				<button
					onclick={reset}
					class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg"
				>
					Import Lagi
				</button>
			</div>
		</div>
	{/if}

	{#if form?.enrichSuccess}
		<div class="bg-white rounded-xl border border-green-200 p-6 space-y-4">
			<div class="flex items-center gap-2 text-green-700">
				<span class="text-2xl">✅</span>
				<h2 class="text-lg font-semibold">Enrichment Berhasil</h2>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div class="text-center p-4 bg-green-50 rounded-lg">
					<p class="text-2xl font-bold text-green-700">{form.updated}</p>
					<p class="text-sm text-green-600">Pegawai diperbarui</p>
				</div>
				<div class="text-center p-4 bg-gray-50 rounded-lg">
					<p class="text-2xl font-bold text-gray-700">{form.notFound}</p>
					<p class="text-sm text-gray-600">NIP tidak ditemukan</p>
				</div>
			</div>
			<div class="flex gap-3">
				<a
					href="/analytics"
					class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg"
				>
					Lihat Analytics
				</a>
				<button
					onclick={reset}
					class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg"
				>
					Enrichment Lagi
				</button>
			</div>
		</div>
	{/if}

	{#if form?.error}
		<div class="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
			{form.error}
		</div>
	{/if}
</div>
