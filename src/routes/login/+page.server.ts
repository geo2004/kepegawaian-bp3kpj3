import { fail } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { checkNipLogin, createSessionToken, isAdminNip, SESSION_COOKIE } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(303, locals.isAdmin ? '/admin' : '/analytics');
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const nip = (form.get('nip') as string)?.trim();
		const password = form.get('password') as string;

		if (!nip || !password) {
			return fail(400, { error: 'NIP dan password harus diisi.' });
		}

		const user = checkNipLogin(nip, password);
		if (!user) {
			return fail(401, { error: 'NIP atau password salah.' });
		}

		const token = createSessionToken(user.nip);
		cookies.set(SESSION_COOKIE, token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 8
		});

		throw redirect(303, isAdminNip(user.nip) ? '/admin' : '/analytics');
	}
};
