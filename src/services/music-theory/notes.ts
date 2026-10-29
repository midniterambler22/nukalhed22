import { TheoryError } from './errors';
import { toPitchClass } from './pitch-class';
import type {
	AccidentalPreference,
	AccidentalStyle,
	Letter,
	MidiNote,
	Pitch,
	PitchClass,
	SpelledNote,
} from './types';

export const LETTERS: readonly Letter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

/** Pitch class of each natural letter. */
export const LETTER_PITCH_CLASS: Readonly<Record<Letter, PitchClass>> = {
	C: 0,
	D: 2,
	E: 4,
	F: 5,
	G: 7,
	A: 9,
	B: 11,
};

const SHARP_SPELLINGS: readonly SpelledNote[] = [
	{ letter: 'C', accidental: 0 },
	{ letter: 'C', accidental: 1 },
	{ letter: 'D', accidental: 0 },
	{ letter: 'D', accidental: 1 },
	{ letter: 'E', accidental: 0 },
	{ letter: 'F', accidental: 0 },
	{ letter: 'F', accidental: 1 },
	{ letter: 'G', accidental: 0 },
	{ letter: 'G', accidental: 1 },
	{ letter: 'A', accidental: 0 },
	{ letter: 'A', accidental: 1 },
	{ letter: 'B', accidental: 0 },
];

const FLAT_SPELLINGS: readonly SpelledNote[] = [
	{ letter: 'C', accidental: 0 },
	{ letter: 'D', accidental: -1 },
	{ letter: 'D', accidental: 0 },
	{ letter: 'E', accidental: -1 },
	{ letter: 'E', accidental: 0 },
	{ letter: 'F', accidental: 0 },
	{ letter: 'G', accidental: -1 },
	{ letter: 'G', accidental: 0 },
	{ letter: 'A', accidental: -1 },
	{ letter: 'A', accidental: 0 },
	{ letter: 'B', accidental: -1 },
	{ letter: 'B', accidental: 0 },
];

/** Largest accidental accepted when parsing or spelling (double sharp / double flat). */
const MAX_ACCIDENTAL = 2;

const NOTE_NAME_PATTERN = /^([A-Ga-g])([#♯x𝄪b♭𝄫]*)$/u;
const SCIENTIFIC_PITCH_PATTERN = /^([A-Ga-g][#♯x𝄪b♭𝄫]*)(-?\d+)$/u;

function isLetter(value: string): value is Letter {
	return (LETTERS as readonly string[]).includes(value);
}

function parseAccidentals(text: string): number {
	let total = 0;
	for (const symbol of text) {
		switch (symbol) {
			case '#':
			case '♯':
				total += 1;
				break;
			case 'x':
			case '𝄪':
				total += 2;
				break;
			case 'b':
			case '♭':
				total -= 1;
				break;
			case '𝄫':
				total -= 2;
				break;
			default:
				throw new TheoryError(`Unknown accidental "${symbol}"`);
		}
	}
	return total;
}

/**
 * Reads a note name such as "A", "F#", "Bb", "C♯", "Ebb" or "Fx".
 * Throws a TheoryError for anything else, including octave numbers (use parsePitch).
 */
export function parseNoteName(name: string): SpelledNote {
	const match = NOTE_NAME_PATTERN.exec(name.trim());
	const letter = match?.[1]?.toUpperCase();
	if (!match || !letter || !isLetter(letter)) {
		throw new TheoryError(`"${name}" is not a note name`);
	}
	const accidental = parseAccidentals(match[2] ?? '');
	if (Math.abs(accidental) > MAX_ACCIDENTAL) {
		throw new TheoryError(`"${name}" has more than a double accidental`);
	}
	return { letter, accidental };
}

export function isNoteName(name: string): boolean {
	try {
		parseNoteName(name);
		return true;
	} catch {
		return false;
	}
}

/** The pitch class a spelled note sounds as. Cb → 11, B# → 0. */
export function noteToPitchClass(note: SpelledNote): PitchClass {
	return toPitchClass(LETTER_PITCH_CLASS[note.letter] + note.accidental);
}

/** True when both notes sound the same, regardless of spelling (F# and Gb). */
export function isEnharmonic(a: SpelledNote, b: SpelledNote): boolean {
	return noteToPitchClass(a) === noteToPitchClass(b);
}

export function notesEqual(a: SpelledNote, b: SpelledNote): boolean {
	return a.letter === b.letter && a.accidental === b.accidental;
}

function formatAccidental(accidental: number, style: AccidentalStyle): string {
	if (accidental === 0) return '';
	if (style === 'unicode') {
		if (accidental === 2) return '𝄪';
		if (accidental === -2) return '𝄫';
		return (accidental > 0 ? '♯' : '♭').repeat(Math.abs(accidental));
	}
	return (accidental > 0 ? '#' : 'b').repeat(Math.abs(accidental));
}

/** "F#" (ascii, the default) or "F♯" (unicode). */
export function formatNote(note: SpelledNote, style: AccidentalStyle = 'ascii'): string {
	return note.letter + formatAccidental(note.accidental, style);
}

/** Spells a pitch class with no context: sharps (C#) or flats (Db). */
export function spellPitchClass(
	pitchClass: PitchClass,
	preference: AccidentalPreference = 'sharp',
): SpelledNote {
	const table = preference === 'flat' ? FLAT_SPELLINGS : SHARP_SPELLINGS;
	const spelled = table[pitchClass];
	if (!spelled) throw new RangeError(`Invalid pitch class ${pitchClass}`);
	return spelled;
}

/**
 * Spells a pitch class using a context such as a spelled scale or chord.
 * If the pitch class is in the context, that spelling wins (F# in G major, Bb in F major).
 * Otherwise it falls back to flats when the context uses flats, and sharps otherwise.
 */
export function spellPitchClassInContext(
	pitchClass: PitchClass,
	context: readonly SpelledNote[],
): SpelledNote {
	const inContext = context.find((note) => noteToPitchClass(note) === pitchClass);
	if (inContext) return inContext;
	const usesFlats = context.some((note) => note.accidental < 0);
	return spellPitchClass(pitchClass, usesFlats ? 'flat' : 'sharp');
}

/**
 * MIDI number of a spelled note at an octave. The octave follows the letter,
 * so Cb4 is 59 (it sounds as B3) and B#3 is 60 (it sounds as C4).
 */
export function toMidi(note: SpelledNote, octave: number): MidiNote {
	return (octave + 1) * 12 + LETTER_PITCH_CLASS[note.letter] + note.accidental;
}

/** Reads scientific pitch notation such as "E2", "C#4" or "Bb-1". */
export function parsePitch(text: string): Pitch {
	const match = SCIENTIFIC_PITCH_PATTERN.exec(text.trim());
	if (!match || match[1] === undefined || match[2] === undefined) {
		throw new TheoryError(`"${text}" is not a pitch such as E2 or C#4`);
	}
	const note = parseNoteName(match[1]);
	const octave = Number.parseInt(match[2], 10);
	return { note, octave, midi: toMidi(note, octave) };
}

export function midiToPitchClass(midi: MidiNote): PitchClass {
	assertMidi(midi);
	return toPitchClass(midi);
}

/** Builds a Pitch from a MIDI number, spelled with the given preference or context. */
export function midiToPitch(
	midi: MidiNote,
	spelling: AccidentalPreference | readonly SpelledNote[] = 'sharp',
): Pitch {
	const pitchClass = midiToPitchClass(midi);
	const note =
		typeof spelling === 'string'
			? spellPitchClass(pitchClass, spelling)
			: spellPitchClassInContext(pitchClass, spelling);
	// The octave belongs to the letter: midi 59 spelled Cb is Cb4, spelled B is B3.
	const octave = Math.round((midi - LETTER_PITCH_CLASS[note.letter] - note.accidental) / 12) - 1;
	return { note, octave, midi };
}

/** "E2", "C#4" or, with unicode style, "C♯4". */
export function formatPitch(pitch: Pitch, style: AccidentalStyle = 'ascii'): string {
	return formatNote(pitch.note, style) + String(pitch.octave);
}

function assertMidi(midi: MidiNote): void {
	if (!Number.isInteger(midi)) {
		throw new RangeError(`MIDI note must be an integer, got ${midi}`);
	}
}
