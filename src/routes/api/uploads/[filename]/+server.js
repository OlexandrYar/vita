import fs from 'fs';
import path from 'path';
import { UPLOADS_DIR } from '$lib/server/storage.js';

const MIME = /** @type {Record<string, string>} */ ({
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.avif': 'image/avif'
});

/** @type {import('@sveltejs/kit').RequestHandler} */
export function GET({ params }) {
	const raw = params.filename ?? '';
	const safe = path.basename(raw);
	if (!safe || safe !== raw) {
		return new Response('Forbidden', { status: 403 });
	}

	const filePath = path.join(UPLOADS_DIR, safe);

	if (!fs.existsSync(filePath)) {
		return new Response('Not Found', { status: 404 });
	}

	const ext = path.extname(safe).toLowerCase();
	const contentType = MIME[ext] ?? 'application/octet-stream';
	const buffer = fs.readFileSync(filePath);

	return new Response(buffer, {
		headers: {
			'Content-Type': contentType,
			'Cache-Control': 'public, max-age=31536000, immutable'
		}
	});
}
