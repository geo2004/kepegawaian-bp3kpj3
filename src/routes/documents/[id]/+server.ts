import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readDocument } from '$lib/server/documents';
import { getEmployeeById } from '$lib/server/db';

export const GET: RequestHandler = async ({ params }) => {
	const employee = await getEmployeeById(params.id);
	if (!employee) throw error(404, 'Pegawai tidak ditemukan.');

	const buffer = await readDocument(params.id);
	if (!buffer) throw error(404, 'Dokumen belum tersedia.');

	const filename = `SK-KGB-${employee.nip_nrp ?? employee.id}.pdf`;

	return new Response(new Uint8Array(buffer), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `inline; filename="${filename}"`,
			'Content-Length': String(buffer.length)
		}
	});
};
