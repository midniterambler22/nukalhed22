import { describe, expect, it } from 'vitest';
import { computePeaks, normalizePeaks } from './peaks';

describe('computePeaks', () => {
	it('returns the loudest absolute sample in each equal span', () => {
		const samples = Float32Array.from([0.1, -0.5, 0.2, 0.3, -0.9, 0.4, 0, 0.05]);
		expect(computePeaks(samples, 4)).toEqual([0.5, 0.3, 0.9, 0.05].map((v) => Math.fround(v)));
	});

	it('covers every sample when the length does not divide evenly', () => {
		const samples = Float32Array.from([0, 0, 0, 0, 0, 0, 0, 1]);
		const peaks = computePeaks(samples, 3);
		expect(peaks).toHaveLength(3);
		expect(peaks[2]).toBe(1);
	});

	it('returns at most one bucket per sample', () => {
		expect(computePeaks(Float32Array.from([0.5, -0.25]), 10)).toEqual([0.5, 0.25]);
	});

	it('caps clipped samples at 1', () => {
		expect(computePeaks(Float32Array.from([1.7, -2]), 1)).toEqual([1]);
	});

	it('returns nothing for empty input or a bad bucket count', () => {
		expect(computePeaks(new Float32Array(0), 10)).toEqual([]);
		expect(computePeaks(Float32Array.from([1]), 0)).toEqual([]);
		expect(computePeaks(Float32Array.from([1]), 1.5)).toEqual([]);
	});
});

describe('normalizePeaks', () => {
	it('scales the loudest peak to 1', () => {
		expect(normalizePeaks([0.05, 0.1, 0.025])).toEqual([0.5, 1, 0.25]);
	});

	it('leaves silence flat', () => {
		expect(normalizePeaks([0, 0])).toEqual([0, 0]);
		expect(normalizePeaks([])).toEqual([]);
	});
});
