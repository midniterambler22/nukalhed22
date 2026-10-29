/** Reads back what `encodeWav` wrote. Tests only. */
export function decodeWavForTest(buffer: ArrayBuffer) {
	const view = new DataView(buffer);
	const text = (offset: number) => String.fromCharCode(...new Uint8Array(buffer, offset, 4));
	if (text(0) !== 'RIFF' || text(8) !== 'WAVE' || text(36) !== 'data') {
		throw new Error('Not a WAV file this helper understands');
	}
	const count = view.getUint32(40, true) / 2;
	const samples: number[] = [];
	for (let i = 0; i < count; i++) samples.push(view.getInt16(44 + i * 2, true));
	return {
		channels: view.getUint16(22, true),
		sampleRate: view.getUint32(24, true),
		bits: view.getUint16(34, true),
		samples,
	};
}
