import { chordTones, getChordQuality, parseChordSymbol, type Chord } from './chords';
import type { FormulaNote } from './formula';
import { noteToPitchClass } from './notes';
import { semitonesBetween } from './pitch-class';
import { scaleDegreeOf, type ScaleId } from './scales';
import type { Interval, PitchClass } from './types';

const NUMERALS = ['I', '♭II', 'II', '♭III', 'III', 'IV', '♯IV', 'V', '♭VI', 'VI', '♭VII', 'VII'];

const MINOR_THIRD_QUALITIES = new Set([
	'minor',
	'minor6',
	'minor7',
	'diminished',
	'half-diminished7',
	'diminished7',
]);

/**
 * The chord's function as a Roman numeral relative to a tonic: A7 in A is "I", D7 is
 * "IV", Bm is "ii", F in A is "♭VI", G♯dim is "vii°". Upper case for chords with a
 * major (or no) third, lower case for a minor third, "°" for diminished, "ø" for
 * half-diminished. Only the root and third are judged; extensions don't change it.
 */
export function romanNumeral(chord: Chord | string, tonic: PitchClass): string {
	const parsed = typeof chord === 'string' ? parseChordSymbol(chord) : chord;
	const degree = semitonesBetween(tonic, noteToPitchClass(parsed.root));
	const numeral = NUMERALS[degree] ?? '?';
	const quality = getChordQuality(parsed.quality).id;
	const cased = MINOR_THIRD_QUALITIES.has(quality)
		? numeral.replace(/[IV]+/, (m) => m.toLowerCase())
		: numeral;
	if (quality === 'diminished' || quality === 'diminished7') return `${cased}°`;
	if (quality === 'half-diminished7') return `${cased}ø`;
	return cased;
}

/** One chord tone and how it relates to a scale. */
export interface ChordToneInScale extends FormulaNote {
	/** The tone's interval within the scale, or undefined when the scale doesn't have it. */
	scaleInterval: Interval | undefined;
}

/**
 * Each chord tone, in chord order, with its place in the scale (if any). A minor
 * pentatonic over A7: A (1), C♯ (not in the scale), E (5), G (♭7).
 */
export function chordTonesInScale(
	chord: Chord | string,
	scaleRoot: PitchClass,
	scale: ScaleId,
): ChordToneInScale[] {
	return chordTones(chord).map((tone) => ({
		...tone,
		scaleInterval: scaleDegreeOf(tone.pitchClass, scaleRoot, scale),
	}));
}
