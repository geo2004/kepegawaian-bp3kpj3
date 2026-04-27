import { createHmac, timingSafeEqual } from 'crypto';
import { ADMIN_NIP, SESSION_SECRET } from '$env/static/private';
import { getEmployees } from '$lib/server/db';

export const SESSION_COOKIE = 'kepegawaian_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

function sign(payload: string): string {
	return createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
}

export function createSessionToken(nip: string): string {
	const expires = Date.now() + SESSION_TTL_MS;
	const payload = `${nip}:${expires}`;
	const sig = sign(payload);
	return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

export function verifySessionToken(token: string): { nip: string } | null {
	try {
		const decoded = Buffer.from(token, 'base64url').toString('utf-8');
		const lastColon = decoded.lastIndexOf(':');
		const payload = decoded.slice(0, lastColon);
		const sig = decoded.slice(lastColon + 1);

		const expected = sign(payload);
		if (!timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null;

		const colonIdx = payload.indexOf(':');
		const nip = payload.slice(0, colonIdx);
		const expires = parseInt(payload.slice(colonIdx + 1));
		if (Date.now() > expires) return null;

		return { nip };
	} catch {
		return null;
	}
}

/** Check NIP exists in employee data and password matches NIP */
export function checkNipLogin(nip: string, password: string): { nip: string; nama: string } | null {
	if (!nip || !password) return null;
	const employees = getEmployees({ activeOnly: true });
	const employee = employees.find((e) => e.nip_nrp === nip);
	if (!employee) return null;
	try {
		if (!timingSafeEqual(Buffer.from(password), Buffer.from(nip))) return null;
	} catch {
		return null;
	}
	return { nip: employee.nip_nrp!, nama: employee.nama };
}

export function isAdminNip(nip: string): boolean {
	return nip === ADMIN_NIP;
}
