import { describe, expect, it } from 'vitest';
import { chordTonesInScale, formatInterval, formatNote, romanNumeral } from '.';

const A = 9;
const C = 0;

describe('romanNumeral', () => {
	it('names the 12-bar blues in A as I, IV and V', () => {
		expect(['A7', 'D7', 'E7'].map((c) => romanNumeral(c, A))).toEqual(['I', 'IV', 'V']);
	});

	it('uses case for the third and marks diminished chords', () => {
		expect(
			['C', 'Dm', 'Em7', 'F', 'G7', 'Am', 'Bdim', 'Bm7b5'].map((c) => romanNumeral(c, C)),
		).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°', 'viiø']);
	});

	it('marks borrowed roots with flats and sharps', () => {
		expect(romanNumeral('F', A)).toBe('♭VI');
		expect(romanNumeral('G', A)).toBe('♭VII');
		expect(romanNumeral('Bb', A)).toBe('♭II');
		expect(romanNumeral('F#dim', C)).toBe('♯iv°');
	});
});

describe('chordTonesInScale', () => {
	it('A7 over A minor pentatonic: C♯ is the one chord tone outside the scale', () => {
		const tones = chordTonesInScale('A7', A, 'minor-pentatonic');
		expect(
			tones.map((t) => [
				formatNote(t.note),
				formatInterval(t.interval),
				t.scaleInterval ? formatInterval(t.scaleInterval) : null,
			]),
		).toEqual([
			['A', '1', '1'],
			['C#', '3', null],
			['E', '5', '5'],
			['G', 'b7', 'b7'],
		]);
	});

	it('E7 over A minor pentatonic: G♯ is outside, B too; E and D are in', () => {
		const tones = chordTonesInScale('E7', A, 'minor-pentatonic');
		expect(tones.filter((t) => t.scaleInterval).map((t) => formatNote(t.note))).toEqual([
			'E',
			'D',
		]);
	});
});
