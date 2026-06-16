import { redirect } from '@sveltejs/kit';

/** @type {import('@sveltejs/kit').RequestHandler} */
export function POST({ cookies }) {
	cookies.delete('vita_auth', { path: '/' });
	throw redirect(303, '/login');
}
