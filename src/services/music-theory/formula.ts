import { TheoryError } from './errors';
import { parseInterval, transposeNote } from './intervals';
import { noteToPitchClass } from './notes';
import { transposePitchClass } from './pitch-class';
import type { Interval, PitchClass, SpelledNote } from './types';

/** One note of a scale or chord built from a root: its spelling, pitch class, and interval. */
export interface FormulaNote {
	readonly note: SpelledNote;
	readonly pitchClass: PitchClass;
	readonly interval: Interval;
}

/**
 * Parses a formula such as ["1", "b3", "4", "5", "b7"] and checks it is usable:
 * it starts on the root, rises strictly, and stays within two octaves.
 */
export function parseFormula(tokens: readonly string[]): readonly Interval[] {
	const intervals = tokens.map(parseInterval);
	const first = intervals[0];
	if (!first || first.degree !== 1 || first.semitones !== 0) {
		throw new TheoryError(`Formula "${tokens.join(' ')}" must start with 1`);
	}
	for (let i = 1; i < intervals.length; i++) {
		const previous = intervals[i - 1] as Interval;
		const current = intervals[i] as Interval;
		if (current.semitones <= previous.semitones || current.degree < previous.degree) {
			throw new TheoryError(`Formula "${tokens.join(' ')}" must rise in order`);
		}
	}
	return intervals;
}

/** Pitch classes of a formula above a root, in formula order. */
export function formulaPitchClasses(
	root: PitchClass,
	intervals: readonly Interval[],
): PitchClass[] {
	return intervals.map((interval) => transposePitchClass(root, interval.semitones));
}

/** Spelled notes of a formula above a spelled root, with correct letter names. */
export function spellFormula(root: SpelledNote, intervals: readonly Interval[]): FormulaNote[] {
	return intervals.map((interval) => {
		const note = transposeNote(root, interval);
		return { note, pitchClass: noteToPitchClass(note), interval };
	});
}
