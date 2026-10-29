/**
 * Encodes mono samples (-1…1) as a 16-bit PCM WAV file, so audio made in the browser
 * can go through the same file → playback → decode path as a song the user chooses.
 */
export function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
	const bytesPerSample = 2;
	const dataSize = samples.length * bytesPerSample;
	const buffer = new ArrayBuffer(44 + dataSize);
	const view = new DataView(buffer);
	const ascii = (offset: number, text: string) => {
		for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
	};

	ascii(0, 'RIFF');
	view.setUint32(4, 36 + dataSize, true);
	ascii(8, 'WAVE');
	ascii(12, 'fmt ');
	view.setUint32(16, 16, true); // fmt chunk size
	view.setUint16(20, 1, true); // PCM
	view.setUint16(22, 1, true); // mono
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * bytesPerSample, true);
	view.setUint16(32, bytesPerSample, true);
	view.setUint16(34, 16, true);
	ascii(36, 'data');
	view.setUint32(40, dataSize, true);

	for (let i = 0; i < samples.length; i++) {
		const v = Math.max(-1, Math.min(1, samples[i] ?? 0));
		view.setInt16(44 + i * bytesPerSample, v < 0 ? v * 0x8000 : v * 0x7fff, true);
	}
	return buffer;
}
