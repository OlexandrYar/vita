import { redirect } from '@sveltejs/kit';
import { AUTH_COOKIE, AUTH_TOKEN } from '$lib/server/auth.js';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const path = event.url.pathname;

	if (path.startsWith('/login')) {
		return resolve(event);
	}

	const auth = event.cookies.get(AUTH_COOKIE);

	if (auth !== AUTH_TOKEN) {
		if (path.startsWith('/api/')) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' }
			});
		}
		throw redirect(303, '/login');
	}

	return resolve(event);
}
