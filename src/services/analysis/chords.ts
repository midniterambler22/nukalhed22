import {
	chordPitchClasses,
	formatChordSymbol,
	getChordQuality,
	spellPitchClass,
	spellPitchClassInContext,
	toPitchClass,
	type ChordQualityId,
	type PitchClass,
	type SpelledNote,
} from '../music-theory';
import { toConfidence } from './confidence';
import { MIN_PITCH_CONTRAST } from './key';
import { viterbiPath } from './viterbi';
import type { Chromagram } from './features';
import type { ChordEvent, Confidence } from './types';

/**
 * Chord recognition: chroma averaged over each segment (usually one beat) is
 * compared with chord templates built from the theory module's chord formulas,
 * then smoothed with a Viterbi pass so chords don't flicker between beats.
 */

/** Chord types the recognizer can name. More types means more confusions, so keep it small. */
export const RECOGNIZED_QUALITIES: readonly ChordQualityId[] = [
	'major',
	'minor',
	'dominant7',
	'minor7',
];

/** Relative strength of harmonics 1–5 and the semitones they sit above the note. */
const HARMONICS = [
	{ semitones: 0, weight: 1 },
	{ semitones: 0, weight: 0.6 },
	{ semitones: 7, weight: 0.36 },
	{ semitones: 0, weight: 0.22 },
	{ semitones: 4, weight: 0.13 },
] as const;

/** Small handicap for four-note chords, so a plain triad isn't called a seventh chord. */
const SEVENTH_PENALTY = 0.015;
/** Sharpness of the per-segment probabilities used for confidence. */
const SOFTMAX_GAIN = 40;
/** Score lost by changing chord between segments. */
const CHANGE_COST = 0.08;
/** Below this cosine similarity nothing sounds like a chord. */
const NO_CHORD_SCORE = 0.55;

export interface ChordTemplate {
	root: PitchClass;
	quality: ChordQualityId;
	vector: Float64Array;
	penalty: number;
}

function normalize(vector: Float64Array): Float64Array {
	let norm = 0;
	for (const v of vector) norm += v * v;
	norm = Math.sqrt(norm);
	if (norm > 0) for (let i = 0; i < vector.length; i++) vector[i] = (vector[i] ?? 0) / norm;
	return vector;
}

export function buildTemplates(qualities = RECOGNIZED_QUALITIES): ChordTemplate[] {
	const templates: ChordTemplate[] = [];
	for (const quality of qualities) {
		const noteCount = getChordQuality(quality).intervals.length;
		for (let r = 0; r < 12; r++) {
			const root = toPitchClass(r);
			const vector = new Float64Array(12);
			for (const pc of chordPitchClasses({ root: spellPitchClass(root), quality })) {
				for (const h of HARMONICS)
					vector[(pc + h.semitones) % 12] =
						(vector[(pc + h.semitones) % 12] ?? 0) + h.weight;
			}
			templates.push({
				root,
				quality,
				vector: normalize(vector),
				penalty: noteCount > 3 ? SEVENTH_PENALTY : 0,
			});
		}
	}
	return templates;
}

/** Removes the even floor shared by all pitch classes, then scales to unit length. */
export function prepareChroma(chroma: ArrayLike<number>): Float64Array | null {
	let min = Infinity;
	let max = 0;
	for (let i = 0; i < 12; i++) {
		min = Math.min(min, chroma[i] ?? 0);
		max = Math.max(max, chroma[i] ?? 0);
	}
	if (!(max > 0) || (max - min) / max < MIN_PITCH_CONTRAST) return null;
	const out = new Float64Array(12);
	for (let i = 0; i < 12; i++) out[i] = (chroma[i] ?? 0) - min;
	return normalize(out);
}

function cosine(a: Float64Array, b: Float64Array): number {
	let dot = 0;
	for (let i = 0; i < 12; i++) dot += (a[i] ?? 0) * (b[i] ?? 0);
	return dot;
}

/** Mean chroma and loudness of the chromagram frames that fall in [start, end). */
export function averageChroma(
	chromagram: Chromagram,
	start: number,
	end: number,
): { chroma: Float64Array; rms: number } {
	const first = Math.max(0, Math.round(start * chromagram.frameRate));
	const last = Math.min(
		chromagram.frames.length,
		Math.max(first + 1, Math.round(end * chromagram.frameRate)),
	);
	const chroma = new Float64Array(12);
	let rms = 0;
	for (let f = first; f < last; f++) {
		const frame = chromagram.frames[f];
		if (frame) for (let i = 0; i < 12; i++) chroma[i] = (chroma[i] ?? 0) + (frame[i] ?? 0);
		rms += chromagram.rms[f] ?? 0;
	}
	const count = Math.max(1, last - first);
	for (let i = 0; i < 12; i++) chroma[i] = (chroma[i] ?? 0) / count;
	return { chroma, rms: rms / count };
}

/** A chord as pitch-class root and quality, before it is spelled for a key. */
export interface ChordLabel {
	root: PitchClass;
	quality: ChordQualityId;
}

/** A recognized stretch of audio. `chord` is null where no chord was heard. */
export interface RecognizedChord {
	start: number;
	end: number;
	chord: ChordLabel | null;
	confidence: Confidence;
	alternatives: ChordLabel[];
}

/**
 * Labels each stretch between `boundaries` (seconds, ascending, from 0 to the
 * duration) with the best-fitting chord, merging neighbours with the same chord.
 */
export function recognizeChords(
	chromagram: Chromagram,
	boundaries: readonly number[],
): RecognizedChord[] {
	const templates = buildTemplates();
	const states = templates.length + 1; // last state = no chord
	const noChord = templates.length;
	const segments = boundaries.slice(1).map((end, i) => {
		const start = boundaries[i] ?? 0;
		return { start, end, ...averageChroma(chromagram, start, end) };
	});
	if (segments.length === 0) return [];

	const sortedRms = segments.map((s) => s.rms).sort((a, b) => a - b);
	const loudness = sortedRms[Math.floor(sortedRms.length * 0.9)] ?? 0;
	const silence = Math.max(1e-4, loudness * 0.05);

	// Similarity of every segment to every state.
	const scores = segments.map((segment) => {
		const s = new Float64Array(states);
		const chroma = segment.rms > silence ? prepareChroma(segment.chroma) : null;
		templates.forEach((t, i) => {
			s[i] = chroma ? cosine(chroma, t.vector) - t.penalty : 0;
		});
		s[noChord] = chroma ? NO_CHORD_SCORE : 1;
		return s;
	});

	const path = viterbiPath(scores, CHANGE_COST);

	const label = (index: number): ChordLabel | null => {
		const t = templates[index];
		return t ? { root: t.root, quality: t.quality } : null;
	};

	// Merge runs of the same state into events.
	const events: RecognizedChord[] = [];
	let runStart = 0;
	for (let n = 1; n <= path.length; n++) {
		if (n < path.length && path[n] === path[runStart]) continue;
		const chosen = path[runStart] ?? 0;
		const run = scores.slice(runStart, n);
		const mean = new Float64Array(states);
		for (const s of run)
			for (let k = 0; k < states; k++) mean[k] = (mean[k] ?? 0) + (s[k] ?? 0) / run.length;
		// Confidence: how much of the probability the chosen chord takes, segment by segment.
		let probability = 0;
		for (const s of run) {
			let sum = 0;
			for (let k = 0; k < states; k++)
				sum += Math.exp(SOFTMAX_GAIN * ((s[k] ?? 0) - (s[chosen] ?? 0)));
			probability += 1 / sum;
		}
		const alternatives = Array.from(mean.keys())
			.filter((k) => k !== chosen && k !== noChord)
			.sort((a, b) => (mean[b] ?? 0) - (mean[a] ?? 0))
			.slice(0, 2)
			.flatMap((k) => label(k) ?? []);
		events.push({
			start: round(segments[runStart]?.start ?? 0),
			end: round(segments[n - 1]?.end ?? 0),
			chord: label(chosen),
			confidence: toConfidence(probability / run.length),
			alternatives: chosen === noChord ? [] : alternatives,
		});
		runStart = n;
	}
	return events;
}

/** Writes a chord label as a symbol, spelling its root for the key when one is given. */
export function chordSymbol(label: ChordLabel, keySpelling?: readonly SpelledNote[]): string {
	const root = keySpelling
		? spellPitchClassInContext(label.root, keySpelling)
		: spellPitchClass(label.root, 'sharp');
	return formatChordSymbol({ root, quality: label.quality });
}

/** Spells recognized chords for the key and marks them as automatic results. */
export function toChordEvents(
	recognized: readonly RecognizedChord[],
	keySpelling?: readonly SpelledNote[],
): ChordEvent[] {
	return recognized
		.filter((r) => r.end > r.start)
		.map((r) => ({
			start: r.start,
			end: r.end,
			chord: r.chord ? chordSymbol(r.chord, keySpelling) : null,
			confidence: r.confidence,
			alternatives: r.alternatives.map((a) => chordSymbol(a, keySpelling)),
			source: 'auto',
		}));
}

function round(x: number): number {
	return Math.round(x * 1000) / 1000;
}
