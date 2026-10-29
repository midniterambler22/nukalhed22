import { isPlayable, positionAt } from './fretboard';
import { lowestPlayableFret, openMidiForString, stringCount } from './instrument';
import type { FretPosition, FretRange, Instrument } from './types';

/**
 * Five connected pentatonic positions, computed from the instrument.
 *
 * Each position is a two-notes-per-string walk up the scale that starts on
 * one scale degree on the lowest string. Position 1 starts on the root,
 * position 2 on the next scale degree, and so on. Nothing is hardcoded per
 * key or tuning: every fret comes from the instrument's pitch mapping.
 *
 * Neighbouring positions overlap by one note per string, so the list of
 * positions along the neck is the "connected" system: position 5 leads into
 * position 1 an octave higher.
 */

export const POSITION_COUNT = 5;

/** Widest fret span (first to last fret) accepted for one position. */
export const MAX_POSITION_SPAN = 5;

const NOTES_PER_STRING = 2;

export interface PositionNote extends FretPosition {
	/** Semitones above the scale root, 0–11. */
	interval: number;
	isRoot: boolean;
}

export interface ScalePosition {
	/** 1–5. */
	number: number;
	/** Ordered from the lowest string to the highest, low fret first: ascending pitch. */
	notes: readonly PositionNote[];
	fretRange: FretRange;
	/** The lowest-pitched string, where the position's first note sits. */
	startString: number;
	/** Fret of the position's first note on `startString`. */
	startFret: number;
	roots: readonly PositionNote[];
}

export type Register = 'low' | 'middle' | 'high';

export const REGISTERS: readonly Register[] = ['low', 'middle', 'high'];

function mod12(value: number): number {
	return ((value % 12) + 12) % 12;
}

/**
 * Throws unless `intervals` is a pentatonic formula: five ascending semitone
 * offsets from 0 within the octave. The formula itself comes from the theory module.
 */
function assertPentatonicFormula(intervals: readonly number[]): void {
	if (intervals.length !== POSITION_COUNT) {
		throw new RangeError(`A pentatonic scale needs ${POSITION_COUNT} intervals; got ${intervals.length}.`);
	}
	intervals.forEach((interval, index) => {
		const previous = index === 0 ? -1 : (intervals[index - 1] ?? -1);
		if (!Number.isInteger(interval) || interval <= previous || interval > 11 || (index === 0 && interval !== 0)) {
			throw new RangeError(`Scale intervals must start at 0 and ascend within 0–11; got ${intervals.join(', ')}.`);
		}
	});
}

/** Strings ordered from the lowest-pitched to the highest. */
function stringsLowToHigh(instrument: Instrument): number[] {
	const strings: number[] = [];
	for (let string = stringCount(instrument); string >= 1; string--) {
		strings.push(string);
	}
	return strings;
}

function nextScaleMidi(midi: number, root: number, intervals: readonly number[]): number {
	let candidate = midi + 1;
	while (!intervals.includes(mod12(candidate - root))) {
		candidate++;
	}
	return candidate;
}

function toPositionNote(instrument: Instrument, string: number, fret: number, root: number): PositionNote {
	const position = positionAt(instrument, string, fret);
	const interval = mod12(position.pitchClass - root);
	return { ...position, interval, isRoot: interval === 0 };
}

/**
 * Builds the position whose first note is at `startFret` on the lowest string.
 * Returns null when a note falls off the neck or the shape is too wide to play.
 */
function buildPosition(
	instrument: Instrument,
	strings: readonly number[],
	root: number,
	intervals: readonly number[],
	number: number,
	startFret: number,
): ScalePosition | null {
	const startString = strings[0];
	if (startString === undefined) {
		return null;
	}
	const notes: PositionNote[] = [];
	let midi = openMidiForString(instrument, startString) + startFret;

	for (const string of strings) {
		const open = openMidiForString(instrument, string);
		for (let i = 0; i < NOTES_PER_STRING; i++) {
			if (notes.length > 0) {
				midi = nextScaleMidi(midi, root, intervals);
			}
			const fret = midi - open;
			if (!isPlayable(instrument, string, fret)) {
				return null;
			}
			notes.push(toPositionNote(instrument, string, fret, root));
		}
	}

	const frets = notes.map((note) => note.fret);
	const fretRange = { min: Math.min(...frets), max: Math.max(...frets) };
	if (fretRange.max - fretRange.min > MAX_POSITION_SPAN) {
		return null;
	}
	return {
		number,
		notes,
		fretRange,
		startString,
		startFret,
		roots: notes.filter((note) => note.isRoot),
	};
}

/**
 * Every playable instance of the five positions, ordered from the nut toward
 * the body. Adjacent entries are connected neighbours.
 *
 * @param root pitch class of the scale root (0 = C)
 * @param intervals pentatonic formula from the theory module, e.g. minor pentatonic 0 3 5 7 10
 */
export function getScalePositions(instrument: Instrument, root: number, intervals: readonly number[]): ScalePosition[] {
	assertPentatonicFormula(intervals);
	const rootPitchClass = mod12(root);
	const strings = stringsLowToHigh(instrument);
	const lowest = strings[0];
	const positions: ScalePosition[] = [];
	if (lowest === undefined) {
		return positions;
	}

	for (let fret = lowestPlayableFret(instrument); fret <= instrument.fretCount; fret++) {
		const degree = intervals.indexOf(mod12(positionAt(instrument, lowest, fret).pitchClass - rootPitchClass));
		if (degree === -1) {
			continue;
		}
		const position = buildPosition(instrument, strings, rootPitchClass, intervals, degree + 1, fret);
		if (position) {
			positions.push(position);
		}
	}
	return positions;
}

/** The exact string/fret locations two positions have in common. */
export function getSharedNotes(a: ScalePosition, b: ScalePosition): PositionNote[] {
	return a.notes.filter((note) => b.notes.some((other) => other.string === note.string && other.fret === note.fret));
}

function indexOfPosition(positions: readonly ScalePosition[], position: ScalePosition): number {
	return positions.findIndex((p) => p.number === position.number && p.startFret === position.startFret);
}

/** The connected position one step up the neck, or null at the top. */
export function getNextPosition(positions: readonly ScalePosition[], current: ScalePosition): ScalePosition | null {
	const index = indexOfPosition(positions, current);
	return index === -1 ? null : (positions[index + 1] ?? null);
}

/** The connected position one step down the neck, or null at the bottom. */
export function getPreviousPosition(positions: readonly ScalePosition[], current: ScalePosition): ScalePosition | null {
	const index = indexOfPosition(positions, current);
	return index <= 0 ? null : (positions[index - 1] ?? null);
}

function centerFret(position: ScalePosition): number {
	return (position.fretRange.min + position.fretRange.max) / 2;
}

/** The fret span covered by a register: one third of the playable neck. */
export function registerRange(instrument: Instrument, register: Register): FretRange {
	const lowest = lowestPlayableFret(instrument);
	const third = (instrument.fretCount - lowest) / 3;
	const index = REGISTERS.indexOf(register);
	return { min: lowest + third * index, max: lowest + third * (index + 1) };
}

/**
 * Positions for a register, best first. A position belongs to the register
 * whose third of the playable neck holds its center fret; the best is the one
 * closest to the middle of that third. If no position falls inside the third,
 * the positions nearest to it are returned, so a register always selects real
 * shapes on the neck.
 */
export function selectRegister(
	instrument: Instrument,
	positions: readonly ScalePosition[],
	register: Register,
): ScalePosition[] {
	const { min, max } = registerRange(instrument, register);
	const target = (min + max) / 2;
	const isTopRegister = register === 'high';
	const inside = positions.filter((p) => {
		const center = centerFret(p);
		return center >= min && (center < max || (isTopRegister && center <= max));
	});
	const candidates = inside.length > 0 ? inside : [...positions];
	return candidates.sort((a, b) => Math.abs(centerFret(a) - target) - Math.abs(centerFret(b) - target));
}
