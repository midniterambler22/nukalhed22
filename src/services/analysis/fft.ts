/**
 * In-place radix-2 FFT. Small and dependency-free; analysis only needs magnitudes
 * of real frames, so this is all the transform code the module has.
 */

/** Precomputed tables for one FFT size. Reuse it for every frame of that size. */
export interface FftPlan {
	readonly size: number;
	readonly cos: Float64Array;
	readonly sin: Float64Array;
	readonly reversed: Uint32Array;
}

export function isPowerOfTwo(n: number): boolean {
	return Number.isInteger(n) && n > 0 && (n & (n - 1)) === 0;
}

export function createFftPlan(size: number): FftPlan {
	if (!isPowerOfTwo(size)) throw new RangeError(`FFT size must be a power of two, got ${size}`);
	const half = size / 2;
	const cos = new Float64Array(half);
	const sin = new Float64Array(half);
	for (let i = 0; i < half; i++) {
		cos[i] = Math.cos((2 * Math.PI * i) / size);
		sin[i] = -Math.sin((2 * Math.PI * i) / size);
	}
	const bits = Math.log2(size);
	const reversed = new Uint32Array(size);
	for (let i = 0; i < size; i++) {
		let r = 0;
		for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
		reversed[i] = r;
	}
	return { size, cos, sin, reversed };
}

/** Transforms `re` + i·`im` in place. Both arrays must have the plan's size. */
export function fft(plan: FftPlan, re: Float64Array, im: Float64Array): void {
	const { size, cos, sin, reversed } = plan;
	for (let i = 0; i < size; i++) {
		const j = reversed[i] ?? 0;
		if (j > i) {
			const tr = re[i] ?? 0;
			re[i] = re[j] ?? 0;
			re[j] = tr;
			const ti = im[i] ?? 0;
			im[i] = im[j] ?? 0;
			im[j] = ti;
		}
	}
	for (let len = 2; len <= size; len *= 2) {
		const half = len / 2;
		const step = size / len;
		for (let start = 0; start < size; start += len) {
			for (let k = 0; k < half; k++) {
				const wr = cos[k * step] ?? 0;
				const wi = sin[k * step] ?? 0;
				const a = start + k;
				const b = a + half;
				const xr = (re[b] ?? 0) * wr - (im[b] ?? 0) * wi;
				const xi = (re[b] ?? 0) * wi + (im[b] ?? 0) * wr;
				re[b] = (re[a] ?? 0) - xr;
				im[b] = (im[a] ?? 0) - xi;
				re[a] = (re[a] ?? 0) + xr;
				im[a] = (im[a] ?? 0) + xi;
			}
		}
	}
}

/** A periodic Hann window of the given length. */
export function hannWindow(size: number): Float64Array {
	const window = new Float64Array(size);
	for (let i = 0; i < size; i++) window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / size);
	return window;
}

/**
 * Magnitude spectra of overlapping windowed frames, bins 0…size/2.
 * Frame `i` is centred on sample `i * hop`; samples outside the signal count as silence.
 */
export function magnitudeFrames(
	samples: Float32Array,
	size: number,
	hop: number,
	onFrame: (index: number, magnitudes: Float64Array) => void,
): number {
	const plan = createFftPlan(size);
	const window = hannWindow(size);
	const re = new Float64Array(size);
	const im = new Float64Array(size);
	const mags = new Float64Array(size / 2 + 1);
	const frames = Math.max(1, Math.ceil(samples.length / hop));
	const half = size / 2;
	for (let f = 0; f < frames; f++) {
		const start = f * hop - half;
		for (let i = 0; i < size; i++) {
			const s = start + i;
			re[i] = s >= 0 && s < samples.length ? (samples[s] ?? 0) * (window[i] ?? 0) : 0;
			im[i] = 0;
		}
		fft(plan, re, im);
		for (let k = 0; k <= half; k++) mags[k] = Math.hypot(re[k] ?? 0, im[k] ?? 0);
		onFrame(f, mags);
	}
	return frames;
}
