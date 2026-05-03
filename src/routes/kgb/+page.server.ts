import type { PageServerLoad } from './$types';
import type { DashboardStats } from '$lib/types/app.types';
import { getEmployees } from '$lib/server/db';
import { listDocumentIds } from '$lib/server/documents';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('search') ?? '';
	const lokasi = url.searchParams.get('lokasi') ?? '';
	const golongan = url.searchParams.get('golongan') ?? '';
	const status = url.searchParams.get('status') ?? '';
	const card = url.searchParams.get('card') ?? '';

	const yearParam = parseInt(url.searchParams.get('year') ?? '');
	const selectedYear = isNaN(yearParam) ? new Date().getFullYear() : Math.min(2030, Math.max(2026, yearParam));

	const [employees, docIds] = await Promise.all([
		getEmployees({ search, lokasi, golongan, status, activeOnly: true, kgbEligibleOnly: true }),
		listDocumentIds()
	]);

	const BOTTOM_STATUSES = ['maksimum', 'tidak_eligible'];

	employees.sort((a, b) => {
		const aBottom = BOTTOM_STATUSES.includes(a.kgb_status_category);
		const bBottom = BOTTOM_STATUSES.includes(b.kgb_status_category);
		if (aBottom !== bBottom) return aBottom ? 1 : -1;
		if (!a.tanggal_kgb_berikutnya) return 1;
		if (!b.tanggal_kgb_berikutnya) return -1;
		return a.tanggal_kgb_berikutnya.localeCompare(b.tanggal_kgb_berikutnya);
	});

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const currentYear = today.getFullYear();

	const in60Days = new Date(today);
	in60Days.setDate(in60Days.getDate() + 60);

	const stats: DashboardStats = {
		total: employees.length,
		eligibleTahunIni: employees.filter((e) =>
			(
				(e.tanggal_mulai_kgb_terakhir?.startsWith(`${selectedYear}-`) ?? false) ||
				(e.tanggal_kgb_berikutnya?.startsWith(`${selectedYear}-`) ?? false)
			) &&
			e.kgb_status_category !== 'tidak_eligible' &&
			e.kgb_status_category !== 'maksimum'
		).length,
		dalam60Hari: selectedYear !== currentYear ? null : employees.filter((e) => {
			if (!e.tanggal_kgb_berikutnya) return false;
			const d = new Date(e.tanggal_kgb_berikutnya + 'T00:00:00');
			return d >= today && d <= in60Days;
		}).length,
		sudahDiproses: employees.filter((e) =>
			e.kgb_status_category !== 'tidak_eligible' &&
			e.kgb_status_category !== 'maksimum' &&
			(
				(e.tanggal_mulai_kgb_terakhir?.startsWith(`${selectedYear}-`) ?? false) ||
				(
					(e.tanggal_kgb_berikutnya?.startsWith(`${selectedYear}-`) ?? false) &&
					(e.kgb_status_category === 'sudah_diproses' || e.kgb_status_category === 'diusulkan')
				)
			)
		).length,
		belumProses: employees.filter((e) =>
			(e.tanggal_kgb_berikutnya?.startsWith(`${selectedYear}-`) ?? false) &&
			e.kgb_status_category === 'eligible_pending'
		).length,
		selectedYear
	};

	let filtered = employees;
	if (card === 'eligible') {
		filtered = employees.filter((e) =>
			(
				(e.tanggal_mulai_kgb_terakhir?.startsWith(`${selectedYear}-`) ?? false) ||
				(e.tanggal_kgb_berikutnya?.startsWith(`${selectedYear}-`) ?? false)
			) &&
			e.kgb_status_category !== 'tidak_eligible' &&
			e.kgb_status_category !== 'maksimum'
		);
	} else if (card === 'dalam60hari' && selectedYear === currentYear) {
		filtered = employees.filter((e) => {
			if (!e.tanggal_kgb_berikutnya) return false;
			const d = new Date(e.tanggal_kgb_berikutnya + 'T00:00:00');
			return d >= today && d <= in60Days;
		});
	} else if (card === 'sudah') {
		filtered = employees.filter((e) =>
			e.kgb_status_category !== 'tidak_eligible' &&
			e.kgb_status_category !== 'maksimum' &&
			(
				(e.tanggal_mulai_kgb_terakhir?.startsWith(`${selectedYear}-`) ?? false) ||
				(
					(e.tanggal_kgb_berikutnya?.startsWith(`${selectedYear}-`) ?? false) &&
					(e.kgb_status_category === 'sudah_diproses' || e.kgb_status_category === 'diusulkan')
				)
			)
		);
	} else if (card === 'belum') {
		filtered = employees.filter((e) =>
			(e.tanggal_kgb_berikutnya?.startsWith(`${selectedYear}-`) ?? false) &&
			e.kgb_status_category === 'eligible_pending'
		);
	}

	return { employees: filtered, docIds: [...docIds], stats, filters: { search, lokasi, golongan, status, year: selectedYear, card } };
};
