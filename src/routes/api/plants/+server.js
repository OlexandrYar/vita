import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import { DATA_FILE, UPLOADS_DIR } from '$lib/server/storage.js';

function readPlants() {
	if (!fs.existsSync(DATA_FILE)) return [];
	try {
		return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
	} catch {
		return [];
	}
}

/** @param {object[]} plants */
function writePlants(plants) {
	fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
	fs.writeFileSync(DATA_FILE, JSON.stringify(plants, null, 2));
}

/** @type {import('@sveltejs/kit').RequestHandler} */
export function GET() {
	return json(readPlants());
}

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function POST({ request }) {
	const formData = await request.formData();
	const name = formData.get('name');
	const file = formData.get('image');

	if (typeof name !== 'string' || !name.trim()) {
		return json({ error: 'Назва обов\'язкова' }, { status: 400 });
	}

	if (!(file instanceof File)) {
		return json({ error: 'Файл обов\'язковий' }, { status: 400 });
	}

	if (!file.type.startsWith('image/')) {
		return json({ error: 'Тільки зображення' }, { status: 400 });
	}

	fs.mkdirSync(UPLOADS_DIR, { recursive: true });

	const ext = path.extname(file.name) || '.jpg';
	const filename = `${Date.now()}${ext}`;
	const buffer = Buffer.from(await file.arrayBuffer());
	fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);

	const latinName = formData.get('latinName');

	/** @type {{ id: number, name: string, latinName: string, imageUrl: string }[]} */
	const plants = readPlants();
	const plant = {
		id: Date.now() + 1,
		name: name.trim(),
		latinName: typeof latinName === 'string' ? latinName.trim() : '',
		imageUrl: `/api/uploads/${filename}`
	};
	plants.push(plant);
	writePlants(plants);

	return json(plant, { status: 201 });
}
