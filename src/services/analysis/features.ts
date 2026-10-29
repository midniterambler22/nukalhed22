import { magnitudeFrames } from './fft';

/**
 * Spectral features for analysis: a chromagram (energy per pitch class over time)
 * and an onset-strength envelope (how much new sound starts in each frame).
 */

export interface Chromagram {
	/** Frames per second. */
	frameRate: number;
	/** 12 values per frame, C = 0 … B = 11, log-compressed energy. */
	frames: Float64Array[];
	/** Loudness of each frame (RMS of the samples it covers). */
	rms: Float64Array;
}

export interface OnsetEnvelope {
	frameRate: number;
	/** Onset strength per frame, ≥ 0. */
	values: Float64Array;
}

/** Lowest and highest MIDI notes folded into the chromagram: G2 to B6. */
export const CHROMA_MIDI_RANGE = [43, 95] as const;

const LOG_GAIN = 100;

function nextPowerOfTwo(n: number): number {
	return 2 ** Math.ceil(Math.log2(Math.max(2, n)));
}

/**
 * Bin → (note, weight) pairs for bins inside the chroma range. High notes span more
 * FFT bins than low ones, so each note's weights are scaled to sum to 1; otherwise
 * noise would look like it favours some pitch classes.
 */
function chromaMap(size: number, sampleRate: number) {
	const bins: number[] = [];
	const notes: number[] = [];
	const weights: number[] = [];
	const [low, high] = CHROMA_MIDI_RANGE;
	const totals = new Float64Array(high - low + 1);
	for (let k = 1; k <= size / 2; k++) {
		const frequency = (k * sampleRate) / size;
		const midi = 69 + 12 * Math.log2(frequency / 440);
		const nearest = Math.round(midi);
		if (nearest < low || nearest > high) continue;
		// Full weight at the note's centre, none half a semitone away.
		const weight = 1 - 2 * Math.abs(midi - nearest);
		if (weight <= 0) continue;
		bins.push(k);
		notes.push(nearest);
		weights.push(weight);
		totals[nearest - low] = (totals[nearest - low] ?? 0) + weight;
	}
	return {
		bins,
		classes: notes.map((n) => n % 12),
		weights: weights.map((w, i) => w / (totals[(notes[i] ?? 0) - low] ?? 0)),
	};
}

export function computeChromagram(samples: Float32Array, sampleRate: number): Chromagram {
	// ~186 ms windows resolve semitones down to about G2; ~46 ms hop.
	const size = nextPowerOfTwo(0.18 * sampleRate);
	const hop = size / 4;
	const { bins, classes, weights } = chromaMap(size, sampleRate);
	const frames: Float64Array[] = [];
	const rmsValues: number[] = [];
	magnitudeFrames(samples, size, hop, (index, mags) => {
		const chroma = new Float64Array(12);
		for (let i = 0; i < bins.length; i++) {
			chroma[classes[i] ?? 0] =
				(chroma[classes[i] ?? 0] ?? 0) +
				(weights[i] ?? 0) * Math.log1p((LOG_GAIN * (mags[bins[i] ?? 0] ?? 0)) / size);
		}
		frames.push(chroma);
		const start = Math.max(0, index * hop - hop / 2);
		const end = Math.min(samples.length, index * hop + hop / 2);
		let sum = 0;
		for (let s = start; s < end; s++) sum += (samples[s] ?? 0) * (samples[s] ?? 0);
		rmsValues.push(end > start ? Math.sqrt(sum / (end - start)) : 0);
	});
	return { frameRate: sampleRate / hop, frames, rms: Float64Array.from(rmsValues) };
}

/** Number of log-spaced bands the onset detector listens to. */
const ONSET_BANDS = 36;
const ONSET_LOW_HZ = 30;

/**
 * Spectral flux over log-spaced bands, sampled about every 10 ms. Bands keep the
 * many high-frequency bins of cymbals and noise from drowning out bass, kick drum
 * and chord attacks.
 */
export function computeOnsetEnvelope(samples: Float32Array, sampleRate: number): OnsetEnvelope {
	const size = nextPowerOfTwo(0.046 * sampleRate);
	const hop = Math.max(1, Math.round(sampleRate / 100));
	const nyquist = sampleRate / 2;
	const bandOf = new Int32Array(size / 2 + 1).fill(-1);
	const bandSize = new Float64Array(ONSET_BANDS);
	for (let k = 1; k <= size / 2; k++) {
		const frequency = (k * sampleRate) / size;
		if (frequency < ONSET_LOW_HZ) continue;
		const band = Math.min(
			ONSET_BANDS - 1,
			Math.floor(
				(ONSET_BANDS * Math.log(frequency / ONSET_LOW_HZ)) /
					Math.log(nyquist / ONSET_LOW_HZ),
			),
		);
		bandOf[k] = band;
		bandSize[band] = (bandSize[band] ?? 0) + 1;
	}
	const level = new Float64Array(ONSET_BANDS);
	const previous = new Float64Array(ONSET_BANDS);
	const values: number[] = [];
	magnitudeFrames(samples, size, hop, (index, mags) => {
		level.fill(0);
		for (let k = 1; k < mags.length; k++) {
			const band = bandOf[k] ?? 0;
			if (band >= 0) level[band] = (level[band] ?? 0) + (mags[k] ?? 0) / size;
		}
		let flux = 0;
		for (let b = 0; b < ONSET_BANDS; b++) {
			if (bandSize[b] === 0) continue;
			const value = Math.log1p(LOG_GAIN * ((level[b] ?? 0) / (bandSize[b] ?? 0)));
			if (index > 0 && value > (previous[b] ?? 0)) flux += value - (previous[b] ?? 0);
			previous[b] = value;
		}
		values.push(flux);
	});
	return { frameRate: sampleRate / hop, values: Float64Array.from(values) };
}
