import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { ParsedEmployee } from '$lib/types/app.types';
import { upsertEmployees, createImportLog, enrichEmployees } from '$lib/server/db';
import { parseEnrichmentRows } from '$lib/utils/xlsx-parser';
import * as XLSX from 'xlsx';

export const actions: Actions = {
	import: async ({ request, locals }) => {
		const form = await request.formData();

		const filename = form.get('filename') as string;
		const sheetName = form.get('sheet_name') as string;
		const conflictMode = (form.get('conflict_mode') as string) === 'skip' ? 'skip' : 'overwrite';
		const rawData = form.get('employees') as string;

		let employees: ParsedEmployee[];
		try {
			employees = JSON.parse(rawData);
		} catch {
			return fail(400, { error: 'Data tidak valid.' });
		}

		if (!employees.length) return fail(400, { error: 'Tidak ada data untuk diimport.' });

		const rows = employees.map((e) => ({
			...e,
			is_active: true as const,
			created_by: locals.user?.nip ?? null,
			updated_by: null
		}));
		const { imported, skipped } = upsertEmployees(rows, conflictMode);

		createImportLog({
			filename,
			sheet_name: sheetName,
			rows_imported: imported,
			rows_skipped: skipped,
			rows_updated: 0,
			errors: null,
			imported_by: locals.user?.nip ?? null
		});

		return { success: true, rowsImported: imported, rowsSkipped: skipped, errors: [] };
	},

	enrich: async ({ request }) => {
		const form = await request.formData();
		const sheetName = form.get('sheet_name') as string;
		const fileContent = form.get('file_content') as string;

		if (!fileContent) return fail(400, { error: 'File tidak ditemukan.' });
		if (!sheetName) return fail(400, { error: 'Sheet tidak dipilih.' });

		let workbook: XLSX.WorkBook;
		try {
			const binary = atob(fileContent);
			const bytes = new Uint8Array(binary.length);
			for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
			workbook = XLSX.read(bytes, { type: 'array' });
		} catch {
			return fail(400, { error: 'Gagal membaca file XLSX.' });
		}

		let rows;
		try {
			const ws = workbook.Sheets[sheetName];
			if (!ws) return fail(400, { error: `Sheet "${sheetName}" tidak ditemukan dalam file.` });
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });
			rows = parseEnrichmentRows(rawRows);
		} catch (e) {
			return fail(400, { error: `Gagal memparse sheet: ${e}` });
		}

		if (!rows.length) return fail(400, { error: 'Tidak ada data enrichment ditemukan di sheet tersebut.' });

		const { updated, notFound } = enrichEmployees(rows);

		return { enrichSuccess: true, updated, notFound };
	}
};
