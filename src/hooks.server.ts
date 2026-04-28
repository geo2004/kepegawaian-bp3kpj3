import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import { verifySessionToken, isAdminNip, SESSION_COOKIE } from '$lib/server/auth';
import { getEmployees } from '$lib/server/db';

// Routes that do NOT require a login
const PUBLIC_PATHS = ['/login', '/auth/logout'];

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE);
	const session = token ? verifySessionToken(token) : null;

	if (session) {
		// Hydrate user name from current employee data
		const employees = await getEmployees({ activeOnly: true });
		const employee = employees.find((e) => e.nip_nrp === session.nip);
		event.locals.user = employee
			? { nip: session.nip, nama: employee.nama }
			: { nip: session.nip, nama: session.nip };
		event.locals.isAdmin = isAdminNip(session.nip);
	} else {
		event.locals.user = null;
		event.locals.isAdmin = false;
	}

	const path = event.url.pathname;

	// Redirect logged-in users away from login page
	if (path === '/login' && event.locals.user) {
		throw redirect(303, event.locals.isAdmin ? '/admin' : '/analytics');
	}

	// Protect all non-public routes — must be logged in
	if (!PUBLIC_PATHS.includes(path) && !path.startsWith('/login') && !event.locals.user) {
		throw redirect(303, '/login');
	}

	// Protect admin routes — must be admin
	if (path.startsWith('/admin') && !event.locals.isAdmin) {
		throw redirect(303, '/analytics');
	}

	return resolve(event);
};
