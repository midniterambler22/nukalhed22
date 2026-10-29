import { TheoryError } from './errors';
import { formulaPitchClasses, parseFormula, spellFormula, type FormulaNote } from './formula';
import { parseNoteName } from './notes';
import { semitonesBetween } from './pitch-class';
import type { Interval, PitchClass, SpelledNote } from './types';

export type ScaleId =
	| 'minor-pentatonic'
	| 'major-pentatonic'
	| 'blues'
	| 'major'
	| 'natural-minor'
	| 'mixolydian'
	| 'dorian';

export interface ScaleDefinition {
	readonly id: ScaleId;
	readonly name: string;
	/** Formula tokens relative to the major scale, e.g. ["1", "b3", "4", "5", "b7"]. */
	readonly formula: readonly string[];
	readonly intervals: readonly Interval[];
}

function defineScale(id: ScaleId, name: string, formula: readonly string[]): ScaleDefinition {
	return { id, name, formula, intervals: parseFormula(formula) };
}

/** The starter scale library (PROJECT_INSTRUCTIONS §3E). Add new scales here as formulas. */
export const SCALES: Readonly<Record<ScaleId, ScaleDefinition>> = {
	'minor-pentatonic': defineScale('minor-pentatonic', 'Minor pentatonic', [
		'1',
		'b3',
		'4',
		'5',
		'b7',
	]),
	'major-pentatonic': defineScale('major-pentatonic', 'Major pentatonic', [
		'1',
		'2',
		'3',
		'5',
		'6',
	]),
	blues: defineScale('blues', 'Blues', ['1', 'b3', '4', 'b5', '5', 'b7']),
	major: defineScale('major', 'Major (Ionian)', ['1', '2', '3', '4', '5', '6', '7']),
	'natural-minor': defineScale('natural-minor', 'Natural minor (Aeolian)', [
		'1',
		'2',
		'b3',
		'4',
		'5',
		'b6',
		'b7',
	]),
	mixolydian: defineScale('mixolydian', 'Mixolydian', ['1', '2', '3', '4', '5', '6', 'b7']),
	dorian: defineScale('dorian', 'Dorian', ['1', '2', 'b3', '4', '5', '6', 'b7']),
};

export const SCALE_IDS = Object.keys(SCALES) as readonly ScaleId[];

export function isScaleId(value: string): value is ScaleId {
	return Object.hasOwn(SCALES, value);
}

export function getScale(id: ScaleId): ScaleDefinition {
	const scale = SCALES[id];
	if (!scale) throw new TheoryError(`Unknown scale "${String(id)}"`);
	return scale;
}

/** Pitch classes of a scale from a root pitch class, in scale order starting at the root. */
export function scalePitchClasses(root: PitchClass, id: ScaleId): PitchClass[] {
	return formulaPitchClasses(root, getScale(id).intervals);
}

/** Spelled notes of a scale. A minor pentatonic → A C D E G; F major → F G A Bb C D E. */
export function spellScale(root: SpelledNote | string, id: ScaleId): FormulaNote[] {
	const rootNote = typeof root === 'string' ? parseNoteName(root) : root;
	return spellFormula(rootNote, getScale(id).intervals);
}

/** The interval a pitch class forms within a scale, or undefined if it isn't in the scale. */
export function scaleDegreeOf(
	pitchClass: PitchClass,
	root: PitchClass,
	id: ScaleId,
): Interval | undefined {
	const distance = semitonesBetween(root, pitchClass);
	return getScale(id).intervals.find((interval) => interval.semitones % 12 === distance);
}

export function scaleContains(pitchClass: PitchClass, root: PitchClass, id: ScaleId): boolean {
	return scaleDegreeOf(pitchClass, root, id) !== undefined;
}
