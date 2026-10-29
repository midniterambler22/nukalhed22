import { lowestPlayableFret, openMidiForString, stringCount } from './instrument';
import { midiToPitchClass, type MidiNote, type PitchClass } from '../music-theory';
import type { FretPosition, FretRange, Instrument } from './types';

export function isPlayable(instrument: Instrument, string: number, fret: number): boolean {
	return (
		Number.isInteger(string) &&
		string >= 1 &&
		string <= stringCount(instrument) &&
		Number.isInteger(fret) &&
		fret >= lowestPlayableFret(instrument) &&
		fret <= instrument.fretCount
	);
}

/** MIDI pitch sounded at (string, absolute fret). Throws RangeError if unplayable. */
export function pitchAt(instrument: Instrument, string: number, fret: number): MidiNote {
	if (!isPlayable(instrument, string, fret)) {
		throw new RangeError(
			`String ${string}, fret ${fret} isn't playable (strings 1–${stringCount(instrument)}, frets ${lowestPlayableFret(instrument)}–${instrument.fretCount}).`,
		);
	}
	return openMidiForString(instrument, string) + fret;
}

export function positionAt(instrument: Instrument, string: number, fret: number): FretPosition {
	const midi = pitchAt(instrument, string, fret);
	return { string, fret, midi, pitchClass: midiToPitchClass(midi) };
}

/** The playable range, optionally narrowed. Throws if `range` is invalid or empty after clamping. */
export function playableRange(instrument: Instrument, range?: FretRange): FretRange {
	const lowest = lowestPlayableFret(instrument);
	if (!range) {
		return { min: lowest, max: instrument.fretCount };
	}
	if (!Number.isInteger(range.min) || !Number.isInteger(range.max) || range.min > range.max) {
		throw new RangeError(`Invalid fret range ${range.min}–${range.max}.`);
	}
	const min = Math.max(range.min, lowest);
	const max = Math.min(range.max, instrument.fretCount);
	if (min > max) {
		throw new RangeError(`Fret range ${range.min}–${range.max} has no playable frets.`);
	}
	return { min, max };
}

/**
 * Every playable position in the range, ordered by string (1 first) then fret.
 */
export function allPositions(instrument: Instrument, range?: FretRange): FretPosition[] {
	const { min, max } = playableRange(instrument, range);
	const positions: FretPosition[] = [];
	for (let string = 1; string <= stringCount(instrument); string++) {
		for (let fret = min; fret <= max; fret++) {
			positions.push(positionAt(instrument, string, fret));
		}
	}
	return positions;
}

export type PitchQuery = { pitchClass: PitchClass } | { midi: MidiNote };

/**
 * Every position that sounds a pitch class (any octave) or an exact MIDI pitch.
 */
export function findPositions(
	instrument: Instrument,
	query: PitchQuery,
	range?: FretRange,
): FretPosition[] {
	const matches =
		'midi' in query
			? (p: FretPosition) => p.midi === query.midi
			: (p: FretPosition) => p.pitchClass === query.pitchClass;
	return allPositions(instrument, range).filter(matches);
}
