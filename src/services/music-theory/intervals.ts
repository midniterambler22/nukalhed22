import { TheoryError } from './errors';
import { LETTERS, LETTER_PITCH_CLASS } from './notes';
import { toPitchClass } from './pitch-class';
import type { Interval, Letter, SpelledNote } from './types';

/** Semitones of each major-scale degree from 1 to 7. Degrees above 7 add an octave. */
const MAJOR_DEGREE_SEMITONES = [0, 2, 4, 5, 7, 9, 11] as const;

/** Degrees that are perfect (unison, 4th, 5th and their compounds) rather than major/minor. */
const PERFECT_DEGREES = new Set([1, 4, 5]);

const INTERVAL_PATTERN = /^(bb|b|#|##)?(\d{1,2})$/;

function simpleDegree(degree: number): number {
	return ((degree - 1) % 7) + 1;
}

/** Semitones of the major (or perfect) interval for a degree. 3 → 4, 9 → 14. */
function majorSemitones(degree: number): number {
	const octaves = Math.floor((degree - 1) / 7);
	const base = MAJOR_DEGREE_SEMITONES[simpleDegree(degree) - 1] ?? 0;
	return base + octaves * 12;
}

/**
 * Reads an interval written as a scale-degree formula token: "1", "b3", "#4", "b7", "bb7", "9", "#11".
 * Accidentals are relative to the major scale, so "b3" is a minor third and "b5" a diminished fifth.
 */
export function parseInterval(token: string): Interval {
	const match = INTERVAL_PATTERN.exec(token.trim());
	const degree = match?.[2] === undefined ? NaN : Number.parseInt(match[2], 10);
	if (!match || !Number.isInteger(degree) || degree < 1 || degree > 15) {
		throw new TheoryError(`"${token}" is not an interval such as b3 or #11`);
	}
	const prefix = match[1] ?? '';
	const shift = prefix.startsWith('#') ? prefix.length : -prefix.length;
	return { degree, semitones: majorSemitones(degree) + shift };
}

/** Writes an interval back as a formula token: { degree: 3, semitones: 3 } → "b3". */
export function formatInterval(interval: Interval): string {
	const shift = interval.semitones - majorSemitones(interval.degree);
	const prefix = shift > 0 ? '#'.repeat(shift) : 'b'.repeat(-shift);
	return prefix + String(interval.degree);
}

const DEGREE_NAMES: readonly string[] = [
	'unison',
	'second',
	'third',
	'fourth',
	'fifth',
	'sixth',
	'seventh',
	'octave',
	'ninth',
	'tenth',
	'eleventh',
	'twelfth',
	'thirteenth',
	'fourteenth',
	'fifteenth',
];

/** Quality of an interval: perfect, major, minor, augmented or diminished. */
export type IntervalQuality = 'perfect' | 'major' | 'minor' | 'augmented' | 'diminished';

export function intervalQuality(interval: Interval): IntervalQuality {
	const shift = interval.semitones - majorSemitones(interval.degree);
	if (PERFECT_DEGREES.has(simpleDegree(interval.degree))) {
		if (shift === 0) return 'perfect';
		return shift > 0 ? 'augmented' : 'diminished';
	}
	if (shift === 0) return 'major';
	if (shift === -1) return 'minor';
	return shift > 0 ? 'augmented' : 'diminished';
}

/** Plain-language name: "minor third", "perfect fifth", "diminished fifth". */
export function intervalName(interval: Interval): string {
	const degreeName = DEGREE_NAMES[interval.degree - 1] ?? `${interval.degree}th`;
	if (interval.degree === 1 && interval.semitones === 0) return 'unison';
	return `${intervalQuality(interval)} ${degreeName}`;
}

/**
 * Spells the note an interval above a root, keeping correct letter names.
 * A + b3 → C, E + b5 → Bb, G# + 7 → F##.
 */
export function transposeNote(root: SpelledNote, interval: Interval): SpelledNote {
	const rootIndex = LETTERS.indexOf(root.letter);
	const letter = LETTERS[(rootIndex + interval.degree - 1) % 7] as Letter;
	const rootPitchClass = LETTER_PITCH_CLASS[root.letter] + root.accidental;
	const target = toPitchClass(rootPitchClass + interval.semitones);
	// Difference between the wanted pitch and the natural letter, kept in −5…+6.
	let accidental = toPitchClass(target - LETTER_PITCH_CLASS[letter]);
	if (accidental > 6) accidental -= 12;
	if (Math.abs(accidental) > 2) {
		throw new TheoryError(
			`Spelling ${formatInterval(interval)} above ${root.letter} needs more than a double accidental`,
		);
	}
	return { letter, accidental };
}
