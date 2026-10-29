import { describe, expect, it } from 'vitest';
import { createFftPlan, fft, hannWindow, isPowerOfTwo, magnitudeFrames } from './fft';

describe('fft', () => {
	it('puts a whole-cycle sine in its own bin', () => {
		const size = 64;
		const re = Float64Array.from({ length: size }, (_, i) =>
			Math.sin((2 * Math.PI * 5 * i) / size),
		);
		const im = new Float64Array(size);
		fft(createFftPlan(size), re, im);
		const mags = Array.from({ length: size / 2 }, (_, k) => Math.hypot(re[k] ?? 0, im[k] ?? 0));
		expect(mags[5]).toBeCloseTo(size / 2, 6);
		mags.forEach((m, k) => {
			if (k !== 5) expect(m).toBeLessThan(1e-9);
		});
	});

	it('keeps energy (Parseval)', () => {
		const size = 128;
		const signal = Array.from(
			{ length: size },
			(_, i) => Math.cos(i * 0.37) + 0.5 * Math.sin(i * 1.9),
		);
		const re = Float64Array.from(signal);
		const im = new Float64Array(size);
		fft(createFftPlan(size), re, im);
		const time = signal.reduce((s, x) => s + x * x, 0);
		let freq = 0;
		for (let k = 0; k < size; k++) freq += (re[k] ?? 0) ** 2 + (im[k] ?? 0) ** 2;
		expect(freq / size).toBeCloseTo(time, 8);
	});

	it('only accepts powers of two', () => {
		expect(isPowerOfTwo(1024)).toBe(true);
		expect(isPowerOfTwo(1000)).toBe(false);
		expect(() => createFftPlan(100)).toThrow(RangeError);
	});

	it('Hann window is 0 at the edge and 1 in the middle', () => {
		const w = hannWindow(8);
		expect(w[0]).toBe(0);
		expect(w[4]).toBeCloseTo(1, 12);
	});

	it('frames cover the signal, centred on multiples of the hop', () => {
		const seen: number[] = [];
		const count = magnitudeFrames(new Float32Array(1000), 256, 100, (i) => seen.push(i));
		expect(count).toBe(10);
		expect(seen).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
	});
});
