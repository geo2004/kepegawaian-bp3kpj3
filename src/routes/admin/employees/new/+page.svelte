<script lang="ts">
	import type { ActionData } from './$types';
	import EmployeeForm from '$lib/components/EmployeeForm.svelte';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head><title>Tambah Pegawai — Admin Kepegawaian</title></svelte:head>

<div class="p-8 max-w-3xl">
	<div class="mb-6">
		<a href="/admin/employees" class="text-sm text-blue-600 hover:underline">← Daftar Pegawai</a>
		<h1 class="text-2xl font-bold text-gray-900 mt-2">Tambah Pegawai Baru</h1>
	</div>

	<form method="POST">
		<EmployeeForm error={form?.error} />
		<div class="mt-6 flex gap-3">
			<button
				type="submit"
				class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors"
			>
				Simpan Pegawai
			</button>
			<a
				href="/admin/employees"
				class="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition-colors"
			>
				Batal
			</a>
		</div>
	</form>
</div>
