import {
	chordPitchClasses,
	formatNote,
	scalePitchClasses,
	spellPitchClass,
	spellScale,
	toPitchClass,
	type PitchClass,
	type SpelledNote,
} from '../music-theory';
import type { ChordLabel, RecognizedChord } from './chords';
import { ramp, toConfidence } from './confidence';
import { viterbiPath } from './viterbi';
import type { KeyCandidate, KeyEstimate, KeyMode, TonalSection } from './types';

/**
 * Key estimation in two parts:
 * 1. Correlate the song's pitch-class profile with the Krumhansl–Kessler key profiles
 *    (Krumhansl 1990, "Cognitive Foundations of Musical Pitch", table 4.1).
 * 2. Check how well the recognized chords fit each key as diatonic chords, weighting
 *    the tonic, subdominant and dominant. This separates keys that share most notes
 *    (E major vs B major) better than the profile alone.
 */

/** Probe-tone ratings from C upward. */
export const KRUMHANSL_PROFILES: Readonly<Record<KeyMode, readonly number[]>> = {
	major: [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88],
	minor: [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17],
};

const MODES: readonly KeyMode[] = ['major', 'minor'];

function modeScale(mode: KeyMode) {
	return mode === 'major' ? 'major' : 'natural-minor';
}

/**
 * Spelled notes of the key's scale, choosing the tonic spelling with fewer accidentals
 * (B♭ major, not A♯ major). Used to spell chord roots in the key.
 */
export function keyScaleSpelling(tonic: PitchClass, mode: KeyMode): SpelledNote[] {
	const options = (['sharp', 'flat'] as const).map((preference) =>
		spellScale(spellPitchClass(tonic, preference), modeScale(mode)).map((n) => n.note),
	);
	const accidentals = (notes: SpelledNote[]) =>
		notes.reduce((sum, note) => sum + Math.abs(note.accidental), 0);
	const [sharp, flat] = options as [SpelledNote[], SpelledNote[]];
	const difference = accidentals(flat) - accidentals(sharp);
	// Six accidentals either way: F♯ major and E♭ minor are the more common spellings.
	if (difference === 0) return mode === 'major' ? sharp : flat;
	return difference < 0 ? flat : sharp;
}

export function keyName(tonic: PitchClass, mode: KeyMode): string {
	return `${formatNote(keyScaleSpelling(tonic, mode)[0] ?? spellPitchClass(tonic), 'unicode')} ${mode}`;
}

function pearson(a: ArrayLike<number>, b: ArrayLike<number>, shift: number): number {
	let meanA = 0;
	let meanB = 0;
	for (let i = 0; i < 12; i++) {
		meanA += a[i] ?? 0;
		meanB += b[i] ?? 0;
	}
	meanA /= 12;
	meanB /= 12;
	let cov = 0;
	let varA = 0;
	let varB = 0;
	for (let i = 0; i < 12; i++) {
		const x = (a[(i + shift) % 12] ?? 0) - meanA;
		const y = (b[i] ?? 0) - meanB;
		cov += x * y;
		varA += x * x;
		varB += y * y;
	}
	return varA > 0 && varB > 0 ? cov / Math.sqrt(varA * varB) : 0;
}

/** How much the chord fit (0–1) adds to the profile correlation (-1…1). */
const CHORD_FIT_WEIGHT = 0.5;

/** The plain triad under a chord: A7 counts as A major, Am7 as A minor. */
function triadPitchClasses(chord: ChordLabel): PitchClass[] {
	const quality =
		chord.quality === 'dominant7'
			? 'major'
			: chord.quality === 'minor7'
				? 'minor'
				: chord.quality;
	return chordPitchClasses({ root: spellPitchClass(chord.root), quality });
}

/**
 * Weight of a chord in a key: 1 for the tonic chord, 0.7 for chords on the 4th and 5th
 * degrees, 0.4 for other diatonic chords, 0 for chords outside the key. In minor keys
 * the major V (harmonic minor) also counts.
 */
export function chordKeyWeight(chord: ChordLabel, tonic: PitchClass, mode: KeyMode): number {
	const scale = scalePitchClasses(tonic, modeScale(mode));
	const degree = scale.indexOf(chord.root);
	if (degree < 0) return 0;
	const triad = triadPitchClasses(chord);
	const isMajorTriad = chord.quality === 'major' || chord.quality === 'dominant7';
	const diatonic =
		triad.every((pc) => scale.includes(pc)) ||
		(mode === 'minor' && degree === 4 && isMajorTriad);
	if (!diatonic) return 0;
	if (degree === 0) return 1;
	return degree === 3 || degree === 4 ? 0.7 : 0.4;
}

/** Duration-weighted average of `chordKeyWeight` over the recognized chords, 0–1. */
export function chordFit(
	chords: readonly RecognizedChord[],
	tonic: PitchClass,
	mode: KeyMode,
): number {
	let weighted = 0;
	let total = 0;
	for (const c of chords) {
		if (!c.chord) continue;
		const length = c.end - c.start;
		weighted += length * chordKeyWeight(c.chord, tonic, mode);
		total += length;
	}
	return total > 0 ? weighted / total : 0;
}

/**
 * All 24 keys scored against a 12-value pitch-class profile and, when given, the
 * recognized chords. Best first.
 */
export function rankKeys(
	profile: ArrayLike<number>,
	chords: readonly RecognizedChord[] = [],
): KeyCandidate[] {
	const candidates: KeyCandidate[] = [];
	for (const mode of MODES) {
		for (let tonic = 0; tonic < 12; tonic++) {
			const pc = toPitchClass(tonic);
			candidates.push({
				tonic: pc,
				mode,
				name: keyName(pc, mode),
				score:
					pearson(profile, KRUMHANSL_PROFILES[mode], tonic) +
					(chords.length > 0 ? CHORD_FIT_WEIGHT * chordFit(chords, pc, mode) : 0),
			});
		}
	}
	return candidates.sort((a, b) => b.score - a.score);
}

/** Spread between the strongest and weakest pitch class below which audio counts as unpitched. */
export const MIN_PITCH_CONTRAST = 0.15;

/** Has enough spread between pitch classes for a key to mean anything. */
function hasPitchContent(profile: ArrayLike<number>): boolean {
	let max = 0;
	let min = Infinity;
	for (let i = 0; i < 12; i++) {
		max = Math.max(max, profile[i] ?? 0);
		min = Math.min(min, profile[i] ?? 0);
	}
	return max > 0 && (max - min) / max > MIN_PITCH_CONTRAST;
}

export function estimateKey(
	profile: ArrayLike<number>,
	chords: readonly RecognizedChord[] = [],
): KeyEstimate | null {
	if (!hasPitchContent(profile)) return null;
	const [best, second, ...rest] = rankKeys(profile, chords) as [KeyCandidate, KeyCandidate];
	// A clear key fits well and beats the runner-up by a margin.
	const ceiling = chords.length > 0 ? 1 + CHORD_FIT_WEIGHT : 1;
	const fit = ramp(best.score / ceiling, 0.5, 0.8);
	const margin = ramp((best.score - second.score) / ceiling, 0.03, 0.15);
	return {
		...best,
		score: round(best.score),
		confidence: toConfidence(Math.sqrt(fit * margin)),
		alternatives: [second, ...rest.slice(0, 2)].map((c) => ({ ...c, score: round(c.score) })),
	};
}

function round(x: number): number {
	return Math.round(x * 1000) / 1000;
}

/** Section length used to look for key changes, in seconds. */
const SECTION_WINDOW = 16;
/** Cost of switching key between windows, in correlation units. */
const SWITCH_COST = 0.6;
/** Key sections shorter than this are folded into a neighbour. */
const MIN_SECTION = 20;

/**
 * Splits the song into stretches with different tonal centres, when it has any.
 * `profileAt(start, end)` returns the pitch-class profile of that time span.
 * Returns an empty list when one key covers the whole song.
 */
export function findTonalSections(
	duration: number,
	profileAt: (start: number, end: number) => Float64Array | null,
): TonalSection[] {
	const count = Math.floor(duration / SECTION_WINDOW);
	if (count < 3) return [];
	const windows: (KeyCandidate[] | null)[] = [];
	for (let w = 0; w < count; w++) {
		const end = w === count - 1 ? duration : (w + 1) * SECTION_WINDOW;
		const profile = profileAt(w * SECTION_WINDOW, end);
		windows.push(profile && hasPitchContent(profile) ? rankKeys(profile) : null);
	}
	// Stay in a key unless another fits clearly better for a while.
	const keyIndex = (c: KeyCandidate) => (c.mode === 'major' ? 0 : 12) + c.tonic;
	const path = viterbiPath(
		windows.map((ranked) => {
			const s = new Float64Array(24);
			if (ranked) for (const c of ranked) s[keyIndex(c)] = c.score;
			return s;
		}),
		SWITCH_COST,
	);

	// Runs of one key, then fold runs shorter than MIN_SECTION into their neighbours.
	const runs: { start: number; end: number; state: number }[] = [];
	path.forEach((state, w) => {
		const start = w * SECTION_WINDOW;
		const end = w === count - 1 ? duration : (w + 1) * SECTION_WINDOW;
		const last = runs.at(-1);
		if (last && last.state === state) last.end = end;
		else runs.push({ start, end, state });
	});
	const merged: { start: number; end: number; state: number }[] = [];
	for (const run of runs.filter((r) => r.end - r.start >= MIN_SECTION)) {
		const last = merged.at(-1);
		if (last && last.state === run.state) last.end = run.end;
		else merged.push({ ...run, start: last ? last.end : 0 });
	}
	const final = merged.at(-1);
	if (!final || merged.length < 2) return [];
	final.end = duration;
	return merged.map(({ start, end, state: s }) => {
		const mode: KeyMode = s < 12 ? 'major' : 'minor';
		const tonic = toPitchClass(s % 12);
		const window = windows.find((_, w) => path[w] === s);
		const score = window?.find((c) => keyIndex(c) === s)?.score ?? 0;
		return {
			start: round(start),
			end: round(end),
			key: { tonic, mode, name: keyName(tonic, mode), score: round(score) },
		};
	});
}
