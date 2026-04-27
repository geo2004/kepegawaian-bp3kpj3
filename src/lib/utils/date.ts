const BULAN: Record<string, number> = {
	januari: 0,
	februari: 1,
	maret: 2,
	april: 3,
	mei: 4,
	juni: 5,
	juli: 6,
	agustus: 7,
	september: 8,
	oktober: 9,
	november: 10,
	desember: 11
};

export function parseIndonesianDate(raw: string | null | undefined): string | null {
	if (!raw) return null;
	const match = raw
		.toString()
		.trim()
		.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/i);
	if (!match) return null;
	const [, day, monthStr, year] = match;
	const month = BULAN[monthStr.toLowerCase()];
	if (month === undefined) return null;
	const d = new Date(parseInt(year), month, parseInt(day));
	if (isNaN(d.getTime())) return null;
	return d.toISOString().split('T')[0];
}

export function formatTanggal(isoDate: string | null | undefined): string {
	if (!isoDate) return '-';
	const d = new Date(isoDate + 'T00:00:00');
	return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function getDaysUntil(isoDate: string | null | undefined): number | null {
	if (!isoDate) return null;
	const target = new Date(isoDate + 'T00:00:00');
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getCurrentMonthRange(): { start: string; end: string } {
	const now = new Date();
	const start = new Date(now.getFullYear(), now.getMonth(), 1);
	const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
	return {
		start: start.toISOString().split('T')[0],
		end: end.toISOString().split('T')[0]
	};
}
