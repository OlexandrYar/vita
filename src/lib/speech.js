/** @param {string} text */
export function speak(text) {
	if (!('speechSynthesis' in window)) return;
	window.speechSynthesis.cancel();
	const utt = new SpeechSynthesisUtterance(text);
	utt.lang = 'la';
	window.speechSynthesis.speak(utt);
}
