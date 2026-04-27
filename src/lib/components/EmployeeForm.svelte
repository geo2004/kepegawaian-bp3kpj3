<script lang="ts">
	import type { Employee } from '$lib/types/app.types';
	import { GOLONGAN_OPTIONS } from '$lib/utils/kgb';

	let {
		employee = null,
		error = null
	}: {
		employee?: Employee | null;
		error?: string | null;
	} = $props();
</script>

<div class="space-y-6">
	{#if error}
		<div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
	{/if}

	<!-- Identity -->
	<fieldset class="bg-white rounded-xl border border-gray-200 p-6">
		<legend class="text-sm font-semibold text-gray-700 px-1 mb-4">Identitas Pegawai</legend>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div class="md:col-span-2">
				<label class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap <span class="text-red-500">*</span></label>
				<input
					name="nama"
					type="text"
					required
					value={employee?.nama ?? ''}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">NIP / NRP</label>
				<input
					name="nip_nrp"
					type="text"
					value={employee?.nip_nrp ?? ''}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
				<select
					name="jenis_kelamin"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="">— Pilih —</option>
					{#each ['Laki-laki', 'Perempuan'] as jk}
						<option value={jk} selected={employee?.jenis_kelamin === jk}>{jk}</option>
					{/each}
				</select>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
				<input
					name="nomor_telepon"
					type="text"
					value={employee?.nomor_telepon ?? ''}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>
	</fieldset>

	<!-- Classification -->
	<fieldset class="bg-white rounded-xl border border-gray-200 p-6">
		<legend class="text-sm font-semibold text-gray-700 px-1 mb-4">Kepangkatan & Jabatan</legend>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Tipe Pegawai</label>
				<select
					name="employee_type"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					{#each ['PNS', 'PPPK', 'PPPK_PARUH_WAKTU', 'CPNS', 'PPNPN'] as type}
						<option value={type} selected={employee?.employee_type === type}>{type.replace('_', ' ')}</option>
					{/each}
				</select>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Golongan / Ruang</label>
				<select
					name="golongan"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="">— Pilih —</option>
					{#each GOLONGAN_OPTIONS as g}
						<option value={g} selected={employee?.golongan === g}>{g}</option>
					{/each}
				</select>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Pangkat</label>
				<input
					name="pangkat"
					type="text"
					value={employee?.pangkat ?? ''}
					placeholder="Penata TK I"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Pendidikan</label>
				<input
					name="pendidikan"
					type="text"
					value={employee?.pendidikan ?? ''}
					placeholder="S2, Teknik Sipil"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div class="md:col-span-2">
				<label class="block text-sm font-medium text-gray-700 mb-1">Jabatan</label>
				<input
					name="jabatan"
					type="text"
					value={employee?.jabatan ?? ''}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div class="md:col-span-2">
				<label class="block text-sm font-medium text-gray-700 mb-1">Jabatan Perbendaharaan</label>
				<input
					name="jabatan_perbendaharaan"
					type="text"
					value={employee?.jabatan_perbendaharaan ?? ''}
					placeholder="Misal: Bendahara Pengeluaran, PPK, dll."
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Sub Unit / Seksi</label>
				<input
					name="sub_unit"
					type="text"
					value={employee?.sub_unit ?? ''}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Lokasi Berkantor</label>
				<select
					name="lokasi_berkantor"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					{#each ['Yogyakarta', 'Rusun ASN Jawa Tengah', 'Keduanya'] as loc}
						<option value={loc} selected={employee?.lokasi_berkantor === loc}>{loc}</option>
					{/each}
				</select>
			</div>
			<div class="md:col-span-2">
				<label class="block text-sm font-medium text-gray-700 mb-1">Penugasan</label>
				<textarea
					name="penugasan"
					rows="2"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>{employee?.penugasan ?? ''}</textarea>
			</div>
		</div>
	</fieldset>

	<!-- KGB -->
	<fieldset class="bg-white rounded-xl border border-gray-200 p-6">
		<legend class="text-sm font-semibold text-gray-700 px-1 mb-4">Data KGB</legend>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai KGB Terakhir</label>
				<input
					name="tanggal_mulai_kgb_terakhir"
					type="date"
					value={employee?.tanggal_mulai_kgb_terakhir ?? ''}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				{#if employee?.tanggal_kgb_berikutnya}
					<p class="text-xs text-gray-400 mt-1">
						KGB berikutnya: <strong>{employee.tanggal_kgb_berikutnya}</strong> (otomatis +2 tahun)
					</p>
				{/if}
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Kategori Status KGB</label>
				<select
					name="kgb_status_category"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					{#each [
						['eligible_pending', 'Belum Diproses'],
						['diusulkan', 'Sudah Diusulkan'],
						['sudah_diproses', 'Sudah Diproses'],
						['tidak_eligible', 'Tidak Eligible'],
						['maksimum', 'Maksimum KGB']
					] as [val, label]}
						<option value={val} selected={employee?.kgb_status_category === val}>{label}</option>
					{/each}
				</select>
			</div>
			<div class="md:col-span-2">
				<label class="block text-sm font-medium text-gray-700 mb-1">Catatan Status KGB</label>
				<input
					name="kgb_status_raw"
					type="text"
					value={employee?.kgb_status_raw ?? ''}
					placeholder="Contoh: Diusulkan Januari 2027"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Link SK KGB Terakhir</label>
				<input
					name="link_kgb_terakhir"
					type="url"
					value={employee?.link_kgb_terakhir ?? ''}
					placeholder="https://drive.google.com/..."
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Link SK KGB Terbaru</label>
				<input
					name="link_kgb_terbaru"
					type="url"
					value={employee?.link_kgb_terbaru ?? ''}
					placeholder="https://drive.google.com/..."
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div class="md:col-span-2">
				<label class="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
				<textarea
					name="keterangan"
					rows="2"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>{employee?.keterangan ?? ''}</textarea>
			</div>
		</div>
	</fieldset>
</div>
