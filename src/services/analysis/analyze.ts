import { estimateKey, findTonalSections, keyScaleSpelling } from './key';
import { recognizeChords, RECOGNIZED_QUALITIES, toChordEvents } from './chords';
import { CONFIDENCE_THRESHOLDS, toConfidence } from './confidence';
import { computeChromagram, computeOnsetEnvelope, type Chromagram } from './features';
import { estimateTempo } from './tempo';
import {
	AnalysisError,
	type AnalysisProgress,
	type AnalysisResult,
	type ChordEvent,
	type KeyEstimate,
	type TempoEstimate,
} from './types';

/** Name and version of this engine, stored with every result it produces. */
export const ENGINE_ID = 'nukalhed-dsp/1';

/** Shortest audio worth analyzing, in seconds. */
export const MIN_ANALYSIS_SECONDS = 5;
/** Highest key confidence reported when the key seems to change. */
const CHANGING_KEY_CAP = 0.39;
/** Chord step used when no steady beat is found. */
const FALLBACK_STEP = 0.5;

export interface AnalysisInput {
	samples: Float32Array;
	sampleRate: number;
}

export interface AnalyzeOptions {
	onProgress?: (progress: AnalysisProgress) => void;
}

/** Average of the loudness-normalized chroma frames in [start, end); null if all silent. */
function pitchProfile(chromagram: Chromagram, start: number, end: number): Float64Array | null {
	const first = Math.max(0, Math.floor(start * chromagram.frameRate));
	const last = Math.min(chromagram.frames.length, Math.ceil(end * chromagram.frameRate));
	const profile = new Float64Array(12);
	let used = 0;
	for (const frame of chromagram.frames.slice(first, last)) {
		let sum = 0;
		for (const v of frame) sum += v;
		if (!(sum > 1e-3)) continue;
		for (let i = 0; i < 12; i++) profile[i] = (profile[i] ?? 0) + (frame[i] ?? 0) / sum;
		used++;
	}
	return used > 0 ? profile : null;
}

/**
 * Where chord segments start and end: every half beat when the beat is steady (so a
 * change between beats, or a beat tracked at half speed, still lands close), and
 * fixed steps otherwise.
 */
export function chordBoundaries(duration: number, beats: readonly number[] | null): number[] {
	const inner: number[] = [];
	if (beats && beats.length > 1) {
		for (let i = 0; i < beats.length; i++) {
			inner.push(beats[i] ?? 0);
			const next = beats[i + 1];
			if (next !== undefined) inner.push(((beats[i] ?? 0) + next) / 2);
		}
	} else {
		for (let t = FALLBACK_STEP; t < duration; t += FALLBACK_STEP) inner.push(t);
	}
	return [0, ...inner.filter((t) => t > 0.05 && t < duration - 0.05), duration];
}

/** True when nothing in the result is better than a low-confidence guess. */
function looksUnpitched(
	key: KeyEstimate | null,
	tempo: TempoEstimate | null,
	chords: readonly ChordEvent[],
): boolean {
	const low = (level: string | undefined) => level === undefined || level === 'low';
	let named = 0;
	let confident = 0;
	for (const c of chords) {
		if (!c.chord) continue;
		named += c.end - c.start;
		if (c.confidence.level !== 'low') confident += c.end - c.start;
	}
	return low(key?.confidence.level) && low(tempo?.confidence.level) && confident < 0.5 * named;
}

function rms(samples: Float32Array): number {
	let sum = 0;
	for (const s of samples) sum += s * s;
	return Math.sqrt(sum / Math.max(1, samples.length));
}

/**
 * Estimates key, tempo, beats and chords from mono samples. Pure and synchronous:
 * run it in a worker for real songs. Throws `AnalysisError` for audio it can't use.
 */
export function analyzeAudio(input: AnalysisInput, options: AnalyzeOptions = {}): AnalysisResult {
	const { samples, sampleRate } = input;
	const report = options.onProgress ?? (() => {});
	const duration = samples.length / sampleRate;
	if (duration < MIN_ANALYSIS_SECONDS) {
		throw new AnalysisError(
			'too-short',
			`The song is too short to analyze. It needs at least ${MIN_ANALYSIS_SECONDS} seconds of music.`,
		);
	}
	if (rms(samples) < 1e-4) {
		throw new AnalysisError(
			'silent',
			'No music was found: the audio is silent or almost silent. Check the file plays with sound, then try another file.',
		);
	}

	report({ stage: 'spectrum', fraction: 0 });
	const chromagram = computeChromagram(samples, sampleRate);
	report({ stage: 'beats', fraction: 0.4 });
	const onsets = computeOnsetEnvelope(samples, sampleRate);
	const tempo = estimateTempo(onsets);

	report({ stage: 'chords', fraction: 0.75 });
	const useBeats = tempo !== null && tempo.confidence.value >= CONFIDENCE_THRESHOLDS.medium;
	const recognized = recognizeChords(
		chromagram,
		chordBoundaries(duration, useBeats ? tempo.beats : null),
	);

	report({ stage: 'key', fraction: 0.9 });
	const profile = pitchProfile(chromagram, 0, duration);
	const overall = profile ? estimateKey(profile, recognized) : null;
	const tonalSections = overall
		? findTonalSections(duration, (start, end) => pitchProfile(chromagram, start, end))
		: [];
	// One key for a song that changes key is a compromise, so never call it likely.
	const key =
		overall && tonalSections.length > 0
			? {
					...overall,
					confidence: toConfidence(Math.min(overall.confidence.value, CHANGING_KEY_CAP)),
				}
			: overall;
	const chords = toChordEvents(
		recognized,
		key ? keyScaleSpelling(key.tonic, key.mode) : undefined,
	);
	report({ stage: 'key', fraction: 1 });

	const notes = [
		'Estimated automatically on this device. Treat every result as a starting point, not a transcription.',
		`Chords are named as ${RECOGNIZED_QUALITIES.length === 4 ? 'major, minor, 7 or m7' : 'a few basic types'}; other chords show as the closest of these.`,
		'Assumes standard concert pitch (A = 440 Hz).',
	];
	if (!useBeats)
		notes.push('No steady beat was found, so chords are timed in half-second steps.');
	if (tonalSections.length > 0)
		notes.push(
			'The key seems to change during the song, so one key for the whole song is only a rough summary.',
		);
	if (looksUnpitched(key, tempo, chords))
		notes.push('This audio has no clear harmony or beat, so these results are very uncertain.');

	return {
		engine: ENGINE_ID,
		duration: Math.round(duration * 1000) / 1000,
		key,
		tonalSections,
		tempo,
		chords,
		notes,
	};
}
