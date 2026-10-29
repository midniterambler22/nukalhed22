import { describe, expect, it } from 'vitest';
import { TheoryError } from './errors';
import { formatInterval, intervalName, parseInterval, transposeNote } from './intervals';
import { formatNote, parseNoteName } from './notes';

describe('intervals', () => {
	it.each([
		['1', 1, 0],
		['b2', 2, 1],
		['2', 2, 2],
		['b3', 3, 3],
		['3', 3, 4],
		['4', 4, 5],
		['#4', 4, 6],
		['b5', 5, 6],
		['5', 5, 7],
		['#5', 5, 8],
		['b6', 6, 8],
		['6', 6, 9],
		['bb7', 7, 9],
		['b7', 7, 10],
		['7', 7, 11],
		['8', 8, 12],
		['b9', 9, 13],
		['9', 9, 14],
		['#9', 9, 15],
		['11', 11, 17],
		['#11', 11, 18],
		['13', 13, 21],
	])('%s is degree %i, %i semitones', (token, degree, semitones) => {
		const interval = parseInterval(token);
		expect(interval).toEqual({ degree, semitones });
		expect(formatInterval(interval)).toBe(token);
	});

	it.each(['0', 'x3', '3b', '', '16', 'm3'])('rejects "%s"', (token) => {
		expect(() => parseInterval(token)).toThrow(TheoryError);
	});

	it.each([
		['1', 'unison'],
		['b3', 'minor third'],
		['3', 'major third'],
		['4', 'perfect fourth'],
		['#4', 'augmented fourth'],
		['b5', 'diminished fifth'],
		['5', 'perfect fifth'],
		['b7', 'minor seventh'],
		['bb7', 'diminished seventh'],
		['7', 'major seventh'],
		['8', 'perfect octave'],
		['9', 'major ninth'],
	])('%s is a %s', (token, name) => {
		expect(intervalName(parseInterval(token))).toBe(name);
	});

	it.each([
		['A', 'b3', 'C'],
		['A', '5', 'E'],
		['E', 'b5', 'Bb'],
		['E', '#4', 'A#'],
		['F', '4', 'Bb'],
		['B', '3', 'D#'],
		['Bb', 'b3', 'Db'],
		['G#', '7', 'F##'],
		['Cb', '3', 'Eb'],
		['C', 'bb7', 'Bbb'],
		['D', '9', 'E'],
	])('%s + %s = %s', (root, token, expected) => {
		expect(formatNote(transposeNote(parseNoteName(root), parseInterval(token)))).toBe(expected);
	});

	it('refuses spellings that need triple accidentals', () => {
		expect(() => transposeNote(parseNoteName('Fbb'), parseInterval('b3'))).toThrow(TheoryError);
	});
});
