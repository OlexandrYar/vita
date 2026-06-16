import { redirect, fail } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { AUTH_COOKIE, AUTH_TOKEN, PASSWORD } from '$lib/server/auth.js';

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const password = data.get('password');

		if (password !== PASSWORD) {
			return fail(400, { error: 'Невірний пароль' });
		}

		cookies.set(AUTH_COOKIE, AUTH_TOKEN, {
			path: '/',
			maxAge: 60 * 60 * 24 * 30,
			httpOnly: true,
			secure: !dev,
			sameSite: 'strict'
		});

		throw redirect(303, '/');
	}
};
