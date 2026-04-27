<script lang="ts">
	import Chart from '$lib/components/Chart.svelte';
	import ChartCard from '$lib/components/ChartCard.svelte';
	import type { PageData } from './$types';
	import type { EmployeeRow } from '$lib/types/database.types';
	import {
		getAgeFromNip,
		getAppointmentYear,
		kategorisasiJabatan,
		namaJabatanTertentu,
		shortenSubUnit,
		LOKASI_DISPLAY
	} from '$lib/utils/analytics';

	let { data }: { data: PageData } = $props();
	const { employees, stats } = data;

	// ── Expand state ──────────────────────────────────────────────────────────────
	let expandedId = $state<string | null>(null);
	function toggleExpand(id: string) {
		expandedId = expandedId === id ? null : id;
	}

	// ── Export ────────────────────────────────────────────────────────────────────
	async function exportXlsx() {
		const XLSX = await import('xlsx');
		const rows = employees.map((e: EmployeeRow, i: number) => ({
			No: i + 1,
			Nama: e.nama,
			'NIP / NRP': e.nip_nrp ?? '',
			'Tipe Pegawai': e.employee_type,
			'Jenis Kelamin': e.jenis_kelamin ?? '',
			Golongan: e.golongan ?? '',
			Jabatan: normaliseJabatan(e.jabatan ?? ''),
			'Sub Unit / Bidang': e.sub_unit ?? '',
			'Lokasi Penempatan': LOKASI_DISPLAY[e.lokasi_berkantor] ?? e.lokasi_berkantor,
			'No. Telepon': e.nomor_telepon ?? '',
			'Jabatan Perbendaharaan': e.jabatan_perbendaharaan ?? ''
		}));
		const ws = XLSX.utils.json_to_sheet(rows);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Data Pegawai');
		XLSX.writeFile(wb, 'Data_Pegawai_BP3KP_Jawa_III.xlsx');
	}

	function normaliseJabatan(jabatan: string): string {
		return jabatan.replace(/\bDan\b/g, 'dan');
	}

	// ── Filter state ──────────────────────────────────────────────────────────────
	let search = $state('');
	let filterTipe = $state('');
	let filterLokasi = $state('');
	let filterSubUnit = $state('');

	const tipeOptions = Object.keys(stats.byTipe).sort();
	const lokasiOptions = Object.keys(stats.byLokasi).sort();
	const subUnitOptions = Object.keys(stats.bySubUnit).sort();

	const filtered = $derived(
		employees.filter((e: EmployeeRow) => {
			if (filterTipe && e.employee_type !== filterTipe) return false;
			// Compare against display label since stats.byLokasi uses display labels
			if (filterLokasi && (LOKASI_DISPLAY[e.lokasi_berkantor] ?? e.lokasi_berkantor) !== filterLokasi) return false;
			if (filterSubUnit && (e.sub_unit ?? '-') !== filterSubUnit) return false;
			if (search) {
				const q = search.toLowerCase();
				return (
					e.nama.toLowerCase().includes(q) ||
					(e.nip_nrp ?? '').toLowerCase().includes(q) ||
					(e.jabatan ?? '').toLowerCase().includes(q)
				);
			}
			return true;
		})
	);

	// ── Helpers ───────────────────────────────────────────────────────────────────
	const currentYear = new Date().getFullYear();

	// ── Constants ─────────────────────────────────────────────────────────────────
	const PNS_GOLONGAN_ORDER = [
		'I/a','I/b','I/c','I/d','II/a','II/b','II/c','II/d',
		'III/a','III/b','III/c','III/d','IV/a','IV/b','IV/c','IV/d','IV/e'
	];
	const TIPE_COLORS: Record<string, string> = {
		PNS: '#3b82f6', PPPK: '#10b981', 'PPPK Paruh Waktu': '#6366f1', CPNS: '#f59e0b', PPNPN: '#94a3b8'
	};
	const SUB_UNIT_ORDER = Object.keys(stats.bySubUnit).sort((a, b) => stats.bySubUnit[b] - stats.bySubUnit[a]);
	const AGE_BRACKETS = ['< 25','25–29','30–34','35–39','40–44','45–49','50–54','≥ 55'];
	const SERVICE_BRACKETS = ['< 2 thn','2–5 thn','6–10 thn','11–15 thn','16–20 thn','> 20 thn'];

	// ── Chart data ────────────────────────────────────────────────────────────────

	// 1. Tipe Pegawai
	const tipeChartData = $derived({
		labels: Object.keys(stats.byTipe),
		datasets: [{ label: 'Pegawai', data: Object.values(stats.byTipe),
			backgroundColor: Object.keys(stats.byTipe).map(k => TIPE_COLORS[k] ?? '#94a3b8'), borderRadius: 6 }]
	});

	// 2. Tipe per Lokasi (using display labels for lokasi)
	const lokasiList = Object.keys(stats.byLokasi);
	const tipePerLokasiData = $derived(() => {
		const counts: Record<string, Record<string, number>> = {};
		for (const emp of employees) {
			const tipeLabel = emp.employee_type;
			const lokasiLabel = LOKASI_DISPLAY[emp.lokasi_berkantor] ?? emp.lokasi_berkantor;
			if (!counts[tipeLabel]) counts[tipeLabel] = {};
			counts[tipeLabel][lokasiLabel] = (counts[tipeLabel][lokasiLabel] ?? 0) + 1;
		}
		return counts;
	});
	const tipePerLokasiChartData = $derived({
		labels: lokasiList,
		datasets: Object.keys(stats.byTipe).map(tipe => ({
			label: tipe, data: lokasiList.map(l => tipePerLokasiData()[tipe]?.[l] ?? 0),
			backgroundColor: TIPE_COLORS[tipe] ?? '#94a3b8', borderRadius: 4
		}))
	});

	// 3. Jenis Kelamin
	const genderChartData = $derived({
		labels: Object.keys(stats.byGender),
		datasets: [{ data: Object.values(stats.byGender),
			backgroundColor: ['#3b82f6','#ec4899','#94a3b8'], borderWidth: 2, borderColor: '#fff' }]
	});

	// 4. Distribusi Usia
	const ageCounts = $derived(() => {
		const c: Record<string, number> = Object.fromEntries(AGE_BRACKETS.map(b => [b, 0]));
		for (const emp of employees) {
			const age = getAgeFromNip(emp.nip_nrp);
			if (age === null) continue;
			let b: string;
			if      (age < 25) b = '< 25';
			else if (age < 30) b = '25–29';
			else if (age < 35) b = '30–34';
			else if (age < 40) b = '35–39';
			else if (age < 45) b = '40–44';
			else if (age < 50) b = '45–49';
			else if (age < 55) b = '50–54';
			else               b = '≥ 55';
			c[b]++;
		}
		return c;
	});
	const avgAge = $derived(() => {
		const ages = employees.map((e: EmployeeRow) => getAgeFromNip(e.nip_nrp)).filter((a): a is number => a !== null);
		return ages.length ? Math.round(ages.reduce((s, a) => s + a, 0) / ages.length) : 0;
	});
	const ageChartData = $derived({
		labels: AGE_BRACKETS,
		datasets: [{ label: 'Pegawai', data: AGE_BRACKETS.map(b => ageCounts()[b]),
			backgroundColor: ['#bfdbfe','#93c5fd','#60a5fa','#3b82f6','#2563eb','#1d4ed8','#1e40af','#1e3a8a'],
			borderRadius: 4 }]
	});

	// 5. Golongan PNS
	const pnsGolonganEntries = $derived(
		Object.entries(stats.byGolongan)
			.filter(([k]) => PNS_GOLONGAN_ORDER.includes(k))
			.sort(([a], [b]) => PNS_GOLONGAN_ORDER.indexOf(a) - PNS_GOLONGAN_ORDER.indexOf(b))
	);
	const pnsGolonganChartData = $derived({
		labels: pnsGolonganEntries.map(([k]) => k),
		datasets: [{ label: 'PNS', data: pnsGolonganEntries.map(([, v]) => v), backgroundColor: '#3b82f6', borderRadius: 4 }]
	});

	// 6. Golongan PPPK
	const pppkGolonganEntries = $derived(
		Object.entries(stats.byGolongan)
			.filter(([k]) => !PNS_GOLONGAN_ORDER.includes(k) && k !== '-')
			.sort(([a], [b]) => parseInt(a) - parseInt(b))
	);
	const pppkGolonganChartData = $derived({
		labels: pppkGolonganEntries.map(([k]) => k),
		datasets: [{ label: 'PPPK', data: pppkGolonganEntries.map(([, v]) => v), backgroundColor: '#10b981', borderRadius: 4 }]
	});

	// 7. Gelombang Pengangkatan
	const hiringCohortData = $derived(() => {
		const byYear: Record<string, Record<string, number>> = {};
		for (const emp of employees) {
			const yr = getAppointmentYear(emp.nip_nrp);
			if (!yr) continue;
			const key = String(yr);
			if (!byYear[key]) byYear[key] = {};
			byYear[key][emp.employee_type] = (byYear[key][emp.employee_type] ?? 0) + 1;
		}
		const years = Object.keys(byYear).sort();
		return { years, byYear };
	});
	const hiringCohortChartData = $derived({
		labels: hiringCohortData().years,
		datasets: Object.keys(stats.byTipe).map(tipe => ({
			label: tipe,
			data: hiringCohortData().years.map(yr => hiringCohortData().byYear[yr]?.[tipe] ?? 0),
			backgroundColor: TIPE_COLORS[tipe] ?? '#94a3b8', borderRadius: 3, stack: 'cohort'
		}))
	});

	// 8. Lama Pengabdian
	const serviceCounts = $derived(() => {
		const c: Record<string, number> = Object.fromEntries(SERVICE_BRACKETS.map(b => [b, 0]));
		for (const emp of employees) {
			const yr = getAppointmentYear(emp.nip_nrp);
			if (!yr) continue;
			const svc = currentYear - yr;
			let b: string;
			if      (svc < 2)  b = '< 2 thn';
			else if (svc <= 5)  b = '2–5 thn';
			else if (svc <= 10) b = '6–10 thn';
			else if (svc <= 15) b = '11–15 thn';
			else if (svc <= 20) b = '16–20 thn';
			else                b = '> 20 thn';
			c[b]++;
		}
		return c;
	});
	const serviceChartData = $derived({
		labels: SERVICE_BRACKETS,
		datasets: [{ label: 'Pegawai', data: SERVICE_BRACKETS.map(b => serviceCounts()[b]),
			backgroundColor: ['#fde68a','#fbbf24','#f59e0b','#d97706','#b45309','#92400e'], borderRadius: 4 }]
	});

	// 9. Kategori Jabatan
	const jabatanKategoriCounts = $derived(() => {
		const c = { struktural: 0, fungsional_tertentu: 0, fungsional_umum: 0 };
		for (const emp of employees) c[kategorisasiJabatan(emp.jabatan ?? '')]++;
		return c;
	});
	const jabatanKategoriChartData = $derived({
		labels: ['Pejabat Struktural','Fungsional Tertentu','Fungsional Umum'],
		datasets: [{ data: [jabatanKategoriCounts().struktural, jabatanKategoriCounts().fungsional_tertentu, jabatanKategoriCounts().fungsional_umum],
			backgroundColor: ['#7c3aed','#0891b2','#64748b'], borderWidth: 2, borderColor: '#fff' }]
	});

	// 10. Level Fungsional Tertentu
	const fungsionalLevelCounts = $derived(() => {
		const c = { 'Ahli Pertama': 0, 'Ahli Muda': 0, 'Ahli Madya': 0 };
		for (const emp of employees) {
			const j = (emp.jabatan ?? '').toLowerCase();
			if      (/ahli pertama/.test(j)) c['Ahli Pertama']++;
			else if (/ahli muda/.test(j))    c['Ahli Muda']++;
			else if (/ahli madya/.test(j))   c['Ahli Madya']++;
		}
		return c;
	});
	const fungsionalLevelChartData = $derived({
		labels: Object.keys(fungsionalLevelCounts()),
		datasets: [{ data: Object.values(fungsionalLevelCounts()),
			backgroundColor: ['#bae6fd','#38bdf8','#0284c7'], borderWidth: 2, borderColor: '#fff' }]
	});

	// 11. Jabatan Perbendaharaan per Golongan
	const jabPerbByGolongan = $derived(() => {
		const c: Record<string, number> = {};
		for (const emp of employees) {
			if (!emp.jabatan_perbendaharaan) continue;
			const gol = emp.golongan ?? '-';
			c[gol] = (c[gol] ?? 0) + 1;
		}
		return Object.entries(c).sort(([a], [b]) => PNS_GOLONGAN_ORDER.indexOf(a) - PNS_GOLONGAN_ORDER.indexOf(b));
	});
	const jabPerbChartData = $derived({
		labels: jabPerbByGolongan().map(([k]) => k),
		datasets: [{ label: 'Pemegang Jabatan', data: jabPerbByGolongan().map(([, v]) => v),
			backgroundColor: '#7c3aed', borderRadius: 4 }]
	});

	// 12. Fungsional Tertentu by jenis jabatan
	const fungsionalTertentuByType = $derived(() => {
		const c: Record<string, number> = {};
		for (const emp of employees) {
			if (kategorisasiJabatan(emp.jabatan ?? '') !== 'fungsional_tertentu') continue;
			const nama = namaJabatanTertentu(emp.jabatan ?? '');
			c[nama] = (c[nama] ?? 0) + 1;
		}
		return Object.entries(c).sort(([, a], [, b]) => b - a);
	});
	const fungsionalTertentuChartData = $derived({
		labels: fungsionalTertentuByType().map(([k]) => k),
		datasets: [{ label: 'Pegawai', data: fungsionalTertentuByType().map(([, v]) => v),
			backgroundColor: '#0891b2', borderRadius: 4 }]
	});

	// 13. Fungsional Umum by jabatan
	const fungsionalUmumByType = $derived(() => {
		const c: Record<string, number> = {};
		for (const emp of employees) {
			if (kategorisasiJabatan(emp.jabatan ?? '') !== 'fungsional_umum') continue;
			c[emp.jabatan ?? '-'] = (c[emp.jabatan ?? '-'] ?? 0) + 1;
		}
		return Object.entries(c).sort(([, a], [, b]) => b - a);
	});
	const fungsionalUmumChartData = $derived({
		labels: fungsionalUmumByType().map(([k]) => k),
		datasets: [{ label: 'Pegawai', data: fungsionalUmumByType().map(([, v]) => v),
			backgroundColor: '#64748b', borderRadius: 4 }]
	});

	// 14. Golongan per Lokasi (use LOKASI_DISPLAY for keys)
	const golonganLokasiData = $derived(() => {
		const gols = Object.keys(stats.byGolongan).filter(k => k !== '-').sort((a, b) => {
			const ai = PNS_GOLONGAN_ORDER.indexOf(a), bi = PNS_GOLONGAN_ORDER.indexOf(b);
			if (ai !== -1 && bi !== -1) return ai - bi;
			if (ai !== -1) return -1; if (bi !== -1) return 1;
			return parseInt(a) - parseInt(b);
		});
		const counts: Record<string, Record<string, number>> = {};
		for (const emp of employees) {
			const lokasiLabel = LOKASI_DISPLAY[emp.lokasi_berkantor] ?? emp.lokasi_berkantor;
			if (!counts[lokasiLabel]) counts[lokasiLabel] = {};
			const gol = emp.golongan ?? '-';
			counts[lokasiLabel][gol] = (counts[lokasiLabel][gol] ?? 0) + 1;
		}
		return { gols, counts };
	});
	const golonganLokasiChartData = $derived({
		labels: golonganLokasiData().gols,
		datasets: [
			{ label: 'Yogyakarta', data: golonganLokasiData().gols.map(g => golonganLokasiData().counts['Yogyakarta']?.[g] ?? 0), backgroundColor: '#0ea5e9', borderRadius: 3 },
			{ label: 'Semarang',   data: golonganLokasiData().gols.map(g => golonganLokasiData().counts['Semarang']?.[g] ?? 0),   backgroundColor: '#f97316', borderRadius: 3 }
		]
	});

	// 15. Lokasi
	const lokasiChartData = $derived({
		labels: Object.keys(stats.byLokasi),
		datasets: [{ data: Object.values(stats.byLokasi),
			backgroundColor: ['#0ea5e9','#f97316','#6366f1'], borderWidth: 2, borderColor: '#fff' }]
	});

	// 16. Gender per Sub Unit
	const genderPerSubUnitData = $derived(() => {
		const male: number[] = [], female: number[] = [];
		for (const su of SUB_UNIT_ORDER) {
			let m = 0, f = 0;
			for (const emp of employees) {
				if (emp.sub_unit !== su) continue;
				if (emp.jenis_kelamin === 'Laki-laki') m++; else f++;
			}
			male.push(m); female.push(f);
		}
		return { male, female };
	});
	const genderPerSubUnitChartData = $derived({
		labels: SUB_UNIT_ORDER.map(shortenSubUnit),
		datasets: [
			{ label: 'Laki-laki', data: genderPerSubUnitData().male,   backgroundColor: '#3b82f6', borderRadius: 3 },
			{ label: 'Perempuan', data: genderPerSubUnitData().female, backgroundColor: '#ec4899', borderRadius: 3 }
		]
	});

	// 17. Sub Unit
	const sortedSubUnit = $derived(Object.entries(stats.bySubUnit).sort(([, a], [, b]) => b - a));
	const subUnitChartData = $derived({
		labels: sortedSubUnit.map(([k]) => shortenSubUnit(k)),
		datasets: [{ label: 'Pegawai', data: sortedSubUnit.map(([, v]) => v), backgroundColor: '#1e40af', borderRadius: 4 }]
	});

	// ── Chart options ─────────────────────────────────────────────────────────────
	const donut = {
		responsive: true, maintainAspectRatio: false,
		plugins: { legend: { position: 'bottom' as const, labels: { font: { size: 11 }, boxWidth: 12, padding: 8 } } }
	};
	const bar = {
		responsive: true, maintainAspectRatio: false,
		plugins: { legend: { display: false } },
		scales: { y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } } }, x: { ticks: { font: { size: 10 } } } }
	};
	const barLegend = {
		responsive: true, maintainAspectRatio: false,
		plugins: { legend: { position: 'bottom' as const, labels: { font: { size: 11 }, boxWidth: 12, padding: 6 } } },
		scales: { y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } } }, x: { ticks: { font: { size: 10 } } } }
	};
	const hbar = {
		responsive: true, maintainAspectRatio: false,
		indexAxis: 'y' as const,
		plugins: { legend: { display: false } },
		scales: {
			x: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } } },
			y: { ticks: { font: { size: 10 }, autoSkip: false } }
		}
	};
	const hbarLegend = {
		responsive: true, maintainAspectRatio: false,
		indexAxis: 'y' as const,
		plugins: { legend: { position: 'bottom' as const, labels: { font: { size: 11 }, boxWidth: 12, padding: 6 } } },
		scales: {
			x: { beginAtZero: true, stacked: true, ticks: { stepSize: 1, font: { size: 10 } } },
			y: { stacked: true, ticks: { font: { size: 10 }, autoSkip: false } }
		}
	};
	const stackedBar = {
		responsive: true, maintainAspectRatio: false,
		plugins: { legend: { position: 'bottom' as const, labels: { font: { size: 11 }, boxWidth: 12, padding: 6 } } },
		scales: {
			x: { stacked: true, ticks: { font: { size: 10 } } },
			y: { beginAtZero: true, stacked: true, ticks: { stepSize: 1, font: { size: 10 } } }
		}
	};

	// ── Insights ──────────────────────────────────────────────────────────────────
	const dominantTipe = $derived(Object.entries(stats.byTipe).sort(([,a],[,b]) => b-a)[0]);
	const largestUnit  = $derived(Object.entries(stats.bySubUnit).sort(([,a],[,b]) => b-a)[0]);
	const male   = stats.byGender['Laki-laki'] ?? 0;
	const female = stats.byGender['Perempuan'] ?? 0;
	const yogya  = stats.byLokasi['Yogyakarta'] ?? 0;
	const smg    = stats.byLokasi['Semarang'] ?? 0;
	const dominantGolongan          = $derived(Object.entries(stats.byGolongan).sort(([,a],[,b]) => b-a)[0]);
	const dominantAge               = $derived(AGE_BRACKETS.reduce((best, b) => ageCounts()[b] > ageCounts()[best] ? b : best, AGE_BRACKETS[0]));
	const dominantFungsionalTertentu = $derived(fungsionalTertentuByType()[0]);
</script>

<svelte:head>
	<title>Dashboard Kepegawaian — BP3KP Jawa III</title>
</svelte:head>

<main class="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">

	<!-- Header row -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-xl font-bold text-gray-900">Dashboard Kepegawaian</h1>
			<p class="text-sm text-gray-500">BP3KP Jawa III — Visualisasi data kepegawaian</p>
		</div>
		<button
			onclick={exportXlsx}
			class="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
				<polyline points="7 10 12 15 17 10"></polyline>
				<line x1="12" y1="15" x2="12" y2="3"></line>
			</svg>
			Export XLSX
		</button>
	</div>

	<!-- KPI Cards -->
	<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
		<div class="bg-white rounded-xl shadow p-4 border-l-4 border-blue-600">
			<p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Total</p>
			<p class="text-3xl font-bold text-blue-700">{stats.total}</p>
		</div>
		<div class="bg-white rounded-xl shadow p-4 border-l-4 border-blue-400">
			<p class="text-xs text-gray-500 uppercase tracking-wide font-medium">PNS</p>
			<p class="text-3xl font-bold text-blue-500">{stats.byTipe['PNS'] ?? 0}</p>
			<p class="text-xs text-gray-400">{Math.round(((stats.byTipe['PNS'] ?? 0) / stats.total) * 100)}%</p>
		</div>
		<div class="bg-white rounded-xl shadow p-4 border-l-4 border-emerald-500">
			<p class="text-xs text-gray-500 uppercase tracking-wide font-medium">PPPK</p>
			<p class="text-3xl font-bold text-emerald-600">{(stats.byTipe['PPPK'] ?? 0) + (stats.byTipe['PPPK Paruh Waktu'] ?? 0)}</p>
			<p class="text-xs text-gray-400">{stats.byTipe['PPPK Paruh Waktu'] ? `${stats.byTipe['PPPK Paruh Waktu']} paruh waktu` : `${Math.round(((stats.byTipe['PPPK'] ?? 0) / stats.total) * 100)}%`}</p>
		</div>
		<div class="bg-white rounded-xl shadow p-4 border-l-4 border-amber-500">
			<p class="text-xs text-gray-500 uppercase tracking-wide font-medium">CPNS</p>
			<p class="text-3xl font-bold text-amber-600">{stats.byTipe['CPNS'] ?? 0}</p>
			<p class="text-xs text-gray-400">{Math.round(((stats.byTipe['CPNS'] ?? 0) / stats.total) * 100)}%</p>
		</div>
		<div class="bg-white rounded-xl shadow p-4 border-l-4 border-violet-500">
			<p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Jabatan Perbendaharaan</p>
			<p class="text-3xl font-bold text-violet-600">{stats.jabatanPerbendaharaanCount}</p>
			<p class="text-xs text-gray-400">posisi</p>
		</div>
		<div class="bg-white rounded-xl shadow p-4 border-l-4 border-rose-400">
			<p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Rata-rata Usia</p>
			<p class="text-3xl font-bold text-rose-500">{avgAge()}</p>
			<p class="text-xs text-gray-400">tahun</p>
		</div>
	</div>

	<!-- SECTION 1: Komposisi & Demografi -->
	<div>
		<p class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Komposisi & Demografi</p>
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
			<ChartCard id="tipe" title="Tipe Pegawai" {expandedId} onToggle={toggleExpand} height="h-40" expandedHeight="h-[400px]">
				<Chart type="bar" data={tipeChartData} options={bar} />
			</ChartCard>
			<ChartCard id="tipe-lokasi" title="Tipe per Lokasi" {expandedId} onToggle={toggleExpand} height="h-40" expandedHeight="h-[400px]">
				<Chart type="bar" data={tipePerLokasiChartData} options={barLegend} />
			</ChartCard>
			<ChartCard id="gender" title="Jenis Kelamin" {expandedId} onToggle={toggleExpand} height="h-40" expandedHeight="h-[400px]" center>
				<Chart type="pie" data={genderChartData} options={donut} />
			</ChartCard>
			<ChartCard id="lokasi" title="Lokasi Penempatan" {expandedId} onToggle={toggleExpand} height="h-40" expandedHeight="h-[400px]" center>
				<Chart type="pie" data={lokasiChartData} options={donut} />
			</ChartCard>
		</div>
	</div>

	<!-- SECTION 2: Golongan & Lokasi -->
	<div>
		<p class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Golongan & Lokasi</p>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			<ChartCard id="gol-pns" title="Golongan PNS" subtitle="(I/a – IV/e)" {expandedId} onToggle={toggleExpand} height="h-44" expandedHeight="h-[420px]">
				<Chart type="bar" data={pnsGolonganChartData} options={bar} />
			</ChartCard>
			<ChartCard id="gol-pppk" title="Golongan PPPK" subtitle="(numerik)" {expandedId} onToggle={toggleExpand} height="h-44" expandedHeight="h-[420px]">
				<Chart type="bar" data={pppkGolonganChartData} options={bar} />
			</ChartCard>
			<ChartCard id="gol-lokasi" title="Golongan per Lokasi" {expandedId} onToggle={toggleExpand} height="h-44" expandedHeight="h-[420px]">
				<Chart type="bar" data={golonganLokasiChartData} options={barLegend} />
			</ChartCard>
		</div>
	</div>

	<!-- SECTION 3: Usia & Masa Kerja -->
	<div>
		<p class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Usia & Masa Kerja</p>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			<ChartCard id="usia" title="Distribusi Usia" subtitle="rata-rata {avgAge()} thn" {expandedId} onToggle={toggleExpand} height="h-44" expandedHeight="h-[420px]">
				<Chart type="bar" data={ageChartData} options={bar} />
			</ChartCard>
			<ChartCard id="cohort" title="Gelombang Pengangkatan" {expandedId} onToggle={toggleExpand} height="h-44" expandedHeight="h-[420px]">
				<Chart type="bar" data={hiringCohortChartData} options={stackedBar} />
			</ChartCard>
			<ChartCard id="lama" title="Lama Pengabdian" {expandedId} onToggle={toggleExpand} height="h-44" expandedHeight="h-[420px]">
				<Chart type="bar" data={serviceChartData} options={bar} />
			</ChartCard>
		</div>
	</div>

	<!-- SECTION 4: Jabatan -->
	<div>
		<p class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Jabatan</p>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			<ChartCard id="kat-jabatan" title="Kategori Jabatan" {expandedId} onToggle={toggleExpand} height="h-44" expandedHeight="h-[400px]" center>
				<Chart type="doughnut" data={jabatanKategoriChartData} options={donut} />
			</ChartCard>
			<ChartCard id="level-fungs" title="Level Fungsional Tertentu" {expandedId} onToggle={toggleExpand} height="h-44" expandedHeight="h-[400px]" center>
				<Chart type="doughnut" data={fungsionalLevelChartData} options={donut} />
			</ChartCard>
			<ChartCard id="jab-perb" title="Jabatan Perbendaharaan" subtitle="per Golongan" {expandedId} onToggle={toggleExpand} height="h-44" expandedHeight="h-[400px]">
				<Chart type="bar" data={jabPerbChartData} options={bar} />
			</ChartCard>
			<ChartCard id="fungs-tertentu" title="Jenis Jabatan Fungsional Tertentu" subtitle="(tanpa level ahli)" {expandedId} onToggle={toggleExpand} height="h-72" expandedHeight="h-[560px]">
				<Chart type="bar" data={fungsionalTertentuChartData} options={hbar} />
			</ChartCard>
			<ChartCard id="fungs-umum" title="Jabatan Fungsional Umum" {expandedId} onToggle={toggleExpand} height="h-72" expandedHeight="h-[420px]">
				<Chart type="bar" data={fungsionalUmumChartData} options={hbar} />
			</ChartCard>
		</div>
	</div>

	<!-- SECTION 5: Sub Unit & Gender -->
	<div>
		<p class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Sub Unit & Gender</p>
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			<ChartCard id="subunit" title="Jumlah Pegawai per Sub Unit" {expandedId} onToggle={toggleExpand} height="h-56" expandedHeight="h-[500px]">
				<Chart type="bar" data={subUnitChartData} options={hbar} />
			</ChartCard>
			<ChartCard id="gender-subunit" title="Gender per Sub Unit" {expandedId} onToggle={toggleExpand} height="h-56" expandedHeight="h-[500px]">
				<Chart type="bar" data={genderPerSubUnitChartData} options={hbarLegend} />
			</ChartCard>
		</div>
	</div>

	<!-- Insights -->
	<section class="bg-blue-50 border border-blue-100 rounded-xl p-5">
		<h2 class="text-sm font-semibold text-blue-800 mb-3">Insight Otomatis</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2 text-xs text-blue-900">
			{#if dominantTipe}
				<p>▶ Tipe terbanyak: <strong>{dominantTipe[0]}</strong> ({dominantTipe[1]} org, {Math.round((dominantTipe[1]/stats.total)*100)}%)</p>
			{/if}
			<p>▶ Rasio gender: <strong>{male} L ({Math.round((male/stats.total)*100)}%)</strong> vs <strong>{female} P ({Math.round((female/stats.total)*100)}%)</strong></p>
			<p>▶ Lokasi: <strong>{yogya} di Yogyakarta</strong> ({Math.round((yogya/stats.total)*100)}%) · <strong>{smg} di Semarang</strong> ({Math.round((smg/stats.total)*100)}%)</p>
			{#if dominantGolongan}
				<p>▶ Golongan terbanyak: <strong>{dominantGolongan[0]}</strong> ({dominantGolongan[1]} org)</p>
			{/if}
			<p>▶ Usia rata-rata <strong>{avgAge()} tahun</strong>, kelompok terbanyak usia <strong>{dominantAge}</strong> ({ageCounts()[dominantAge]} org)</p>
			{#if largestUnit}
				<p>▶ Sub unit terbesar: <strong>{shortenSubUnit(largestUnit[0])}</strong> ({largestUnit[1]} org)</p>
			{/if}
			{#if dominantFungsionalTertentu}
				<p>▶ Fungsional Tertentu terbanyak: <strong>{dominantFungsionalTertentu[0]}</strong> ({dominantFungsionalTertentu[1]} org)</p>
			{/if}
			<p>▶ <strong>{jabatanKategoriCounts().fungsional_tertentu}</strong> Fungsional Tertentu · <strong>{jabatanKategoriCounts().fungsional_umum}</strong> Fungsional Umum · <strong>{jabatanKategoriCounts().struktural}</strong> Struktural</p>
			<p>▶ <strong>{stats.jabatanPerbendaharaanCount}</strong> pemegang jabatan perbendaharaan</p>
		</div>
	</section>

	<!-- Data Table -->
	<section>
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
			<h2 class="text-sm font-semibold text-gray-700">Tabel Data Pegawai</h2>
			<span class="text-xs text-gray-500">{filtered.length} dari {stats.total} pegawai</span>
		</div>

		<div class="bg-white rounded-xl shadow p-3 mb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
			<input type="text" placeholder="Cari nama, NIP, jabatan..."
				bind:value={search}
				class="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300" />
			<select bind:value={filterTipe} class="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white">
				<option value="">Semua Tipe</option>
				{#each tipeOptions as t}<option value={t}>{t}</option>{/each}
			</select>
			<select bind:value={filterLokasi} class="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white">
				<option value="">Semua Lokasi</option>
				{#each lokasiOptions as l}<option value={l}>{l}</option>{/each}
			</select>
			<select bind:value={filterSubUnit} class="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white">
				<option value="">Semua Sub Unit</option>
				{#each subUnitOptions as u}<option value={u}>{u.length > 40 ? u.slice(0,40)+'…' : u}</option>{/each}
			</select>
		</div>
		{#if search || filterTipe || filterLokasi || filterSubUnit}
			<div class="mb-2">
				<button onclick={() => { search=''; filterTipe=''; filterLokasi=''; filterSubUnit=''; }}
					class="text-xs text-blue-600 hover:underline">Reset filter</button>
			</div>
		{/if}

		<div class="bg-white rounded-xl shadow overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full text-xs">
					<thead class="bg-blue-900 text-white uppercase tracking-wide">
						<tr>
							<th class="px-3 py-2 text-left w-8">No</th>
							<th class="px-3 py-2 text-left min-w-44">Nama</th>
							<th class="px-3 py-2 text-left">NIP / NRP</th>
							<th class="px-3 py-2 text-left">Tipe</th>
							<th class="px-3 py-2 text-left">Gol.</th>
							<th class="px-3 py-2 text-left min-w-44">Jabatan</th>
							<th class="px-3 py-2 text-left">Kat. Jabatan</th>
							<th class="px-3 py-2 text-left min-w-36">Sub Unit</th>
							<th class="px-3 py-2 text-left">Lokasi</th>
							<th class="px-3 py-2 text-left">Jabatan Perbendaharaan</th>
						</tr>
					</thead>
					<tbody>
						{#each filtered as emp, i (emp.id)}
							{@const katJabatan = kategorisasiJabatan(emp.jabatan ?? '')}
							{@const lokasiLabel = LOKASI_DISPLAY[emp.lokasi_berkantor] ?? emp.lokasi_berkantor}
							<tr class={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
								<td class="px-3 py-2 text-gray-400">{i + 1}</td>
								<td class="px-3 py-2 font-medium text-gray-900">{emp.nama}</td>
								<td class="px-3 py-2 text-gray-500 font-mono">{emp.nip_nrp ?? '-'}</td>
								<td class="px-3 py-2">
									<span class="px-1.5 py-0.5 rounded-full font-medium
										{emp.employee_type === 'PNS' ? 'bg-blue-100 text-blue-700' :
										 emp.employee_type === 'PPPK' ? 'bg-emerald-100 text-emerald-700' :
										 emp.employee_type === 'PPPK_PARUH_WAKTU' ? 'bg-indigo-100 text-indigo-700' :
										 emp.employee_type === 'CPNS' ? 'bg-amber-100 text-amber-700' :
										 'bg-gray-100 text-gray-700'}">
										{emp.employee_type.replace('_', ' ')}
									</span>
								</td>
								<td class="px-3 py-2 text-gray-700 font-mono">{emp.golongan ?? '-'}</td>
								<td class="px-3 py-2 text-gray-700 leading-snug">{normaliseJabatan(emp.jabatan ?? '-')}</td>
								<td class="px-3 py-2">
									<span class="px-1.5 py-0.5 rounded-full font-medium
										{katJabatan === 'struktural' ? 'bg-violet-100 text-violet-700' :
										 katJabatan === 'fungsional_tertentu' ? 'bg-cyan-100 text-cyan-700' :
										 'bg-slate-100 text-slate-600'}">
										{katJabatan === 'struktural' ? 'Struktural' :
										 katJabatan === 'fungsional_tertentu' ? 'Fungs. Tertentu' : 'Fungs. Umum'}
									</span>
								</td>
								<td class="px-3 py-2 text-gray-500 leading-snug">{shortenSubUnit(emp.sub_unit ?? '-')}</td>
								<td class="px-3 py-2">
									<span class="px-1.5 py-0.5 rounded-full font-medium
										{lokasiLabel === 'Yogyakarta' ? 'bg-sky-100 text-sky-700' : 'bg-orange-100 text-orange-700'}">
										{lokasiLabel}
									</span>
								</td>
								<td class="px-3 py-2 text-gray-500">{emp.jabatan_perbendaharaan ?? '-'}</td>
							</tr>
						{/each}
						{#if filtered.length === 0}
							<tr><td colspan="10" class="px-3 py-10 text-center text-gray-400">Tidak ada data sesuai filter.</td></tr>
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	</section>

	<footer class="text-center text-xs text-gray-400 pb-4">
		Balai Pelaksana Penyediaan Perumahan dan Kawasan Permukiman Jawa III
	</footer>
</main>
