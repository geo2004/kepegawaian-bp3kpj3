export type EmployeeType = 'PNS' | 'PPPK' | 'PPPK_PARUH_WAKTU' | 'CPNS' | 'PPNPN';
export type LokasiEnum = 'Yogyakarta' | 'Rusun ASN Jawa Tengah' | 'Keduanya';
export type JenisKelaminEnum = 'Laki-laki' | 'Perempuan';
export type KgbStatusCategory =
	| 'eligible_pending'
	| 'diusulkan'
	| 'sudah_diproses'
	| 'tidak_eligible'
	| 'maksimum';

export interface EmployeeRow {
	id: string;
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
	tanggal_kgb_berikutnya: string | null;
	kgb_status_raw: string | null;
	kgb_status_category: KgbStatusCategory;
	link_kgb_terakhir: string | null;
	link_kgb_terbaru: string | null;
	keterangan: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
	created_by: string | null;
	updated_by: string | null;
}

export type EmployeeInsert = Omit<
	EmployeeRow,
	'id' | 'tanggal_kgb_berikutnya' | 'created_at' | 'updated_at'
>;
export type EmployeeUpdate = Partial<EmployeeInsert>;

export interface KgbHistoryRow {
	id: string;
	employee_id: string;
	tanggal_mulai: string;
	tanggal_kgb: string;
	golongan_sebelum: string | null;
	golongan_sesudah: string | null;
	status: KgbStatusCategory;
	catatan: string | null;
	link_sk: string | null;
	tanggal_diproses: string | null;
	created_at: string;
	created_by: string | null;
}

export type KgbHistoryInsert = Omit<KgbHistoryRow, 'id' | 'created_at'>;

export interface ImportLogRow {
	id: string;
	filename: string;
	sheet_name: string;
	rows_imported: number;
	rows_skipped: number;
	rows_updated: number;
	errors: Record<string, unknown>[] | null;
	imported_by: string | null;
	imported_at: string;
}

export type ImportLogInsert = Omit<ImportLogRow, 'id' | 'imported_at'>;
