import type { EmployeeRow } from '$lib/types/database.types';
import type { AnalyticsStats } from '$lib/types/app.types';

// Display alias for lokasi — canonical stored value → chart/UI label
export const LOKASI_DISPLAY: Record<string, string> = {
	'Yogyakarta': 'Yogyakarta',
	'Rusun ASN Jawa Tengah': 'Semarang',
	'Keduanya': 'Yogyakarta & Semarang'
};

// Display labels for employee type enum values
export const TIPE_DISPLAY: Record<string, string> = {
	PNS: 'PNS',
	PPPK: 'PPPK',
	PPPK_PARUH_WAKTU: 'PPPK Paruh Waktu',
	CPNS: 'CPNS',
	PPNPN: 'PPNPN'
};

export function computeStats(employees: EmployeeRow[]): AnalyticsStats {
	const byTipe: Record<string, number> = {};
	const byGender: Record<string, number> = {};
	const byLokasi: Record<string, number> = {};
	const byGolongan: Record<string, number> = {};
	const bySubUnit: Record<string, number> = {};
	let jabatanPerbendaharaanCount = 0;

	for (const emp of employees) {
		const tipeLabel = TIPE_DISPLAY[emp.employee_type] ?? emp.employee_type;
		byTipe[tipeLabel] = (byTipe[tipeLabel] || 0) + 1;

		const genderLabel = emp.jenis_kelamin ?? 'Tidak Diketahui';
		byGender[genderLabel] = (byGender[genderLabel] || 0) + 1;

		const lokasiLabel = LOKASI_DISPLAY[emp.lokasi_berkantor] ?? emp.lokasi_berkantor;
		byLokasi[lokasiLabel] = (byLokasi[lokasiLabel] || 0) + 1;

		const golongan = emp.golongan ?? '-';
		byGolongan[golongan] = (byGolongan[golongan] || 0) + 1;

		const subUnit = emp.sub_unit ?? '-';
		bySubUnit[subUnit] = (bySubUnit[subUnit] || 0) + 1;

		if (emp.jabatan_perbendaharaan) jabatanPerbendaharaanCount++;
	}

	return {
		total: employees.length,
		byTipe,
		byGender,
		byLokasi,
		byGolongan,
		bySubUnit,
		jabatanPerbendaharaanCount
	};
}

export function getAgeFromNip(nip: string | null): number | null {
	if (!nip || nip.length < 8) return null;
	const year = parseInt(nip.slice(0, 4));
	const month = parseInt(nip.slice(4, 6));
	const day = parseInt(nip.slice(6, 8));
	if (year < 1950 || year > 2010 || month < 1 || month > 12 || day < 1 || day > 31) return null;
	const today = new Date();
	let age = today.getFullYear() - year;
	if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age--;
	return age;
}

export function getAppointmentYear(nip: string | null): number | null {
	if (!nip || nip.length < 12) return null;
	const yr = parseInt(nip.slice(8, 12));
	return yr >= 1980 && yr <= 2030 ? yr : null;
}

export function kategorisasiJabatan(jabatan: string): 'struktural' | 'fungsional_tertentu' | 'fungsional_umum' {
	const j = jabatan.toLowerCase();
	if (j.includes('kepala')) return 'struktural';
	if (/ahli pertama|ahli muda|ahli madya/.test(j)) return 'fungsional_tertentu';
	return 'fungsional_umum';
}

export function namaJabatanTertentu(jabatan: string): string {
	return jabatan
		.replace(/\s+ahli\s+(pertama|muda|madya)\s*$/i, '')
		.replace(/\bDan\b/g, 'dan')
		.trim();
}

export function shortenSubUnit(k: string): string {
	const map: Record<string, string> = {
		'KEPALA BALAI PELAKSANA PENYEDIAAN PERUMAHAN DAN KAWASAN PERMUKIMAN JAWA III': 'Kepala Balai',
		'SUB BAGIAN UMUM DAN TATA USAHA': 'Sub Bag Umum & TU',
		'SEKSI PELAKSANAAN WILAYAH I': 'Seksi Wil. I',
		'SEKSI PELAKSANAAN WILAYAH II': 'Seksi Wil. II',
		'KELOMPOK JAFUNG': 'Kelompok Jafung'
	};
	if (map[k]) return map[k];
	return k
		.replace('PPK PERENCANAAN DAN PENGENDALIAN SATKER PKP PROV. ', 'PPK Perenc. ')
		.replace('PPK PERENCANAAN DAN PENGENDALIAN SATKER  PKP PROV. ', 'PPK Perenc. ')
		.replace('PPK RUMAH SWADAYA, PSU DAN KAWASAN PERMUKIMAN SATKER PKP PROVINSI ', 'PPK RS-PSU-KP ')
		.replace('PPK RUMAH SWADAYA, PSU DAN KAWASAN PERMUKIMAN SATKER PKP PROV. ', 'PPK RS-PSU-KP ')
		.replace('PPK  RUMAH SUSUN DAN RUMAH KHUSUS SATKER PKP  PROVINSI ', 'PPK Rusun-Rusus ')
		.replace('PPK  RUMAH SUSUN DAN RUMAH KHUSUS SATKER PKP PROVINSI ', 'PPK Rusun-Rusus ');
}
