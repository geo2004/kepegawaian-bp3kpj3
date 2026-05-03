import { redirect, fail, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getEmployeeById, updateEmployee, getKgbHistory, createKgbHistory } from '$lib/server/db';
import { saveDocument, deleteDocument, hasDocument } from '$lib/server/documents';
import type { EmployeeInsert } from '$lib/types/database.types';

export const load: PageServerLoad = async ({ params }) => {
	const [employee, history, hasDoc] = await Promise.all([
		getEmployeeById(params.id),
		getKgbHistory(params.id),
		hasDocument(params.id)
	]);
	if (!employee) throw error(404, 'Pegawai tidak ditemukan.');
	return { employee, history, hasDoc };
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		const form = await request.formData();

		const nama = (form.get('nama') as string)?.trim();
		if (!nama) return fail(400, { error: 'Nama harus diisi.' });

		const tanggal = (form.get('tanggal_mulai_kgb_terakhir') as string) || null;
		const jenisKelamin = (form.get('jenis_kelamin') as string)?.trim() || null;

		const data: Partial<EmployeeInsert> = {
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
			updated_by: locals.user?.nip ?? null
		};

		const updated = await updateEmployee(params.id, data);
		if (!updated) return fail(404, { error: 'Pegawai tidak ditemukan.' });

		throw redirect(303, `/admin/employees/${params.id}`);
	},

	proses: async ({ params, locals }) => {
		const emp = await getEmployeeById(params.id);
		if (!emp) return fail(404, { error: 'Pegawai tidak ditemukan.' });
		if (!emp.tanggal_kgb_berikutnya) return fail(400, { error: 'Tanggal KGB belum diset.' });

		await createKgbHistory({
			employee_id: params.id,
			tanggal_mulai: emp.tanggal_mulai_kgb_terakhir!,
			tanggal_kgb: emp.tanggal_kgb_berikutnya,
			golongan_sebelum: emp.golongan,
			golongan_sesudah: null,
			status: 'sudah_diproses',
			catatan: null,
			link_sk: emp.link_kgb_terbaru,
			tanggal_diproses: new Date().toISOString().split('T')[0],
			created_by: locals.user?.nip ?? null
		});

		await updateEmployee(params.id, {
			tanggal_mulai_kgb_terakhir: emp.tanggal_kgb_berikutnya,
			kgb_status_category: 'sudah_diproses',
			kgb_status_raw: `Sudah diproses — KGB ${emp.tanggal_kgb_berikutnya}`,
			updated_by: locals.user?.nip ?? null
		});

		return { success: true };
	},

	uploaddoc: async ({ request, params }) => {
		const form = await request.formData();
		const file = form.get('document') as File | null;

		if (!file || file.size === 0) return fail(400, { error: 'Pilih file PDF terlebih dahulu.' });
		if (file.type !== 'application/pdf') return fail(400, { error: 'File harus berformat PDF.' });
		if (file.size > 10 * 1024 * 1024) return fail(400, { error: 'Ukuran file maksimal 10 MB.' });

		const buffer = Buffer.from(await file.arrayBuffer());
		await saveDocument(params.id, buffer);

		return { uploadSuccess: true };
	},

	deletedoc: async ({ params }) => {
		await deleteDocument(params.id);
		return { deleteSuccess: true };
	}
};
