import type { Employee, KgbStatusCategory, KgbStatusDisplay, EmployeeType } from '$lib/types/app.types';
import { getDaysUntil } from './date';

export function categorizeKgbStatus(
	rawStatus: string | null | undefined,
	empType: EmployeeType
): KgbStatusCategory {
	if (empType === 'CPNS' || empType === 'PPNPN' || empType === 'PPPK_PARUH_WAKTU') {
		return 'tidak_eligible';
	}
	if (!rawStatus) return 'eligible_pending';
	const s = rawStatus.toLowerCase();
	if (s.includes('maksimum')) return 'maksimum';
	if (s.includes('tidak eligible') || s.includes('tidak eligible')) return 'tidak_eligible';
	if (s.startsWith('sudah diusulkan') || s.includes('sudah diproses')) return 'sudah_diproses';
	if (s.startsWith('diusulkan')) return 'diusulkan';
	return 'eligible_pending';
}

export function getKgbStatusDisplay(employee: Employee): KgbStatusDisplay {
	const { kgb_status_category, tanggal_kgb_berikutnya } = employee;

	if (kgb_status_category === 'tidak_eligible' || kgb_status_category === 'maksimum') {
		return {
			label: kgb_status_category === 'maksimum' ? 'Maks. KGB' : 'Tidak Eligible',
			color: 'gray',
			bgClass: 'bg-gray-100',
			textClass: 'text-gray-600',
			dotClass: 'bg-gray-400'
		};
	}

	if (kgb_status_category === 'diusulkan') {
		return {
			label: 'Sudah Diusulkan',
			color: 'blue',
			bgClass: 'bg-blue-100',
			textClass: 'text-blue-700',
			dotClass: 'bg-blue-500'
		};
	}

	if (kgb_status_category === 'sudah_diproses') {
		return {
			label: 'Sudah Diproses',
			color: 'green',
			bgClass: 'bg-green-100',
			textClass: 'text-green-700',
			dotClass: 'bg-green-500'
		};
	}

	// eligible_pending — check date
	const daysUntil = getDaysUntil(tanggal_kgb_berikutnya);

	if (daysUntil !== null && daysUntil < 0) {
		return {
			label: 'Lewat Jatuh Tempo',
			color: 'red',
			bgClass: 'bg-red-100',
			textClass: 'text-red-700',
			dotClass: 'bg-red-500'
		};
	}

	if (daysUntil !== null && daysUntil <= 30) {
		return {
			label: 'Segera Jatuh Tempo',
			color: 'orange',
			bgClass: 'bg-orange-100',
			textClass: 'text-orange-700',
			dotClass: 'bg-orange-500'
		};
	}

	return {
		label: 'On Track',
		color: 'green',
		bgClass: 'bg-green-100',
		textClass: 'text-green-700',
		dotClass: 'bg-green-500'
	};
}

export const GOLONGAN_OPTIONS = [
	'I/a', 'I/b', 'I/c', 'I/d',
	'II/a', 'II/b', 'II/c', 'II/d',
	'III/a', 'III/b', 'III/c', 'III/d',
	'IV/a', 'IV/b', 'IV/c', 'IV/d', 'IV/e',
	'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII',
	'-'
];

export const SUB_UNIT_OPTIONS = [
	'Bagian Tata Usaha',
	'Bidang Permukiman',
	'Bidang Perumahan',
	'Bidang Kawasan Permukiman',
	'PPNPN / Non ASN'
];
