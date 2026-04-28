import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getEmployees, softDeleteEmployee } from '$lib/server/db';
import type { Employee } from '$lib/types/app.types';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('search') ?? '';
	const lokasi = url.searchParams.get('lokasi') ?? '';
	const tipe = url.searchParams.get('tipe') ?? '';

	const employees: Employee[] = (await getEmployees({ search, lokasi, activeOnly: true }))
		.filter((e) => !tipe || e.employee_type === tipe)
		.sort((a, b) => a.nama.localeCompare(b.nama, 'id'));

	return { employees, filters: { search, lokasi, tipe } };
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const form = await request.formData();
		const id = form.get('id') as string;
		if (!id) return fail(400, { error: 'ID tidak valid.' });

		const ok = await softDeleteEmployee(id);
		if (!ok) return fail(404, { error: 'Pegawai tidak ditemukan.' });
		return { success: true };
	}
};
