import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private';
import type {
	EmployeeRow,
	EmployeeInsert,
	KgbHistoryRow,
	KgbHistoryInsert,
	ImportLogRow,
	ImportLogInsert
} from '$lib/types/database.types';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const KGB_ELIGIBLE_TYPES = ['PNS', 'PPPK', 'PPPK_PARUH_WAKTU'] as const;

// ── Employees ─────────────────────────────────────────────────────────────────

export async function getEmployees(opts?: {
	search?: string;
	lokasi?: string;
	golongan?: string;
	status?: string;
	activeOnly?: boolean;
	kgbEligibleOnly?: boolean;
}): Promise<EmployeeRow[]> {
	let query = supabase.from('employees').select('*').neq('employee_type', 'PPNPN');

	if (opts?.activeOnly !== false) query = query.eq('is_active', true);
	if (opts?.kgbEligibleOnly) query = query.in('employee_type', [...KGB_ELIGIBLE_TYPES]);
	if (opts?.lokasi) query = query.eq('lokasi_berkantor', opts.lokasi);
	if (opts?.golongan) query = query.eq('golongan', opts.golongan);
	if (opts?.status) query = query.eq('kgb_status_category', opts.status);
	if (opts?.search) {
		const s = opts.search.replace(/[%_]/g, '\\$&');
		query = query.or(`nama.ilike.%${s}%,nip_nrp.ilike.%${s}%`);
	}

	const { data, error } = await query;
	if (error) throw new Error(error.message);
	return (data ?? []) as EmployeeRow[];
}

export async function getEmployeeById(id: string): Promise<EmployeeRow | undefined> {
	const { data, error } = await supabase
		.from('employees')
		.select('*')
		.eq('id', id)
		.maybeSingle();
	if (error) return undefined;
	return (data ?? undefined) as EmployeeRow | undefined;
}

export async function createEmployee(data: EmployeeInsert): Promise<EmployeeRow> {
	const row = {
		...data,
		tanggal_kgb_berikutnya: calcNextKgb(data.tanggal_mulai_kgb_terakhir)
	};
	const { data: inserted, error } = await supabase
		.from('employees')
		.insert(row)
		.select()
		.single();
	if (error) throw new Error(error.message);
	return inserted as EmployeeRow;
}

export async function updateEmployee(
	id: string,
	data: Partial<EmployeeInsert>
): Promise<EmployeeRow | null> {
	const current = await getEmployeeById(id);
	if (!current) return null;

	const row = {
		...data,
		tanggal_kgb_berikutnya: calcNextKgb(
			data.tanggal_mulai_kgb_terakhir ?? current.tanggal_mulai_kgb_terakhir
		),
		updated_at: new Date().toISOString()
	};
	const { data: updated, error } = await supabase
		.from('employees')
		.update(row)
		.eq('id', id)
		.select()
		.single();
	if (error) throw new Error(error.message);
	return updated as EmployeeRow;
}

export async function softDeleteEmployee(id: string): Promise<boolean> {
	const { error } = await supabase
		.from('employees')
		.update({ is_active: false, updated_at: new Date().toISOString() })
		.eq('id', id);
	return !error;
}

export async function upsertEmployees(
	rows: EmployeeInsert[],
	onConflict: 'skip' | 'overwrite' = 'overwrite'
): Promise<{ imported: number; skipped: number }> {
	let imported = 0;
	let skipped = 0;

	for (const data of rows) {
		if (!data.nip_nrp) {
			await supabase.from('employees').insert({
				...data,
				tanggal_kgb_berikutnya: calcNextKgb(data.tanggal_mulai_kgb_terakhir)
			});
			imported++;
			continue;
		}

		const { data: existing } = await supabase
			.from('employees')
			.select('id, jenis_kelamin, jabatan_perbendaharaan')
			.eq('nip_nrp', data.nip_nrp)
			.maybeSingle();

		if (existing) {
			if (onConflict === 'skip') {
				skipped++;
			} else {
				await supabase
					.from('employees')
					.update({
						...data,
						jenis_kelamin: data.jenis_kelamin ?? existing.jenis_kelamin,
						jabatan_perbendaharaan:
							data.jabatan_perbendaharaan ?? existing.jabatan_perbendaharaan,
						tanggal_kgb_berikutnya: calcNextKgb(data.tanggal_mulai_kgb_terakhir),
						updated_at: new Date().toISOString()
					})
					.eq('id', existing.id);
				imported++;
			}
		} else {
			await supabase.from('employees').insert({
				...data,
				tanggal_kgb_berikutnya: calcNextKgb(data.tanggal_mulai_kgb_terakhir)
			});
			imported++;
		}
	}

	return { imported, skipped };
}

export async function enrichEmployees(
	rows: Array<{
		nip_nrp: string;
		jenis_kelamin: string | null;
		jabatan_perbendaharaan: string | null;
	}>
): Promise<{ updated: number; notFound: number }> {
	let updated = 0;
	let notFound = 0;

	for (const data of rows) {
		const { data: existing } = await supabase
			.from('employees')
			.select('id, jenis_kelamin, jabatan_perbendaharaan')
			.eq('nip_nrp', data.nip_nrp)
			.maybeSingle();

		if (!existing) {
			notFound++;
		} else {
			await supabase
				.from('employees')
				.update({
					jenis_kelamin: data.jenis_kelamin ?? existing.jenis_kelamin,
					jabatan_perbendaharaan:
						data.jabatan_perbendaharaan ?? existing.jabatan_perbendaharaan,
					updated_at: new Date().toISOString()
				})
				.eq('id', existing.id);
			updated++;
		}
	}

	return { updated, notFound };
}

// ── KGB History ───────────────────────────────────────────────────────────────

export async function getKgbHistory(employeeId: string): Promise<KgbHistoryRow[]> {
	const { data, error } = await supabase
		.from('kgb_history')
		.select('*')
		.eq('employee_id', employeeId)
		.order('tanggal_kgb', { ascending: false });
	if (error) throw new Error(error.message);
	return (data ?? []) as KgbHistoryRow[];
}

export async function createKgbHistory(data: KgbHistoryInsert): Promise<KgbHistoryRow> {
	const { data: inserted, error } = await supabase
		.from('kgb_history')
		.insert(data)
		.select()
		.single();
	if (error) throw new Error(error.message);
	return inserted as KgbHistoryRow;
}

// ── Import Logs ───────────────────────────────────────────────────────────────

export async function getImportLogs(limit = 10): Promise<ImportLogRow[]> {
	const { data, error } = await supabase
		.from('import_logs')
		.select('*')
		.order('imported_at', { ascending: false })
		.limit(limit);
	if (error) throw new Error(error.message);
	return (data ?? []) as ImportLogRow[];
}

export async function createImportLog(data: ImportLogInsert): Promise<ImportLogRow> {
	const { data: inserted, error } = await supabase
		.from('import_logs')
		.insert(data)
		.select()
		.single();
	if (error) throw new Error(error.message);
	return inserted as ImportLogRow;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcNextKgb(tglTerakhir: string | null | undefined): string | null {
	if (!tglTerakhir) return null;
	const d = new Date(tglTerakhir + 'T00:00:00');
	if (isNaN(d.getTime())) return null;
	d.setFullYear(d.getFullYear() + 2);
	return d.toISOString().split('T')[0];
}
