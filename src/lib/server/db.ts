import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type {
	EmployeeRow,
	EmployeeInsert,
	KgbHistoryRow,
	KgbHistoryInsert,
	ImportLogRow,
	ImportLogInsert
} from '$lib/types/database.types';

const DB_PATH = join(process.cwd(), 'data', 'kgb-data.json');

interface Store {
	employees: EmployeeRow[];
	kgb_history: KgbHistoryRow[];
	import_logs: ImportLogRow[];
}

function read(): Store {
	try {
		return JSON.parse(readFileSync(DB_PATH, 'utf-8')) as Store;
	} catch {
		return { employees: [], kgb_history: [], import_logs: [] };
	}
}

function write(store: Store): void {
	writeFileSync(DB_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

function now(): string {
	return new Date().toISOString();
}

// ── Employees ────────────────────────────────────────────────────────────────

const KGB_ELIGIBLE_TYPES = ['PNS', 'PPPK', 'PPPK_PARUH_WAKTU'] as const;

export function getEmployees(opts?: {
	search?: string;
	lokasi?: string;
	golongan?: string;
	status?: string;
	activeOnly?: boolean;
	kgbEligibleOnly?: boolean;
}): EmployeeRow[] {
	const store = read();
	let rows = store.employees;

	if (opts?.activeOnly !== false) rows = rows.filter((e) => e.is_active);
	rows = rows.filter((e) => e.employee_type !== 'PPNPN');
	if (opts?.kgbEligibleOnly) rows = rows.filter((e) => (KGB_ELIGIBLE_TYPES as readonly string[]).includes(e.employee_type));
	if (opts?.search) {
		const s = opts.search.toLowerCase();
		rows = rows.filter(
			(e) => e.nama.toLowerCase().includes(s) || (e.nip_nrp ?? '').toLowerCase().includes(s)
		);
	}
	if (opts?.lokasi) rows = rows.filter((e) => e.lokasi_berkantor === opts.lokasi);
	if (opts?.golongan) rows = rows.filter((e) => e.golongan === opts.golongan);
	if (opts?.status) rows = rows.filter((e) => e.kgb_status_category === opts.status);

	return rows;
}

export function getEmployeeById(id: string): EmployeeRow | undefined {
	return read().employees.find((e) => e.id === id);
}

export function createEmployee(data: EmployeeInsert): EmployeeRow {
	const store = read();
	const row: EmployeeRow = {
		...data,
		id: randomUUID(),
		tanggal_kgb_berikutnya: calcNextKgb(data.tanggal_mulai_kgb_terakhir),
		created_at: now(),
		updated_at: now()
	};
	store.employees.push(row);
	write(store);
	return row;
}

export function updateEmployee(id: string, data: Partial<EmployeeInsert>): EmployeeRow | null {
	const store = read();
	const idx = store.employees.findIndex((e) => e.id === id);
	if (idx === -1) return null;
	const updated: EmployeeRow = {
		...store.employees[idx],
		...data,
		tanggal_kgb_berikutnya: calcNextKgb(
			data.tanggal_mulai_kgb_terakhir ?? store.employees[idx].tanggal_mulai_kgb_terakhir
		),
		updated_at: now()
	};
	store.employees[idx] = updated;
	write(store);
	return updated;
}

export function softDeleteEmployee(id: string): boolean {
	const store = read();
	const idx = store.employees.findIndex((e) => e.id === id);
	if (idx === -1) return false;
	store.employees[idx].is_active = false;
	store.employees[idx].updated_at = now();
	write(store);
	return true;
}

export function upsertEmployees(
	rows: EmployeeInsert[],
	onConflict: 'skip' | 'overwrite' = 'overwrite'
): { imported: number; skipped: number } {
	const store = read();
	let imported = 0;
	let skipped = 0;

	for (const data of rows) {
		const existingIdx = data.nip_nrp
			? store.employees.findIndex((e) => e.nip_nrp === data.nip_nrp)
			: -1;

		if (existingIdx !== -1) {
			if (onConflict === 'skip') {
				skipped++;
			} else {
				const existing = store.employees[existingIdx];
				store.employees[existingIdx] = {
					...existing,
					...data,
					// Preserve enrichment fields that parsers always set to null —
					// only overwrite them if the incoming data explicitly provides a value.
					jenis_kelamin: data.jenis_kelamin ?? existing.jenis_kelamin,
					jabatan_perbendaharaan: data.jabatan_perbendaharaan ?? existing.jabatan_perbendaharaan,
					tanggal_kgb_berikutnya: calcNextKgb(data.tanggal_mulai_kgb_terakhir),
					updated_at: now()
				};
				imported++;
			}
		} else {
			store.employees.push({
				...data,
				id: randomUUID(),
				tanggal_kgb_berikutnya: calcNextKgb(data.tanggal_mulai_kgb_terakhir),
				created_at: now(),
				updated_at: now()
			});
			imported++;
		}
	}

	write(store);
	return { imported, skipped };
}

export function enrichEmployees(
	rows: Array<{ nip_nrp: string; jenis_kelamin: string | null; jabatan_perbendaharaan: string | null }>
): { updated: number; notFound: number } {
	const store = read();
	let updated = 0;
	let notFound = 0;

	for (const data of rows) {
		const idx = store.employees.findIndex((e) => e.nip_nrp === data.nip_nrp);
		if (idx === -1) {
			notFound++;
		} else {
			store.employees[idx] = {
				...store.employees[idx],
				jenis_kelamin: (data.jenis_kelamin as 'Laki-laki' | 'Perempuan' | null) ?? store.employees[idx].jenis_kelamin,
				jabatan_perbendaharaan: data.jabatan_perbendaharaan ?? store.employees[idx].jabatan_perbendaharaan,
				updated_at: now()
			};
			updated++;
		}
	}

	write(store);
	return { updated, notFound };
}

// ── KGB History ───────────────────────────────────────────────────────────────

export function getKgbHistory(employeeId: string): KgbHistoryRow[] {
	return read()
		.kgb_history.filter((h) => h.employee_id === employeeId)
		.sort((a, b) => b.tanggal_kgb.localeCompare(a.tanggal_kgb));
}

export function createKgbHistory(data: KgbHistoryInsert): KgbHistoryRow {
	const store = read();
	const row: KgbHistoryRow = { ...data, id: randomUUID(), created_at: now() };
	store.kgb_history.push(row);
	write(store);
	return row;
}

// ── Import Logs ───────────────────────────────────────────────────────────────

export function getImportLogs(limit = 10): ImportLogRow[] {
	return read()
		.import_logs.sort((a, b) => b.imported_at.localeCompare(a.imported_at))
		.slice(0, limit);
}

export function createImportLog(data: ImportLogInsert): ImportLogRow {
	const store = read();
	const row: ImportLogRow = { ...data, id: randomUUID(), imported_at: now() };
	store.import_logs.push(row);
	write(store);
	return row;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcNextKgb(tglTerakhir: string | null | undefined): string | null {
	if (!tglTerakhir) return null;
	const d = new Date(tglTerakhir + 'T00:00:00');
	if (isNaN(d.getTime())) return null;
	d.setFullYear(d.getFullYear() + 2);
	return d.toISOString().split('T')[0];
}
