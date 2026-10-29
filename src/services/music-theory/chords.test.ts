import { describe, expect, it } from 'vitest';
import {
	CHORD_QUALITIES,
	chordPitchClasses,
	chordTones,
	formatChordSymbol,
	isChordSymbol,
	parseChordSymbol,
} from './chords';
import { TheoryError } from './errors';
import { formatInterval } from './intervals';
import { formatNote } from './notes';

function tones(symbol: string): string {
	return chordTones(symbol)
		.map(({ note }) => formatNote(note))
		.join(' ');
}

describe('chord tones', () => {
	it.each([
		['C', 'C E G'],
		['A', 'A C# E'],
		['Am', 'A C E'],
		['F#m', 'F# A C#'],
		['Bb', 'Bb D F'],
		['Bdim', 'B D F'],
		['Caug', 'C E G#'],
		['Dsus2', 'D E A'],
		['Dsus4', 'D G A'],
		['E5', 'E B'],
		['C6', 'C E G A'],
		['Am6', 'A C E F#'],
		['G7', 'G B D F'],
		['E7', 'E G# B D'],
		['Cmaj7', 'C E G B'],
		['Fmaj7', 'F A C E'],
		['Am7', 'A C E G'],
		['Bm7b5', 'B D F A'],
		['Bdim7', 'B D F Ab'],
		['A7sus4', 'A D E G'],
		['Cadd9', 'C E G D'],
		['E9', 'E G# B D F#'],
		['Ebm', 'Eb Gb Bb'],
		['Abmaj7', 'Ab C Eb G'],
	])('%s = %s', (symbol, expected) => {
		expect(tones(symbol)).toBe(expected);
	});

	it('labels each chord tone with its interval', () => {
		expect(chordTones('Am7').map(({ interval }) => formatInterval(interval))).toEqual([
			'1',
			'b3',
			'5',
			'b7',
		]);
	});

	it('returns pitch classes from the root up', () => {
		expect(chordPitchClasses('Am')).toEqual([9, 0, 4]);
		expect(chordPitchClasses('G7')).toEqual([7, 11, 2, 5]);
	});
});

describe('chord symbols', () => {
	it('accepts common aliases', () => {
		expect(parseChordSymbol('Amin').quality).toBe('minor');
		expect(parseChordSymbol('A-').quality).toBe('minor');
		expect(parseChordSymbol('CM7').quality).toBe('major7');
		expect(parseChordSymbol('CΔ7').quality).toBe('major7');
		expect(parseChordSymbol('Bø').quality).toBe('half-diminished7');
		expect(parseChordSymbol('Dsus').quality).toBe('sus4');
		expect(parseChordSymbol('F♯m').root).toEqual({ letter: 'F', accidental: 1 });
	});

	it('reads slash chords without adding the bass to the chord tones', () => {
		const chord = parseChordSymbol('C/G');
		expect(chord.bass).toEqual({ letter: 'G', accidental: 0 });
		expect(tones('C/G')).toBe('C E G');
		expect(formatChordSymbol(parseChordSymbol('D/F#'))).toBe('D/F#');
	});

	it('writes symbols in canonical form', () => {
		expect(formatChordSymbol(parseChordSymbol('Amin7'))).toBe('Am7');
		expect(formatChordSymbol(parseChordSymbol('Bbmaj'))).toBe('Bb');
		expect(formatChordSymbol(parseChordSymbol('F#m7b5'), 'unicode')).toBe('F♯m7b5');
	});

	it.each(['', 'H7', 'Cmaj13#11', 'C/H', 'Am7/', 'm7'])('rejects "%s"', (symbol) => {
		expect(() => parseChordSymbol(symbol)).toThrow(TheoryError);
		expect(isChordSymbol(symbol)).toBe(false);
	});

	it('defines every quality with a symbol that parses back to itself', () => {
		for (const quality of Object.values(CHORD_QUALITIES)) {
			expect(parseChordSymbol(`C${quality.symbol}`).quality).toBe(quality.id);
		}
	});
});
