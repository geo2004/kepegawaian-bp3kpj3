import type { PageServerLoad } from './$types';
import { getEmployees, getImportLogs } from '$lib/server/db';
import type { EmployeeType } from '$lib/types/app.types';

export const load: PageServerLoad = async ({ url }) => {
	const yearParam = parseInt(url.searchParams.get('year') ?? '');
	const selectedYear = isNaN(yearParam) ? new Date().getFullYear() : Math.min(2030, Math.max(2026, yearParam));

	const all = getEmployees({ activeOnly: true });

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const currentYear = today.getFullYear();

	const in60Days = new Date(today);
	in60Days.setDate(in60Days.getDate() + 60);

	const stats = {
		total: all.length,
		eligibleTahunIni: all.filter((e) =>
			(
				(e.tanggal_mulai_kgb_terakhir?.startsWith(`${selectedYear}-`) ?? false) ||
				(e.tanggal_kgb_berikutnya?.startsWith(`${selectedYear}-`) ?? false)
			) &&
			e.kgb_status_category !== 'tidak_eligible' &&
			e.kgb_status_category !== 'maksimum'
		).length,
		dalam60Hari: selectedYear !== currentYear ? null : all.filter((e) => {
			if (!e.tanggal_kgb_berikutnya) return false;
			const d = new Date(e.tanggal_kgb_berikutnya + 'T00:00:00');
			return d >= today && d <= in60Days;
		}).length,
		sudahDiproses: all.filter((e) =>
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
		belumProses: all.filter((e) =>
			(e.tanggal_kgb_berikutnya?.startsWith(`${selectedYear}-`) ?? false) &&
			e.kgb_status_category === 'eligible_pending'
		).length,
		selectedYear,
		byType: (['PNS', 'PPPK', 'CPNS', 'PPNPN', 'PPPK_PARUH_WAKTU'] as EmployeeType[]).reduce(
			(acc, type) => ({ ...acc, [type]: all.filter((e) => e.employee_type === type).length }),
			{} as Record<EmployeeType, number>
		)
	};

	const recentLogs = getImportLogs(5);
	return { stats, recentLogs };
};
