import { TheoryError } from './errors';
import { formulaPitchClasses, parseFormula, spellFormula, type FormulaNote } from './formula';
import { parseNoteName } from './notes';
import { semitonesBetween } from './pitch-class';
import type { Interval, PitchClass, SpelledNote } from './types';

export type ScaleCategoryId = 'pentatonic-blues' | 'major-modes' | 'minor-variations' | 'exotic';

export interface ScaleCategory {
	readonly id: ScaleCategoryId;
	readonly name: string;
}

/** The four groups of the scale library, in display order (UI_SPEC §6). */
export const SCALE_CATEGORIES: readonly ScaleCategory[] = [
	{ id: 'pentatonic-blues', name: 'Pentatonic and blues' },
	{ id: 'major-modes', name: 'Major scale and modes' },
	{ id: 'minor-variations', name: 'Minor and harmonic variations' },
	{ id: 'exotic', name: 'Advanced and exotic' },
];

export type ScaleId =
	| 'minor-pentatonic'
	| 'major-pentatonic'
	| 'minor-blues'
	| 'major-blues'
	| 'major'
	| 'natural-minor'
	| 'dorian'
	| 'phrygian'
	| 'lydian'
	| 'mixolydian'
	| 'locrian'
	| 'harmonic-minor'
	| 'melodic-minor'
	| 'phrygian-dominant'
	| 'hungarian-minor'
	| 'whole-tone'
	| 'diminished-half-whole'
	| 'diminished-whole-half'
	| 'altered'
	| 'lydian-dominant';

export interface ScaleDefinition {
	readonly id: ScaleId;
	readonly name: string;
	readonly category: ScaleCategoryId;
	/**
	 * Formula tokens relative to the major scale, e.g. ["1", "b3", "4", "5", "b7"].
	 * A degree may repeat (b2 and #2 in the altered scale) so notes are spelled the way players
	 * read them; the formula still rises in pitch.
	 */
	readonly formula: readonly string[];
	readonly intervals: readonly Interval[];
}

function defineScale(
	id: ScaleId,
	name: string,
	category: ScaleCategoryId,
	formula: string,
): ScaleDefinition {
	const tokens = formula.split(' ');
	return { id, name, category, formula: tokens, intervals: parseFormula(tokens) };
}

/**
 * The scale library (UI_SPEC §6): 20 scales in four groups, stored only as interval formulas.
 * Notes and fretboard positions are computed from these for any root. Listed in display order.
 */
export const SCALES: Readonly<Record<ScaleId, ScaleDefinition>> = {
	// Pentatonic and blues
	'minor-pentatonic': defineScale(
		'minor-pentatonic',
		'Minor pentatonic',
		'pentatonic-blues',
		'1 b3 4 5 b7',
	),
	'major-pentatonic': defineScale(
		'major-pentatonic',
		'Major pentatonic',
		'pentatonic-blues',
		'1 2 3 5 6',
	),
	'minor-blues': defineScale('minor-blues', 'Minor blues', 'pentatonic-blues', '1 b3 4 b5 5 b7'),
	'major-blues': defineScale('major-blues', 'Major blues', 'pentatonic-blues', '1 2 b3 3 5 6'),
	// Major scale and modes
	major: defineScale('major', 'Major (Ionian)', 'major-modes', '1 2 3 4 5 6 7'),
	'natural-minor': defineScale(
		'natural-minor',
		'Natural minor (Aeolian)',
		'major-modes',
		'1 2 b3 4 5 b6 b7',
	),
	dorian: defineScale('dorian', 'Dorian', 'major-modes', '1 2 b3 4 5 6 b7'),
	phrygian: defineScale('phrygian', 'Phrygian', 'major-modes', '1 b2 b3 4 5 b6 b7'),
	lydian: defineScale('lydian', 'Lydian', 'major-modes', '1 2 3 #4 5 6 7'),
	mixolydian: defineScale('mixolydian', 'Mixolydian', 'major-modes', '1 2 3 4 5 6 b7'),
	locrian: defineScale('locrian', 'Locrian', 'major-modes', '1 b2 b3 4 b5 b6 b7'),
	// Minor and harmonic variations
	'harmonic-minor': defineScale(
		'harmonic-minor',
		'Harmonic minor',
		'minor-variations',
		'1 2 b3 4 5 b6 7',
	),
	'melodic-minor': defineScale(
		'melodic-minor',
		'Melodic minor',
		'minor-variations',
		'1 2 b3 4 5 6 7',
	),
	'phrygian-dominant': defineScale(
		'phrygian-dominant',
		'Phrygian dominant',
		'minor-variations',
		'1 b2 3 4 5 b6 b7',
	),
	'hungarian-minor': defineScale(
		'hungarian-minor',
		'Hungarian minor',
		'minor-variations',
		'1 2 b3 #4 5 b6 7',
	),
	// Advanced and exotic
	'whole-tone': defineScale('whole-tone', 'Whole tone', 'exotic', '1 2 3 #4 #5 b7'),
	'diminished-half-whole': defineScale(
		'diminished-half-whole',
		'Diminished (half-whole)',
		'exotic',
		'1 b2 #2 3 #4 5 6 b7',
	),
	'diminished-whole-half': defineScale(
		'diminished-whole-half',
		'Diminished (whole-half)',
		'exotic',
		'1 2 b3 4 b5 #5 6 7',
	),
	altered: defineScale('altered', 'Altered', 'exotic', '1 b2 #2 3 b5 #5 b7'),
	'lydian-dominant': defineScale(
		'lydian-dominant',
		'Lydian dominant',
		'exotic',
		'1 2 3 #4 5 6 b7',
	),
};

export const SCALE_IDS = Object.keys(SCALES) as readonly ScaleId[];

/** The scales in one group, in display order. */
export function scalesInCategory(category: ScaleCategoryId): ScaleDefinition[] {
	return SCALE_IDS.map((id) => SCALES[id]).filter((scale) => scale.category === category);
}

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

/** How a scale is drawn as boxes: a five-note core, plus any notes added on top of it. */
export interface ScaleBoxPlan {
	/** Semitone offsets (0–11) of the five-note core the boxes are built from. */
	readonly core: readonly number[];
	/** Semitone offsets added inside each box, such as the blue note. Empty for pentatonics. */
	readonly added: readonly number[];
}

/** The five-note scale each blues scale is built on. */
const BOX_PARENTS: Partial<Record<ScaleId, ScaleId>> = {
	'minor-blues': 'minor-pentatonic',
	'major-blues': 'major-pentatonic',
};

function offsets(id: ScaleId): number[] {
	return getScale(id).intervals.map((interval) => interval.semitones % 12);
}

/**
 * Box plan for a scale, or undefined when the scale has no boxes (yet). Pentatonics are their
 * own core. Blues scales use their pentatonic's five boxes and add the blue note wherever it
 * falls inside a box, so the shapes you already know grow by one note.
 */
export function scaleBoxPlan(id: ScaleId): ScaleBoxPlan | undefined {
	const own = offsets(id);
	if (own.length === 5) return { core: own, added: [] };
	const parent = BOX_PARENTS[id];
	if (!parent) return undefined;
	const core = offsets(parent);
	return { core, added: own.filter((offset) => !core.includes(offset)) };
}
