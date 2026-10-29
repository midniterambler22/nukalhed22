import type { PitchClass } from './pitch';

/**
 * A tuning lists open-string pitches as MIDI numbers, LOW to HIGH
 * (the order tunings are usually written: E A D G B E).
 */
export interface Tuning {
	name: string;
	openMidi: readonly number[];
}

export type Handedness = 'right' | 'left';

/**
 * A validated instrument. Build one with `createInstrument`.
 *
 * Conventions:
 * - Strings are numbered 1 = highest-pitched string to N = lowest
 *   (standard guitar: 1 = high E, 6 = low E).
 * - Frets are absolute neck frets. With a capo on fret c, fret c is the
 *   lowest playable fret and sounds as the "open" string; frets below c
 *   can't be played.
 */
export interface Instrument {
	readonly tuning: Tuning;
	readonly capo: number;
	readonly fretCount: number;
	readonly handedness: Handedness;
}

/** One playable spot on the neck and the pitch it sounds. */
export interface FretPosition {
	string: number;
	fret: number;
	midi: number;
	pitchClass: PitchClass;
}

/** Inclusive fret range. */
export interface FretRange {
	min: number;
	max: number;
}

export type InstrumentErrorCode =
	| 'invalid-string-count'
	| 'invalid-open-pitch'
	| 'invalid-fret-count'
	| 'invalid-capo'
	| 'pitch-out-of-range';

export interface InstrumentError {
	code: InstrumentErrorCode;
	message: string;
}

export type InstrumentResult =
	| { ok: true; instrument: Instrument }
	| { ok: false; errors: InstrumentError[] };
