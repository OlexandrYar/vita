import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import { DATA_FILE, UPLOADS_DIR } from '$lib/server/storage.js';

/** @typedef {{ id: number, name: string, latinName?: string, imageUrl: string }} Plant */

function readPlants() {
	if (!fs.existsSync(DATA_FILE)) return /** @type {Plant[]} */ ([]);
	try {
		return /** @type {Plant[]} */ (JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')));
	} catch {
		return /** @type {Plant[]} */ ([]);
	}
}

/** @param {Plant[]} plants */
function writePlants(plants) {
	fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
	fs.writeFileSync(DATA_FILE, JSON.stringify(plants, null, 2));
}

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function PATCH({ params, request }) {
	const id = Number(params.id);
	const plants = readPlants();
	const idx = plants.findIndex((p) => p.id === id);

	if (idx === -1) {
		return json({ error: 'Not found' }, { status: 404 });
	}

	const formData = await request.formData();
	const name = formData.get('name');
	const latinName = formData.get('latinName');
	const file = formData.get('image');

	if (typeof name !== 'string' || !name.trim()) {
		return json({ error: 'Назва обов\'язкова' }, { status: 400 });
	}

	let { imageUrl } = plants[idx];

	if (file instanceof File && file.size > 0) {
		if (!file.type.startsWith('image/')) {
			return json({ error: 'Тільки зображення' }, { status: 400 });
		}

		// Remove old image file
		const oldFilename = path.basename(imageUrl);
		const oldPath = path.join(UPLOADS_DIR, oldFilename);
		if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

		// Save new image
		fs.mkdirSync(UPLOADS_DIR, { recursive: true });
		const ext = path.extname(file.name) || '.jpg';
		const filename = `${Date.now()}${ext}`;
		fs.writeFileSync(path.join(UPLOADS_DIR, filename), Buffer.from(await file.arrayBuffer()));
		imageUrl = `/api/uploads/${filename}`;
	}

	const updated = {
		...plants[idx],
		name: name.trim(),
		latinName: typeof latinName === 'string' ? latinName.trim() : (plants[idx].latinName ?? ''),
		imageUrl
	};

	plants[idx] = updated;
	writePlants(plants);

	return json(updated);
}

/** @type {import('@sveltejs/kit').RequestHandler} */
export function DELETE({ params }) {
	const id = Number(params.id);
	const plants = readPlants();
	const plant = plants.find((p) => p.id === id);

	if (!plant) {
		return json({ error: 'Not found' }, { status: 404 });
	}

	const filename = path.basename(plant.imageUrl);
	const filePath = path.join(UPLOADS_DIR, filename);
	if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

	writePlants(plants.filter((p) => p.id !== id));
	return json({ ok: true });
}
