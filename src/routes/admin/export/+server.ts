import type { RequestHandler } from './$types';
import { getEmployees } from '$lib/server/db';
import * as XLSX from 'xlsx';

const STATUS_LABEL: Record<string, string> = {
	eligible_pending: 'Belum Diproses',
	diusulkan: 'Sudah Diusulkan',
	sudah_diproses: 'Sudah Diproses',
	tidak_eligible: 'Tidak Eligible',
	maksimum: 'Maks. KGB'
};

const TYPE_LABEL: Record<string, string> = {
	PNS: 'PNS',
	PPPK: 'PPPK',
	PPPK_PARUH_WAKTU: 'PPPK Paruh Waktu',
	CPNS: 'CPNS',
	PPNPN: 'PPNPN'
};

function formatTanggal(iso: string | null | undefined): string {
	if (!iso) return '-';
	const [y, m, d] = iso.split('-');
	const bulan = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
		'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
	return `${parseInt(d)} ${bulan[parseInt(m)]} ${y}`;
}

export const GET: RequestHandler = async () => {
	const employees = await getEmployees({ activeOnly: true });

	const rows = employees.map((e, i) => ({
		'No': i + 1,
		'Nama': e.nama,
		'NIP / NRP': e.nip_nrp ?? '-',
		'Tipe Pegawai': TYPE_LABEL[e.employee_type] ?? e.employee_type,
		'Golongan': e.golongan ?? '-',
		'Jabatan': e.jabatan ?? '-',
		'Jabatan Perbendaharaan': e.jabatan_perbendaharaan ?? '-',
		'Sub Unit / Bidang': e.sub_unit ?? '-',
		'Lokasi': e.lokasi_berkantor ?? '-',
		'No. Telepon': e.nomor_telepon ?? '-',
		'Jenis Kelamin': e.jenis_kelamin ?? '-',
		'Status KGB': STATUS_LABEL[e.kgb_status_category] ?? e.kgb_status_category,
		'KGB Terakhir': formatTanggal(e.tanggal_mulai_kgb_terakhir),
		'KGB Berikutnya': formatTanggal(e.tanggal_kgb_berikutnya),
		'Keterangan': e.keterangan ?? '-'
	}));

	const wb = XLSX.utils.book_new();
	const ws = XLSX.utils.json_to_sheet(rows);

	ws['!cols'] = [
		{ wch: 4 },  // No
		{ wch: 40 }, // Nama
		{ wch: 22 }, // NIP
		{ wch: 18 }, // Tipe
		{ wch: 10 }, // Golongan
		{ wch: 35 }, // Jabatan
		{ wch: 35 }, // Jabatan Perbendaharaan
		{ wch: 25 }, // Sub Unit
		{ wch: 28 }, // Lokasi
		{ wch: 16 }, // Telepon
		{ wch: 16 }, // Jenis Kelamin
		{ wch: 18 }, // Status
		{ wch: 20 }, // KGB Terakhir
		{ wch: 20 }, // KGB Berikutnya
		{ wch: 20 }, // Keterangan
	];

	XLSX.utils.book_append_sheet(wb, ws, 'Data Kepegawaian');

	const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

	const today = new Date().toISOString().slice(0, 10);
	const filename = `Kepegawaian-BP3KP-${today}.xlsx`;

	return new Response(buffer, {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};
