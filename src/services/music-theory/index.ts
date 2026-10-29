/**
 * Music theory engine: pure, deterministic functions with no UI or audio imports.
 * Pitch classes are numbers 0–11; note names are spelling for display.
 */
export type {
	AccidentalPreference,
	AccidentalStyle,
	Interval,
	Letter,
	MidiNote,
	Pitch,
	PitchClass,
	SpelledNote,
} from './types';
export { TheoryError } from './errors';
export { semitonesBetween, toPitchClass, transposePitchClass } from './pitch-class';
export {
	LETTERS,
	LETTER_PITCH_CLASS,
	formatNote,
	formatPitch,
	isEnharmonic,
	isNoteName,
	midiToPitch,
	midiToPitchClass,
	noteToPitchClass,
	notesEqual,
	parseNoteName,
	parsePitch,
	spellPitchClass,
	spellPitchClassInContext,
	toMidi,
} from './notes';
export {
	formatInterval,
	intervalName,
	intervalQuality,
	parseInterval,
	transposeNote,
	type IntervalQuality,
} from './intervals';
export { formulaPitchClasses, parseFormula, spellFormula, type FormulaNote } from './formula';
export {
	SCALES,
	SCALE_IDS,
	getScale,
	isScaleId,
	scaleContains,
	scaleDegreeOf,
	scalePitchClasses,
	spellScale,
	type ScaleDefinition,
	type ScaleId,
} from './scales';
export {
	CHORD_QUALITIES,
	CHORD_QUALITY_IDS,
	chordPitchClasses,
	chordTones,
	formatChordSymbol,
	getChordQuality,
	isChordSymbol,
	parseChordSymbol,
	type Chord,
	type ChordQuality,
	type ChordQualityId,
} from './chords';
