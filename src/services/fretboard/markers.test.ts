import { describe, expect, it } from 'vitest';
import { chordPitchClasses, parseChordSymbol, scalePitchClasses } from '../music-theory';
import { createInstrumentOrThrow, isMarked, markPositions } from './index';

const guitar = createInstrumentOrThrow();
// A minor pentatonic: A C D E G. Am chord tones: A C E. Pitch classes: A=9 C=0 D=2 E=4 G=7.
const A_MINOR_PENTATONIC = scalePitchClasses(9, 'minor-pentatonic');
const A_MINOR_CHORD = chordPitchClasses(parseChordSymbol('Am'));

describe('markPositions', () => {
	const marked = markPositions(
		guitar,
		{ root: 9, scale: A_MINOR_PENTATONIC, chordTones: A_MINOR_CHORD },
		{ min: 5, max: 8 },
	);
	const at = (string: number, fret: number) => {
		const position = marked.find((p) => p.string === string && p.fret === fret);
		if (!position) throw new Error(`No position at string ${string}, fret ${fret}`);
		return position;
	};

	it('matches the A minor pentatonic position 1 box from TESTING.md', () => {
		const box: Record<number, number[]> = {
			6: [5, 8],
			5: [5, 7],
			4: [5, 7],
			3: [5, 7],
			2: [5, 8],
			1: [5, 8],
		};
		for (const [string, frets] of Object.entries(box)) {
			const inScale = marked
				.filter((p) => p.string === Number(string) && p.isScaleNote)
				.map((p) => p.fret);
			expect(inScale).toEqual(frets);
		}
	});

	it('roots inside the box are string 6 fret 5, string 4 fret 7, string 1 fret 5', () => {
		expect(marked.filter((p) => p.isRoot).map((p) => [p.string, p.fret])).toEqual([
			[1, 5],
			[4, 7],
			[6, 5],
		]);
	});

	it('roles are independent: a root can also be a chord tone and scale note', () => {
		expect(at(6, 5)).toMatchObject({ isRoot: true, isScaleNote: true, isChordTone: true });
		expect(at(5, 5)).toMatchObject({ isRoot: false, isScaleNote: true, isChordTone: false }); // D
		expect(at(5, 7)).toMatchObject({ isRoot: false, isScaleNote: true, isChordTone: true }); // E
		expect(at(6, 6)).toMatchObject({ isRoot: false, isScaleNote: false, isChordTone: false }); // A♯
		expect(isMarked(at(6, 6))).toBe(false);
	});

	it('marks nothing when no highlight is given', () => {
		expect(markPositions(guitar, {}).some(isMarked)).toBe(false);
	});

	it('a chord tone outside the scale is still marked', () => {
		// E7 over A minor pentatonic: G♯ (8) is a chord tone but not in the scale.
		const withGSharp = markPositions(guitar, {
			scale: A_MINOR_PENTATONIC,
			chordTones: chordPitchClasses(parseChordSymbol('E7')),
		});
		const gSharp = withGSharp.find((p) => p.string === 6 && p.fret === 4);
		expect(gSharp).toMatchObject({ isScaleNote: false, isChordTone: true });
	});
});
