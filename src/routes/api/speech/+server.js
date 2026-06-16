import { json } from '@sveltejs/kit';

// ElevenLabs config — all read server-side so the API key never reaches the browser.
const API_KEY = process.env.ELEVENLABS_API_KEY ?? '';
// Default voice: "Rachel", a stock voice available on every ElevenLabs account.
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? '21m00Tcm4TlvDq8ikWAM';
// Multilingual model — needed for correct Latin / Italian-style pronunciation.
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID ?? 'eleven_multilingual_v2';

// Small in-memory cache so repeating the same name doesn't burn API quota.
/** @type {Map<string, ArrayBuffer>} */
const cache = new Map();
const CACHE_LIMIT = 200;

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function POST({ request }) {
	if (!API_KEY) {
		// Not configured — tell the client so it can fall back to the browser voice.
		return json({ error: 'TTS not configured' }, { status: 503 });
	}

	/** @type {{ text?: unknown }} */
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const text = typeof body.text === 'string' ? body.text.trim() : '';
	if (!text) {
		return json({ error: 'Text is required' }, { status: 400 });
	}
	if (text.length > 500) {
		return json({ error: 'Text too long' }, { status: 400 });
	}

	const cacheKey = `${VOICE_ID}:${text}`;
	const cached = cache.get(cacheKey);
	if (cached) {
		return new Response(cached, {
			headers: { 'Content-Type': 'audio/mpeg', 'X-Cache': 'HIT' }
		});
	}

	let res;
	try {
		res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
			method: 'POST',
			headers: {
				'xi-api-key': API_KEY,
				'Content-Type': 'application/json',
				Accept: 'audio/mpeg'
			},
			body: JSON.stringify({
				text,
				model_id: MODEL_ID,
				voice_settings: { stability: 0.5, similarity_boost: 0.75 }
			})
		});
	} catch {
		return json({ error: 'TTS upstream unreachable' }, { status: 502 });
	}

	if (!res.ok) {
		const detail = await res.text().catch(() => '');
		return json({ error: 'TTS request failed', detail }, { status: 502 });
	}

	const audio = await res.arrayBuffer();

	// Maintain a simple bounded cache (drop oldest entry when full).
	if (cache.size >= CACHE_LIMIT) {
		const oldest = cache.keys().next().value;
		if (oldest !== undefined) cache.delete(oldest);
	}
	cache.set(cacheKey, audio);

	return new Response(audio, {
		headers: { 'Content-Type': 'audio/mpeg', 'X-Cache': 'MISS' }
	});
}
