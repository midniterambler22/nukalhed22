import { describe, expect, it } from 'vitest';
import { computeChromagram, computeOnsetEnvelope } from './features';

const SAMPLE_RATE = 22050;

function tone(frequencies: number[], seconds: number): Float32Array {
	const out = new Float32Array(Math.round(seconds * SAMPLE_RATE));
	for (let i = 0; i < out.length; i++) {
		for (const f of frequencies)
			out[i] = (out[i] ?? 0) + 0.2 * Math.sin((2 * Math.PI * f * i) / SAMPLE_RATE);
	}
	return out;
}

function strongest(chroma: Float64Array, count: number): number[] {
	return Array.from(chroma.keys())
		.sort((a, b) => (chroma[b] ?? 0) - (chroma[a] ?? 0))
		.slice(0, count)
		.sort((a, b) => a - b);
}

describe('computeChromagram', () => {
	it('puts A440 in pitch class A (9)', () => {
		const { frames } = computeChromagram(tone([440], 1), SAMPLE_RATE);
		expect(strongest(frames[5] ?? new Float64Array(12), 1)).toEqual([9]);
	});

	it('shows a C major triad as C, E and G (0, 4, 7)', () => {
		const { frames } = computeChromagram(tone([261.63, 329.63, 392.0], 1), SAMPLE_RATE);
		expect(strongest(frames[5] ?? new Float64Array(12), 3)).toEqual([0, 4, 7]);
	});

	it('runs about 21 frames per second and reports loudness', () => {
		const result = computeChromagram(tone([440], 2), SAMPLE_RATE);
		expect(result.frameRate).toBeCloseTo(21.5, 0);
		expect(result.rms[10]).toBeCloseTo(0.2 / Math.SQRT2, 2);
	});
});

describe('computeOnsetEnvelope', () => {
	it('peaks where clicks start, at 100 frames per second', () => {
		const samples = new Float32Array(SAMPLE_RATE * 2);
		for (const at of [0.5, 1.0, 1.5]) {
			const start = Math.round(at * SAMPLE_RATE);
			for (let i = 0; i < 200; i++) samples[start + i] = Math.sin(i) * Math.exp(-i / 50);
		}
		const { frameRate, values } = computeOnsetEnvelope(samples, SAMPLE_RATE);
		expect(frameRate).toBeCloseTo(100, 0);
		const peaks = Array.from(values.keys()).filter(
			(i) =>
				(values[i] ?? 0) > 0.5 * Math.max(...values) &&
				(values[i] ?? 0) >= (values[i - 1] ?? 0) &&
				(values[i] ?? 0) > (values[i + 1] ?? 0),
		);
		expect(peaks.map((p) => p / frameRate)).toEqual([
			expect.closeTo(0.5, 1),
			expect.closeTo(1.0, 1),
			expect.closeTo(1.5, 1),
		]);
	});

	it('is zero for silence', () => {
		const { values } = computeOnsetEnvelope(new Float32Array(SAMPLE_RATE), SAMPLE_RATE);
		expect(Math.max(...values)).toBe(0);
	});
});
