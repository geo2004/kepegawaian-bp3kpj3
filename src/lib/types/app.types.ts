import type {
	EmployeeRow,
	EmployeeInsert,
	KgbHistoryRow,
	ImportLogRow,
	KgbStatusCategory,
	LokasiEnum,
	EmployeeType,
	JenisKelaminEnum
} from './database.types';

export type Employee = EmployeeRow;
export type EmployeeInsertType = EmployeeInsert;
export type KgbHistory = KgbHistoryRow;
export type ImportLog = ImportLogRow;

export type { KgbStatusCategory, LokasiEnum, EmployeeType, JenisKelaminEnum };

export interface KgbStatusDisplay {
	label: string;
	color: 'red' | 'orange' | 'blue' | 'green' | 'gray';
	bgClass: string;
	textClass: string;
	dotClass: string;
}

export interface DashboardStats {
	total: number;
	eligibleTahunIni: number;
	dalam60Hari: number | null;
	sudahDiproses: number;
	belumProses: number;
	selectedYear: number;
}

export interface AnalyticsStats {
	total: number;
	byTipe: Record<string, number>;
	byGender: Record<string, number>;
	byLokasi: Record<string, number>;
	byGolongan: Record<string, number>;
	bySubUnit: Record<string, number>;
	jabatanPerbendaharaanCount: number;
}

export interface ParsedEmployee {
	nama: string;
	nip_nrp: string | null;
	employee_type: EmployeeType;
	pangkat: string | null;
	golongan: string | null;
	pendidikan: string | null;
	jabatan: string | null;
	jabatan_perbendaharaan: string | null;
	sub_unit: string | null;
	nomor_telepon: string | null;
	lokasi_berkantor: LokasiEnum;
	penugasan: string | null;
	jenis_kelamin: JenisKelaminEnum | null;
	tanggal_mulai_kgb_terakhir: string | null;
	kgb_status_raw: string | null;
	kgb_status_category: KgbStatusCategory;
	link_kgb_terakhir: string | null;
	link_kgb_terbaru: string | null;
	keterangan: string | null;
}
