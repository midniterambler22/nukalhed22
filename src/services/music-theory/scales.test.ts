import { describe, expect, it } from 'vitest';
import { TheoryError } from './errors';
import { formatInterval } from './intervals';
import { formatNote, noteToPitchClass, parseNoteName } from './notes';
import { parseFormula } from './formula';
import {
	SCALES,
	SCALE_IDS,
	isScaleId,
	scaleContains,
	scaleDegreeOf,
	scalePitchClasses,
	spellScale,
	type ScaleId,
} from './scales';

function names(root: string, id: ScaleId): string {
	return spellScale(root, id)
		.map(({ note }) => formatNote(note))
		.join(' ');
}

describe('scale library', () => {
	it('has the seven starter scales', () => {
		expect([...SCALE_IDS].sort()).toEqual(
			[
				'blues',
				'dorian',
				'major',
				'major-pentatonic',
				'minor-pentatonic',
				'mixolydian',
				'natural-minor',
			].sort(),
		);
		expect(isScaleId('dorian')).toBe(true);
		expect(isScaleId('lydian')).toBe(false);
	});

	it('stores scales as interval formulas', () => {
		expect(SCALES['minor-pentatonic'].formula).toEqual(['1', 'b3', '4', '5', 'b7']);
		expect(SCALES['major-pentatonic'].formula).toEqual(['1', '2', '3', '5', '6']);
		expect(SCALES.blues.formula).toEqual(['1', 'b3', '4', 'b5', '5', 'b7']);
		expect(SCALES.major.formula).toEqual(['1', '2', '3', '4', '5', '6', '7']);
		expect(SCALES['natural-minor'].formula).toEqual(['1', '2', 'b3', '4', '5', 'b6', 'b7']);
		expect(SCALES.mixolydian.formula).toEqual(['1', '2', '3', '4', '5', '6', 'b7']);
		expect(SCALES.dorian.formula).toEqual(['1', '2', 'b3', '4', '5', '6', 'b7']);
	});

	it('uses each letter once in every seven-note scale, for every root', () => {
		const roots = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
		for (const id of ['major', 'natural-minor', 'mixolydian', 'dorian'] as const) {
			for (const root of roots) {
				const letters = spellScale(root, id).map(({ note }) => note.letter);
				expect(new Set(letters).size, `${root} ${id}`).toBe(7);
			}
		}
	});

	it('rejects malformed formulas', () => {
		expect(() => parseFormula(['b3', '5'])).toThrow(TheoryError);
		expect(() => parseFormula(['1', '5', '3'])).toThrow(TheoryError);
		expect(() => parseFormula(['1', 'b5', '#4'])).toThrow(TheoryError);
	});
});

describe('scale spelling', () => {
	// TESTING.md: A minor pentatonic = A C D E G.
	it.each([
		['A', 'minor-pentatonic', 'A C D E G'],
		['E', 'minor-pentatonic', 'E G A B D'],
		['C', 'major-pentatonic', 'C D E G A'],
		['G', 'major-pentatonic', 'G A B D E'],
		['A', 'blues', 'A C D Eb E G'],
		['E', 'blues', 'E G A Bb B D'],
		['C', 'major', 'C D E F G A B'],
		['F', 'major', 'F G A Bb C D E'],
		['G', 'major', 'G A B C D E F#'],
		['Eb', 'major', 'Eb F G Ab Bb C D'],
		['F#', 'major', 'F# G# A# B C# D# E#'],
		['A', 'natural-minor', 'A B C D E F G'],
		['E', 'natural-minor', 'E F# G A B C D'],
		['C', 'natural-minor', 'C D Eb F G Ab Bb'],
		['G', 'mixolydian', 'G A B C D E F'],
		['A', 'mixolydian', 'A B C# D E F# G'],
		['D', 'dorian', 'D E F G A B C'],
		['A', 'dorian', 'A B C D E F# G'],
	] as const)('%s %s = %s', (root, id, expected) => {
		expect(names(root, id)).toBe(expected);
	});

	it('gives each scale note its interval from the root', () => {
		const intervals = spellScale('A', 'blues').map(({ interval }) => formatInterval(interval));
		expect(intervals).toEqual(['1', 'b3', '4', 'b5', '5', 'b7']);
	});

	it('relates modes to their parent major scale', () => {
		const pcs = (root: string, id: ScaleId) =>
			[...scalePitchClasses(noteToPitchClass(parseNoteName(root)), id)].sort((a, b) => a - b);
		expect(pcs('A', 'natural-minor')).toEqual(pcs('C', 'major'));
		expect(pcs('D', 'dorian')).toEqual(pcs('C', 'major'));
		expect(pcs('G', 'mixolydian')).toEqual(pcs('C', 'major'));
		expect(pcs('A', 'minor-pentatonic')).toEqual(pcs('C', 'major-pentatonic'));
	});
});

describe('scale membership', () => {
	it('finds pitch classes in A minor pentatonic', () => {
		const a = 9;
		expect(scalePitchClasses(a, 'minor-pentatonic')).toEqual([9, 0, 2, 4, 7]);
		expect(scaleContains(0, a, 'minor-pentatonic')).toBe(true); // C
		expect(scaleContains(11, a, 'minor-pentatonic')).toBe(false); // B
		const g = scaleDegreeOf(7, a, 'minor-pentatonic');
		expect(g && formatInterval(g)).toBe('b7');
		expect(scaleDegreeOf(3, a, 'minor-pentatonic')).toBeUndefined(); // Eb
		const eFlat = scaleDegreeOf(3, a, 'blues');
		expect(eFlat && formatInterval(eFlat)).toBe('b5');
	});
});
