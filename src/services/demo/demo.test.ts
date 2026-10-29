import { describe, expect, it } from 'vitest';
import { decodeWavForTest } from './wav.test-helpers';
import { createDemoSongFile, DEMO_SONG, encodeWav } from '.';

describe('encodeWav', () => {
	it('writes a mono 16-bit PCM header and clamps samples', () => {
		const wav = encodeWav(Float32Array.from([0, 0.5, -1, 2]), 8000);
		const { sampleRate, channels, bits, samples } = decodeWavForTest(wav);
		expect({ sampleRate, channels, bits }).toEqual({ sampleRate: 8000, channels: 1, bits: 16 });
		expect(samples).toEqual([0, 16383, -32768, 32767]);
	});
});

describe('demo song', () => {
	it('is a WAV file as long as its score: 24 bars of 4 beats at 100 BPM, plus a second of tail', async () => {
		const file = createDemoSongFile();
		expect(file.name).toMatch(/\.wav$/);
		expect(file.type).toBe('audio/wav');
		const { sampleRate, samples } = decodeWavForTest(await file.arrayBuffer());
		expect(sampleRate).toBe(DEMO_SONG.sampleRate);
		const seconds = samples.length / sampleRate;
		const bars = DEMO_SONG.chords.length * DEMO_SONG.repeats;
		expect(seconds).toBeCloseTo((bars * 4 * 60) / DEMO_SONG.bpm + 1, 1);
	});
});
