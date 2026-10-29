import type { MidiNote } from '../music-theory';
import { STANDARD_TUNING } from './tunings';
import type { Handedness, Instrument, InstrumentError, InstrumentResult, Tuning } from './types';

export const MIN_STRINGS = 4;
export const MAX_STRINGS = 12;
export const MIN_FRETS = 12;
export const MAX_FRETS = 36;
export const DEFAULT_FRET_COUNT = 22;

export interface InstrumentOptions {
	tuning?: Tuning;
	capo?: number;
	fretCount?: number;
	handedness?: Handedness;
}

/**
 * Validates options and builds an instrument. Never throws: invalid input
 * (e.g. a tuning loaded from a saved session) comes back as a list of errors.
 */
export function createInstrument(options: InstrumentOptions = {}): InstrumentResult {
	const tuning = options.tuning ?? STANDARD_TUNING;
	const capo = options.capo ?? 0;
	const fretCount = options.fretCount ?? DEFAULT_FRET_COUNT;
	const handedness = options.handedness ?? 'right';
	const errors: InstrumentError[] = [];

	const stringCount = tuning.openMidi.length;
	if (stringCount < MIN_STRINGS || stringCount > MAX_STRINGS) {
		errors.push({
			code: 'invalid-string-count',
			message: `A tuning needs ${MIN_STRINGS}–${MAX_STRINGS} strings; got ${stringCount}.`,
		});
	}

	tuning.openMidi.forEach((midi, index) => {
		if (!Number.isInteger(midi) || midi < 0 || midi > 127) {
			errors.push({
				code: 'invalid-open-pitch',
				message: `Open pitch ${index + 1} (low to high) must be a MIDI number 0–127; got ${midi}.`,
			});
		}
	});

	if (!Number.isInteger(fretCount) || fretCount < MIN_FRETS || fretCount > MAX_FRETS) {
		errors.push({
			code: 'invalid-fret-count',
			message: `Fret count must be a whole number from ${MIN_FRETS} to ${MAX_FRETS}; got ${fretCount}.`,
		});
	}

	if (!Number.isInteger(capo) || capo < 0 || capo >= fretCount) {
		errors.push({
			code: 'invalid-capo',
			message: `Capo must be a whole fret from 0 (none) to ${fretCount - 1}; got ${capo}.`,
		});
	}

	if (errors.length === 0) {
		const highest = Math.max(...tuning.openMidi) + fretCount;
		if (highest > 127) {
			errors.push({
				code: 'pitch-out-of-range',
				message: `The highest fret would sound MIDI ${highest}, above 127.`,
			});
		}
	}

	if (errors.length > 0) {
		return { ok: false, errors };
	}
	return {
		ok: true,
		instrument: {
			tuning: { name: tuning.name, openMidi: [...tuning.openMidi] },
			capo,
			fretCount,
			handedness,
		},
	};
}

/** Like `createInstrument`, but throws. For known-good built-in configs. */
export function createInstrumentOrThrow(options: InstrumentOptions = {}): Instrument {
	const result = createInstrument(options);
	if (!result.ok) {
		throw new RangeError(result.errors.map((e) => e.message).join(' '));
	}
	return result.instrument;
}

export function stringCount(instrument: Instrument): number {
	return instrument.tuning.openMidi.length;
}

/** Open pitch for a string number (1 = highest-pitched string). */
export function openMidiForString(instrument: Instrument, string: number): MidiNote {
	const count = stringCount(instrument);
	if (!Number.isInteger(string) || string < 1 || string > count) {
		throw new RangeError(`String must be 1–${count}; got ${string}.`);
	}
	const midi = instrument.tuning.openMidi[count - string];
	if (midi === undefined) {
		throw new RangeError(`No open pitch for string ${string}.`);
	}
	return midi;
}

/** The capo fret, or 0 with no capo. */
export function lowestPlayableFret(instrument: Instrument): number {
	return instrument.capo;
}
