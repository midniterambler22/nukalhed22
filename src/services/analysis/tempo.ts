import { ramp, toConfidence } from './confidence';
import type { OnsetEnvelope } from './features';
import type { TempoEstimate } from './types';

/**
 * Tempo and beat tracking from an onset envelope: autocorrelation picks the beat
 * period, then dynamic programming places beats on strong onsets spaced close to
 * that period (Ellis 2007, "Beat tracking by dynamic programming").
 */

export const TEMPO_RANGE_BPM = [40, 220] as const;
/** Tempos near this are preferred when the beat could be heard at half or double speed. */
const PREFERRED_BPM = 120;
/** How strongly the beat tracker sticks to the estimated period. */
const TIGHTNESS = 100;

function movingAverage(values: Float64Array, radius: number): Float64Array {
	const out = new Float64Array(values.length);
	let sum = 0;
	let lo = 0;
	let hi = -1;
	for (let i = 0; i < values.length; i++) {
		while (hi < Math.min(values.length - 1, i + radius)) sum += values[++hi] ?? 0;
		while (lo < i - radius) sum -= values[lo++] ?? 0;
		out[i] = sum / (hi - lo + 1);
	}
	return out;
}

/** Removes slow loudness changes and scales the envelope to unit standard deviation. */
export function normalizeOnsets(onsets: OnsetEnvelope): Float64Array | null {
	const { values, frameRate } = onsets;
	const mean = movingAverage(values, Math.round(frameRate / 2));
	const out = new Float64Array(values.length);
	let sumSq = 0;
	for (let i = 0; i < values.length; i++) {
		const v = Math.max(0, (values[i] ?? 0) - (mean[i] ?? 0));
		out[i] = v;
		sumSq += v * v;
	}
	const std = Math.sqrt(sumSq / Math.max(1, values.length));
	if (!(std > 1e-6)) return null;
	for (let i = 0; i < out.length; i++) out[i] = (out[i] ?? 0) / std;
	return out;
}

function autocorrelation(values: Float64Array, maxLag: number): Float64Array {
	const ac = new Float64Array(maxLag + 1);
	const n = values.length;
	for (let lag = 0; lag <= maxLag && lag < n; lag++) {
		let sum = 0;
		for (let t = lag; t < n; t++) sum += (values[t] ?? 0) * (values[t - lag] ?? 0);
		ac[lag] = sum / (n - lag);
	}
	return ac;
}

interface PeriodEstimate {
	/** Beat period in envelope frames (fractional). */
	period: number;
	/** Autocorrelation at the period relative to lag 0, 0–1. */
	strength: number;
	/** How far the peak stands above the typical autocorrelation, 0–1. */
	contrast: number;
}

export function estimatePeriod(envelope: Float64Array, frameRate: number): PeriodEstimate | null {
	const [minBpm, maxBpm] = TEMPO_RANGE_BPM;
	const minLag = Math.floor((60 * frameRate) / maxBpm);
	const maxLag = Math.ceil((60 * frameRate) / minBpm);
	if (envelope.length < maxLag * 2) return null;
	const ac = autocorrelation(envelope, Math.min(envelope.length - 1, maxLag * 2 + 1));
	const zero = ac[0] ?? 0;
	if (!(zero > 0)) return null;

	const at = (lag: number) => ac[Math.round(lag)] ?? 0;
	let best = -Infinity;
	let bestLag = -1;
	const scores = new Float64Array(maxLag + 2);
	for (let lag = minLag; lag <= maxLag; lag++) {
		const bpm = (60 * frameRate) / lag;
		const prior = Math.exp(-0.5 * Math.log2(bpm / PREFERRED_BPM) ** 2);
		// A real beat period also lines up two beats later.
		const score = prior * (at(lag) + 0.5 * at(2 * lag));
		scores[lag] = score;
		if (score > best) {
			best = score;
			bestLag = lag;
		}
	}
	if (bestLag < 0) return null;

	// Parabolic interpolation around the peak for a sub-frame period.
	let period = bestLag;
	const left = scores[bestLag - 1];
	const right = scores[bestLag + 1];
	if (bestLag > minLag && bestLag < maxLag && left !== undefined && right !== undefined) {
		const denominator = left - 2 * best + right;
		if (denominator < 0) period = bestLag + (0.5 * (left - right)) / denominator;
	}

	const window = Array.from(ac.subarray(minLag, maxLag + 1)).sort((a, b) => a - b);
	const median = window[Math.floor(window.length / 2)] ?? 0;
	const peak = at(bestLag);
	return {
		period,
		strength: Math.max(0, peak / zero),
		contrast: peak > 0 ? Math.max(0, (peak - median) / peak) : 0,
	};
}

/** Places beats on strong onsets about one period apart. Returns frame indices. */
export function trackBeats(envelope: Float64Array, period: number): number[] {
	const n = envelope.length;
	const score = new Float64Array(n);
	const previous = new Int32Array(n).fill(-1);
	const minGap = Math.max(1, Math.round(period / 2));
	const maxGap = Math.round(period * 2);
	for (let t = 0; t < n; t++) {
		let best = 0;
		let from = -1;
		for (let gap = minGap; gap <= maxGap && t - gap >= 0; gap++) {
			const candidate = (score[t - gap] ?? 0) - TIGHTNESS * Math.log(gap / period) ** 2;
			if (from < 0 || candidate > best) {
				best = candidate;
				from = t - gap;
			}
		}
		score[t] = (envelope[t] ?? 0) + (from >= 0 ? Math.max(0, best) : 0);
		previous[t] = from >= 0 && best > 0 ? from : -1;
	}
	// End on the best-scoring frame within the last period.
	let last = Math.max(0, n - 1 - Math.round(period));
	for (let t = last; t < n; t++) if ((score[t] ?? 0) > (score[last] ?? 0)) last = t;
	const beats: number[] = [];
	for (let t = last; t >= 0; t = previous[t] ?? 0) beats.push(t);
	return beats.reverse();
}

/** Drops beats in the quiet lead-in and fade-out, where there is nothing to follow. */
function trimQuietEnds(beats: number[], envelope: Float64Array, period: number): number[] {
	const radius = Math.max(1, Math.round(period / 4));
	const local = (t: number) => {
		let peak = 0;
		for (let i = Math.max(0, t - radius); i <= Math.min(envelope.length - 1, t + radius); i++)
			peak = Math.max(peak, envelope[i] ?? 0);
		return peak;
	};
	const strengths = beats.map(local);
	const sorted = [...strengths].sort((a, b) => a - b);
	const threshold = 0.3 * (sorted[Math.floor(sorted.length / 2)] ?? 0);
	let first = 0;
	let last = beats.length - 1;
	while (first <= last && (strengths[first] ?? 0) < threshold) first++;
	while (last >= first && (strengths[last] ?? 0) < threshold) last--;
	return beats.slice(first, last + 1);
}

/** Strongest onset within a quarter period of frame `t`. */
function peakNear(envelope: Float64Array, t: number, radius: number): number {
	let peak = 0;
	const from = Math.max(0, Math.round(t - radius));
	const to = Math.min(envelope.length - 1, Math.round(t + radius));
	for (let i = from; i <= to; i++) peak = Math.max(peak, envelope[i] ?? 0);
	return peak;
}

/**
 * Onset strength halfway between beats relative to on the beats. Near 1 means the
 * offbeats are as strong as the beats, so the pulse may really be twice as fast.
 */
export function offbeatRatio(
	envelope: Float64Array,
	beats: readonly number[],
	period: number,
): number {
	if (beats.length < 2) return 0;
	const radius = period / 8;
	let on = 0;
	let off = 0;
	for (let i = 0; i + 1 < beats.length; i++) {
		on += peakNear(envelope, beats[i] ?? 0, radius);
		off += peakNear(envelope, ((beats[i] ?? 0) + (beats[i + 1] ?? 0)) / 2, radius);
	}
	return on > 0 ? off / on : 0;
}

/**
 * Average beat length from a least-squares line through the beat times, which is
 * finer than the 10 ms envelope frames. Intervals far from the median (a skipped or
 * doubled beat) are left out by fitting each steady run separately.
 */
function meanBeatLength(beats: readonly number[], median: number): number {
	let sumXY = 0;
	let sumXX = 0;
	let run: number[] = [beats[0] ?? 0];
	const flush = () => {
		if (run.length < 3) return;
		const n = run.length;
		const meanX = (n - 1) / 2;
		const meanY = run.reduce((a, b) => a + b, 0) / n;
		run.forEach((y, x) => {
			sumXY += (x - meanX) * (y - meanY);
			sumXX += (x - meanX) ** 2;
		});
	};
	for (let i = 1; i < beats.length; i++) {
		if (Math.abs((beats[i] ?? 0) - (beats[i - 1] ?? 0) - median) <= 0.1 * median)
			run.push(beats[i] ?? 0);
		else {
			flush();
			run = [beats[i] ?? 0];
		}
	}
	flush();
	return sumXX > 0 ? sumXY / sumXX : median;
}

/** Offbeats at least this strong mean the faster pulse is the beat. */
const DOUBLE_TIME_RATIO = 0.6;
/** Offbeats this strong make the tempo ambiguous between x and 2x. */
const AMBIGUOUS_RATIO = 0.35;
/** Highest confidence for a tempo that could also be felt twice as fast. */
const AMBIGUOUS_CAP = 0.6;

export function estimateTempo(onsets: OnsetEnvelope): TempoEstimate | null {
	const envelope = normalizeOnsets(onsets);
	if (!envelope) return null;
	const estimate = estimatePeriod(envelope, onsets.frameRate);
	if (!estimate) return null;
	let period = estimate.period;
	let frames = trimQuietEnds(trackBeats(envelope, period), envelope, period);
	// Autocorrelation favours the slower of two related pulses when beats 1 and 3
	// sound different from 2 and 4 (kick and snare). Check the offbeats.
	const maxBpm = TEMPO_RANGE_BPM[1] - 20;
	const fasterBpm = (2 * 60 * onsets.frameRate) / period;
	if (fasterBpm <= maxBpm && offbeatRatio(envelope, frames, period) >= DOUBLE_TIME_RATIO) {
		period /= 2;
		frames = trimQuietEnds(trackBeats(envelope, period), envelope, period);
	}
	if (frames.length < 4) return null;
	const ambiguity = ramp(
		offbeatRatio(envelope, frames, period),
		AMBIGUOUS_RATIO,
		DOUBLE_TIME_RATIO,
	);

	const beats = frames.map((f) => f / onsets.frameRate);
	const intervals = beats.slice(1).map((b, i) => b - (beats[i] ?? 0));
	const sorted = [...intervals].sort((a, b) => a - b);
	const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
	// How steady the tracked beats are: share of intervals within 10% of the median.
	const steady = intervals.filter((i) => Math.abs(i - median) <= 0.1 * median).length;
	const steadiness = steady / intervals.length;
	let confidence =
		ramp(estimate.strength, 0.05, 0.3) * ramp(estimate.contrast, 0.2, 0.7) * steadiness;
	// Half or double the tempo would be just as valid, so the number itself is uncertain.
	if (ambiguity > 0) confidence = Math.min(confidence * (1 - 0.5 * ambiguity), AMBIGUOUS_CAP);
	const beatLength = meanBeatLength(beats, median);
	return {
		bpm: Math.round(600 / beatLength) / 10,
		...(ambiguity > 0 ? { doubleTimeBpm: Math.round(1200 / beatLength) / 10 } : {}),
		confidence: toConfidence(confidence),
		beats: beats.map((b) => Math.round(b * 1000) / 1000),
	};
}
