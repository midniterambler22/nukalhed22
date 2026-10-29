import { describe, expect, it } from 'vitest';
import { TheoryError } from './errors';
import {
	formatNote,
	formatPitch,
	isEnharmonic,
	isNoteName,
	midiToPitch,
	midiToPitchClass,
	noteToPitchClass,
	parseNoteName,
	parsePitch,
	spellPitchClass,
	spellPitchClassInContext,
	toMidi,
} from './notes';
import { semitonesBetween, toPitchClass, transposePitchClass } from './pitch-class';
import type { PitchClass } from './types';

const ALL_PITCH_CLASSES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

describe('pitch classes', () => {
	it('wraps any integer into 0–11', () => {
		expect(toPitchClass(12)).toBe(0);
		expect(toPitchClass(-1)).toBe(11);
		expect(toPitchClass(40)).toBe(4);
		expect(toPitchClass(-25)).toBe(11);
	});

	it('rejects non-integers', () => {
		expect(() => toPitchClass(1.5)).toThrow(RangeError);
	});

	it('measures upward semitone distance', () => {
		expect(semitonesBetween(9, 0)).toBe(3); // A up to C
		expect(semitonesBetween(0, 9)).toBe(9);
		expect(semitonesBetween(4, 4)).toBe(0);
	});

	it('transposes in both directions', () => {
		expect(transposePitchClass(11, 1)).toBe(0);
		expect(transposePitchClass(0, -3)).toBe(9);
		expect(transposePitchClass(4, 24)).toBe(4);
	});
});

describe('note names', () => {
	it.each([
		['C', 0],
		['C#', 1],
		['Db', 1],
		['F♯', 6],
		['G♭', 6],
		['B', 11],
		['Cb', 11],
		['B#', 0],
		['E#', 5],
		['Fb', 4],
		['Ebb', 2],
		['Fx', 7],
		['a', 9],
	])('%s is pitch class %i', (name, pitchClass) => {
		expect(noteToPitchClass(parseNoteName(name))).toBe(pitchClass);
	});

	it.each(['H', '', 'C#4', 'Cbbb', 'C$', 'Am'])('rejects "%s"', (name) => {
		expect(() => parseNoteName(name)).toThrow(TheoryError);
		expect(isNoteName(name)).toBe(false);
	});

	it('treats enharmonic spellings as the same sound but different names', () => {
		const fSharp = parseNoteName('F#');
		const gFlat = parseNoteName('Gb');
		expect(isEnharmonic(fSharp, gFlat)).toBe(true);
		expect(formatNote(fSharp)).toBe('F#');
		expect(formatNote(gFlat)).toBe('Gb');
	});

	it('formats accidentals as ascii or unicode', () => {
		expect(formatNote(parseNoteName('Bb'), 'unicode')).toBe('B♭');
		expect(formatNote(parseNoteName('F##'), 'unicode')).toBe('F𝄪');
		expect(formatNote(parseNoteName('Ebb'))).toBe('Ebb');
	});

	it('spells every pitch class with sharps or flats and round-trips', () => {
		for (const pc of ALL_PITCH_CLASSES) {
			expect(noteToPitchClass(spellPitchClass(pc, 'sharp'))).toBe(pc);
			expect(noteToPitchClass(spellPitchClass(pc, 'flat'))).toBe(pc);
		}
		expect(formatNote(spellPitchClass(10, 'sharp'))).toBe('A#');
		expect(formatNote(spellPitchClass(10, 'flat'))).toBe('Bb');
	});

	it('spells from context first, then by the context’s accidental style', () => {
		const fMajor = ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'].map(parseNoteName);
		expect(formatNote(spellPitchClassInContext(10, fMajor))).toBe('Bb');
		expect(formatNote(spellPitchClassInContext(3 as PitchClass, fMajor))).toBe('Eb');
		const gMajor = ['G', 'A', 'B', 'C', 'D', 'E', 'F#'].map(parseNoteName);
		expect(formatNote(spellPitchClassInContext(6, gMajor))).toBe('F#');
		expect(formatNote(spellPitchClassInContext(1, gMajor))).toBe('C#');
	});
});

describe('pitches and MIDI numbers', () => {
	// Standard-tuning open strings, low to high (TESTING.md reference values).
	it.each([
		['E2', 40],
		['A2', 45],
		['D3', 50],
		['G3', 55],
		['B3', 59],
		['E4', 64],
		['C4', 60],
		['A4', 69],
		['E5', 76],
		['F#2', 42],
	])('%s is MIDI %i', (text, midi) => {
		expect(parsePitch(text).midi).toBe(midi);
	});

	it('keeps the octave with the letter across the B/C boundary', () => {
		expect(parsePitch('Cb4').midi).toBe(59);
		expect(parsePitch('B#3').midi).toBe(60);
		expect(toMidi(parseNoteName('C'), -1)).toBe(0);
	});

	it('converts MIDI back to a named pitch', () => {
		expect(formatPitch(midiToPitch(40))).toBe('E2');
		expect(formatPitch(midiToPitch(42))).toBe('F#2');
		expect(formatPitch(midiToPitch(42, 'flat'))).toBe('Gb2');
		expect(formatPitch(midiToPitch(60))).toBe('C4');
		expect(formatPitch(midiToPitch(59, [parseNoteName('Cb')]))).toBe('Cb4');
		expect(formatPitch(midiToPitch(60, [parseNoteName('B#')]))).toBe('B#3');
	});

	it('round-trips every MIDI note from 0 to 127', () => {
		for (let midi = 0; midi <= 127; midi++) {
			const pitch = midiToPitch(midi);
			expect(parsePitch(formatPitch(pitch)).midi).toBe(midi);
			expect(midiToPitchClass(midi)).toBe(midi % 12);
		}
	});

	it('rejects malformed pitches and MIDI numbers', () => {
		expect(() => parsePitch('E')).toThrow(TheoryError);
		expect(() => parsePitch('H2')).toThrow(TheoryError);
		expect(() => midiToPitchClass(40.5)).toThrow(RangeError);
	});
});
