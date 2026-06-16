// Speech playback. Primary path is the server-side ElevenLabs endpoint
// (`/api/speech`), which returns natural neural audio. If that endpoint is not
// configured (no API key) or fails, we fall back to the browser's built-in voice
// so the feature still works offline.

/** @type {HTMLAudioElement | null} */
let audioEl = null;

// Remember whether the server endpoint is usable so we don't keep retrying it
// once we know it's unavailable. null = unknown yet.
/** @type {boolean | null} */
let serverAvailable = null;

/** @param {string} text */
function browserSpeak(text) {
	if (!('speechSynthesis' in window)) return;
	window.speechSynthesis.cancel();
	const utt = new SpeechSynthesisUtterance(text);
	// Italian is the closest widely-installed voice to botanical Latin.
	const voices = window.speechSynthesis.getVoices();
	const it = voices.find((v) => v.lang.toLowerCase().startsWith('it'));
	if (it) {
		utt.voice = it;
		utt.lang = it.lang;
	} else {
		utt.lang = 'it-IT';
	}
	utt.rate = 0.85;
	utt.pitch = 0.95;
	window.speechSynthesis.speak(utt);
}

/** @param {string} text */
async function serverSpeak(text) {
	const res = await fetch('/api/speech', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ text })
	});

	if (!res.ok) {
		// 503 = not configured; any error → mark server unusable and fall back.
		serverAvailable = false;
		throw new Error(`speech endpoint returned ${res.status}`);
	}

	serverAvailable = true;
	const blob = await res.blob();
	const url = URL.createObjectURL(blob);

	if (audioEl) {
		audioEl.pause();
	}
	audioEl = new Audio(url);
	// Release the object URL once playback ends to avoid leaking memory.
	audioEl.addEventListener('ended', () => URL.revokeObjectURL(url), { once: true });
	await audioEl.play();
}

/** @param {string} text */
export async function speak(text) {
	if (!text || typeof window === 'undefined') return;

	// Stop any browser speech already in progress.
	if ('speechSynthesis' in window) window.speechSynthesis.cancel();

	// If we already learned the server isn't available, skip straight to fallback.
	if (serverAvailable === false) {
		browserSpeak(text);
		return;
	}

	try {
		await serverSpeak(text);
	} catch {
		browserSpeak(text);
	}
}
