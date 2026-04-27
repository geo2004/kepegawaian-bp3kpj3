import type { ParsedEmployee, EmployeeType, LokasiEnum } from '$lib/types/app.types';
import type { JenisKelaminEnum } from '$lib/types/database.types';
import { parseIndonesianDate } from './date';
import { categorizeKgbStatus } from './kgb';

// SheetJS is imported dynamically to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WorkbookType = any;

export interface ParseResult {
	employees: ParsedEmployee[];
	sheetName: string;
	rowsSkipped: number;
	errors: Array<{ row: number; message: string }>;
	format: 'kgb' | 'analytics';
}

export interface EnrichmentRow {
	nip_nrp: string;
	jenis_kelamin: string | null;
	jabatan_perbendaharaan: string | null;
}

// Employee type strings recognised in the analytics Excel (col 3)
const ANALYTICS_TIPE_VALUES = ['PNS', 'CPNS', 'PPPK', 'P3K', 'PPNPN'];

export async function parseXlsxFile(file: File): Promise<{ sheets: string[]; workbook: WorkbookType }> {
	const XLSX = await import('xlsx');
	const buffer = await file.arrayBuffer();
	const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
	return { sheets: workbook.SheetNames, workbook };
}

export function parseSheet(workbook: WorkbookType, sheetName: string): ParseResult {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const ws = workbook.Sheets[sheetName];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const XLSX = (window as any).XLSX_INSTANCE;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });

	const sheetLower = sheetName.toLowerCase();
	const isCpns = sheetLower.includes('cpns');
	const isOutsourcing = sheetLower.includes('outsourc') || sheetLower.includes('ppnpn');

	const employees: ParsedEmployee[] = [];
	const errors: Array<{ row: number; message: string }> = [];
	let rowsSkipped = 0;
	let currentSubUnit = '';

	// Find the data start row (first row where col[0] is a number)
	let dataStartRow = 0;
	for (let i = 0; i < rows.length; i++) {
		const col0 = rows[i][0];
		if (col0 !== null && col0 !== undefined && !isNaN(Number(col0))) {
			dataStartRow = i;
			break;
		}
	}

	// Auto-detect analytics format: col 3 of the first data row is a known type string
	const isAnalytics = !isCpns && !isOutsourcing && detectAnalyticsFormat(rows, dataStartRow);
	const format: ParseResult['format'] = isAnalytics ? 'analytics' : 'kgb';

	for (let i = dataStartRow; i < rows.length; i++) {
		const row = rows[i];
		const col0 = row[0];

		if (col0 === null || col0 === undefined || col0 === '') {
			rowsSkipped++;
			continue;
		}

		// Section header row: col0 is a string (not a number)
		if (isNaN(Number(col0))) {
			currentSubUnit = String(col0).trim();
			continue;
		}

		try {
			let employee: ParsedEmployee;

			if (isAnalytics) {
				employee = parseAnalyticsRow(row);
			} else if (isOutsourcing) {
				employee = parseOutsourcingRow(row, currentSubUnit);
			} else if (isCpns) {
				employee = parseCpnsRow(row, currentSubUnit);
			} else {
				employee = parseAsnRow(row, currentSubUnit);
			}

			if (!employee.nama || employee.nama.trim() === '') {
				rowsSkipped++;
				continue;
			}

			employees.push(employee);
		} catch (e) {
			errors.push({ row: i + 1, message: String(e) });
			rowsSkipped++;
		}
	}

	return { employees, sheetName, rowsSkipped, errors, format };
}

// Parses rows from the analytics Excel format (pegawai-dashboard) to extract
// jenis_kelamin + jabatan_perbendaharaan for one-time data enrichment.
// Expected columns: No(0) | Nama(1) | NIP/NRP(2) | Tipe(3) | Jenis Kelamin(4) |
//                   Golongan(5) | Jabatan(6) | Sub Unit(7) | Lokasi(8) | Telepon(9) | Jabatan Perbendaharaan(10)
//
// Accepts pre-parsed rows (any[][]) — no XLSX dependency, runs safely on server.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseEnrichmentRows(rows: any[][]): EnrichmentRow[] {
	const result: EnrichmentRow[] = [];

	// Find the first row where col[0] is a number (skip header rows)
	let dataStartRow = 0;
	for (let i = 0; i < rows.length; i++) {
		const col0 = rows[i][0];
		if (col0 !== null && col0 !== undefined && !isNaN(Number(col0))) {
			dataStartRow = i;
			break;
		}
	}

	for (let i = dataStartRow; i < rows.length; i++) {
		const row = rows[i];
		const col0 = row[0];
		if (col0 === null || col0 === undefined || isNaN(Number(col0))) continue;

		const nip = row[2] != null ? String(row[2]).trim() : null;
		if (!nip) continue;

		const jk = row[4] != null ? String(row[4]).trim() : null;
		const jabPer = row[10] != null ? String(row[10]).trim() : null;

		result.push({
			nip_nrp: nip,
			jenis_kelamin: jk || null,
			jabatan_perbendaharaan: jabPer || null
		});
	}

	return result;
}

// ── Analytics format helpers ─────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function detectAnalyticsFormat(rows: any[][], dataStartRow: number): boolean {
	// Scan up to 5 data rows to check if col 3 is a known employee type string
	for (let i = dataStartRow; i < Math.min(dataStartRow + 5, rows.length); i++) {
		const row = rows[i];
		if (!row || row[0] === null || isNaN(Number(row[0]))) continue;
		const col3 = row[3] != null ? String(row[3]).trim().toUpperCase() : '';
		if (ANALYTICS_TIPE_VALUES.some((t) => col3 === t || col3.startsWith(t))) return true;
	}
	return false;
}

function mapTipeToEmployeeType(raw: string | null): EmployeeType {
	if (!raw) return 'PNS';
	const upper = raw.trim().toUpperCase();
	if (upper === 'CPNS') return 'CPNS';
	if (upper === 'PPNPN' || upper === 'OUTSOURCING') return 'PPNPN';
	if (upper.includes('PARUH WAKTU') || upper.includes('PARUH_WAKTU')) return 'PPPK_PARUH_WAKTU';
	if (upper === 'PPPK' || upper === 'P3K') return 'PPPK';
	return 'PNS';
}

function mapLokasiToEnum(raw: string | null): LokasiEnum {
	if (!raw) return 'Yogyakarta';
	const s = raw.trim().toLowerCase();
	if (s === 'semarang' || s.includes('rusun') || s.includes('jawa tengah')) return 'Rusun ASN Jawa Tengah';
	if (s.includes('keduanya') || s.includes('yogyakarta & semarang') || s.includes('yogyakarta dan semarang')) return 'Keduanya';
	return 'Yogyakarta';
}

function mapJenisKelamin(raw: string | null): JenisKelaminEnum | null {
	if (!raw) return null;
	const s = raw.trim().toLowerCase().replace(/\s+/g, '');
	if (s === 'lakilaki' || s === 'l' || s === 'laki-laki') return 'Laki-laki';
	if (s === 'perempuan' || s === 'p' || s === 'wanita') return 'Perempuan';
	return null;
}

// Parses the analytics Excel format:
// No(0) | Nama(1) | NIP/NRP(2) | Tipe(3) | Jenis Kelamin(4) |
// Golongan(5) | Jabatan(6) | Sub Unit(7) | Lokasi(8) | Telepon(9) | Jabatan Perbendaharaan(10)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAnalyticsRow(row: any[]): ParsedEmployee {
	const employee_type = mapTipeToEmployeeType(row[3] != null ? String(row[3]) : null);
	const lokasi = mapLokasiToEnum(row[8] != null ? String(row[8]) : null);
	const jenis_kelamin = mapJenisKelamin(row[4] != null ? String(row[4]) : null);

	const notEligible = employee_type === 'CPNS' || employee_type === 'PPNPN';

	return {
		nama: row[1] != null ? String(row[1]).trim() : '',
		nip_nrp: row[2] != null ? String(row[2]).trim() : null,
		employee_type,
		pangkat: null,
		golongan: row[5] != null ? String(row[5]).trim() : null,
		pendidikan: null,
		jabatan: row[6] != null ? String(row[6]).trim() : null,
		jabatan_perbendaharaan: row[10] != null ? String(row[10]).trim() || null : null,
		sub_unit: row[7] != null ? String(row[7]).trim() : null,
		nomor_telepon: row[9] != null ? String(row[9]).trim() : null,
		lokasi_berkantor: lokasi,
		penugasan: null,
		jenis_kelamin,
		tanggal_mulai_kgb_terakhir: null,
		kgb_status_raw: notEligible ? 'Tidak Eligible KGB' : null,
		kgb_status_category: notEligible ? 'tidak_eligible' : 'eligible_pending',
		link_kgb_terakhir: null,
		link_kgb_terbaru: null,
		keterangan: null
	};
}

// ── KGB monitor format parsers ────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAsnRow(row: any[], subUnit: string): ParsedEmployee {
	// 0=No, 1=Nama, 2=NIP/NRP, 3=Pangkat, 4=Golongan, 5=Pendidikan,
	// 6=Jabatan, 7=Nomor Telp, 8=Lokasi Yogya, 9=Lokasi Rusun,
	// 10=Penugasan, 11=Status KGB, 12=Tanggal KGB Terakhir,
	// 13=Link KGB Lama, 14=Link KGB Terbaru, 15=Keterangan

	const lokasiYogya = row[8];
	const lokasiRusun = row[9];
	let lokasi: LokasiEnum = 'Yogyakarta';
	if (lokasiYogya && lokasiRusun) lokasi = 'Keduanya';
	else if (lokasiRusun) lokasi = 'Rusun ASN Jawa Tengah';

	const rawStatus = row[11] ? String(row[11]).trim() : null;
	const empType: EmployeeType = 'PNS';
	const tanggalRaw = row[12] ? String(row[12]).trim() : null;

	return {
		nama: row[1] ? String(row[1]).trim() : '',
		nip_nrp: row[2] ? String(row[2]).trim() : null,
		employee_type: empType,
		pangkat: row[3] ? String(row[3]).trim() : null,
		golongan: row[4] ? String(row[4]).trim() : null,
		pendidikan: row[5] ? String(row[5]).trim() : null,
		jabatan: row[6] ? String(row[6]).trim() : null,
		jabatan_perbendaharaan: null,
		sub_unit: subUnit || null,
		nomor_telepon: row[7] ? String(row[7]).trim() : null,
		lokasi_berkantor: lokasi,
		penugasan: row[10] ? String(row[10]).trim() : null,
		jenis_kelamin: null,
		tanggal_mulai_kgb_terakhir: parseIndonesianDate(tanggalRaw),
		kgb_status_raw: rawStatus,
		kgb_status_category: categorizeKgbStatus(rawStatus, empType),
		link_kgb_terakhir: row[13] ? String(row[13]).trim() : null,
		link_kgb_terbaru: row[14] ? String(row[14]).trim() : null,
		keterangan: row[15] ? String(row[15]).trim() : null
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseCpnsRow(row: any[], subUnit: string): ParsedEmployee {
	return {
		nama: row[1] ? String(row[1]).trim() : '',
		nip_nrp: row[2] ? String(row[2]).trim() : null,
		employee_type: 'CPNS',
		pangkat: row[3] ? String(row[3]).trim() : null,
		golongan: row[4] ? String(row[4]).trim() : null,
		pendidikan: row[5] ? String(row[5]).trim() : null,
		jabatan: row[6] ? String(row[6]).trim() : null,
		jabatan_perbendaharaan: null,
		sub_unit: subUnit || null,
		nomor_telepon: row[7] ? String(row[7]).trim() : null,
		lokasi_berkantor: 'Yogyakarta',
		penugasan: row[9] ? String(row[9]).trim() : null,
		jenis_kelamin: null,
		tanggal_mulai_kgb_terakhir: null,
		kgb_status_raw: null,
		kgb_status_category: 'tidak_eligible',
		link_kgb_terakhir: null,
		link_kgb_terbaru: null,
		keterangan: row[10] ? String(row[10]).trim() : null
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseOutsourcingRow(row: any[], subUnit: string): ParsedEmployee {
	return {
		nama: row[1] ? String(row[1]).trim() : '',
		nip_nrp: row[2] ? String(row[2]).trim() : null,
		employee_type: 'PPNPN',
		pangkat: null,
		golongan: '-',
		pendidikan: null,
		jabatan: row[3] ? String(row[3]).trim() : null,
		jabatan_perbendaharaan: null,
		sub_unit: subUnit || 'Outsourcing',
		nomor_telepon: row[4] ? String(row[4]).trim() : null,
		lokasi_berkantor: 'Yogyakarta',
		penugasan: row[5] ? String(row[5]).trim() : null,
		jenis_kelamin: null,
		tanggal_mulai_kgb_terakhir: null,
		kgb_status_raw: 'PPNPN Tidak Eligible KGB',
		kgb_status_category: 'tidak_eligible',
		link_kgb_terakhir: null,
		link_kgb_terbaru: null,
		keterangan: row[6] ? String(row[6]).trim() : null
	};
}
