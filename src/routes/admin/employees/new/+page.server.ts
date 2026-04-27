import { redirect, fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { createEmployee } from '$lib/server/db';
import type { EmployeeInsert } from '$lib/types/database.types';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();

		const nama = (form.get('nama') as string)?.trim();
		if (!nama) return fail(400, { error: 'Nama harus diisi.' });

		const tanggal = (form.get('tanggal_mulai_kgb_terakhir') as string) || null;
		const jenisKelamin = (form.get('jenis_kelamin') as string)?.trim() || null;

		const data: EmployeeInsert = {
			nama,
			nip_nrp: (form.get('nip_nrp') as string)?.trim() || null,
			employee_type: (form.get('employee_type') as string) as EmployeeInsert['employee_type'],
			pangkat: (form.get('pangkat') as string)?.trim() || null,
			golongan: (form.get('golongan') as string)?.trim() || null,
			pendidikan: (form.get('pendidikan') as string)?.trim() || null,
			jabatan: (form.get('jabatan') as string)?.trim() || null,
			jabatan_perbendaharaan: (form.get('jabatan_perbendaharaan') as string)?.trim() || null,
			sub_unit: (form.get('sub_unit') as string)?.trim() || null,
			nomor_telepon: (form.get('nomor_telepon') as string)?.trim() || null,
			lokasi_berkantor: (form.get('lokasi_berkantor') as string) as EmployeeInsert['lokasi_berkantor'],
			penugasan: (form.get('penugasan') as string)?.trim() || null,
			jenis_kelamin: (jenisKelamin === 'Laki-laki' || jenisKelamin === 'Perempuan') ? jenisKelamin : null,
			tanggal_mulai_kgb_terakhir: tanggal,
			kgb_status_category: (form.get('kgb_status_category') as string) as EmployeeInsert['kgb_status_category'],
			kgb_status_raw: (form.get('kgb_status_raw') as string)?.trim() || null,
			link_kgb_terakhir: (form.get('link_kgb_terakhir') as string)?.trim() || null,
			link_kgb_terbaru: (form.get('link_kgb_terbaru') as string)?.trim() || null,
			keterangan: (form.get('keterangan') as string)?.trim() || null,
			is_active: true,
			created_by: locals.user?.nip ?? null,
			updated_by: null
		};

		try {
			createEmployee(data);
		} catch (e) {
			return fail(500, { error: `Gagal menyimpan: ${e}` });
		}

		throw redirect(303, '/admin/employees');
	}
};
