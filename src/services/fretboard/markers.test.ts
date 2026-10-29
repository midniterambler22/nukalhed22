import { describe, expect, it } from 'vitest';
import { chordPitchClasses, getScale, parseChordSymbol, scalePitchClasses } from '../music-theory';
import {
	createInstrumentOrThrow,
	filterShapes,
	getScalePositions,
	isMarked,
	markPositions,
	type MarkedPosition,
} from './index';

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

describe('markPositions with shapes', () => {
	const intervals = getScale('minor-pentatonic').intervals.map((i) => i.semitones);
	const shapes = getScalePositions(guitar, 9, intervals);
	const mark = (numbers: number[], chordTones = A_MINOR_CHORD) =>
		markPositions(
			guitar,
			{ root: 9, scale: A_MINOR_PENTATONIC, chordTones },
			undefined,
			filterShapes(shapes, numbers),
		);
	const at = (marked: MarkedPosition[], string: number, fret: number) => {
		const position = marked.find((p) => p.string === string && p.fret === fret);
		if (!position) throw new Error(`No position at string ${string}, fret ${fret}`);
		return position;
	};

	it('just shape 1 marks exactly its notes (both octaves), each tagged shape 1', () => {
		const marked = mark([1]);
		const inShapes = marked.filter((p) => p.isScaleNote);
		const expected = filterShapes(shapes, [1]).flatMap((s) => s.notes);
		expect(inShapes).toHaveLength(expected.length);
		expect(inShapes.every((p) => p.shapeNumbers.includes(1))).toBe(true);
		// Shape 1 sits at frets 5–8 and again at 17–20; nothing at fret 10.
		expect(at(marked, 6, 5)).toMatchObject({ isRoot: true, isScaleNote: true });
		expect(at(marked, 6, 17)).toMatchObject({ isRoot: true });
		expect(at(marked, 4, 10)).toMatchObject({
			isScaleNote: false,
			isChordTone: false,
			shapeNumbers: [],
		});
	});

	it('shapes 1–2 add shape 2 and record shared notes under both numbers', () => {
		const marked = mark([1, 2]);
		expect(at(marked, 4, 10).isScaleNote).toBe(true); // G on the D string, shape 2 only
		expect(at(marked, 4, 10).shapeNumbers).toEqual([2]);
		// Frets 7 and 8 are where shapes 1 and 2 overlap.
		expect(at(marked, 6, 8).shapeNumbers).toEqual([1, 2]);
	});

	it('all five shapes mark every scale note between the first and last shape', () => {
		const marked = mark([1, 2, 3, 4, 5]);
		const unshaped = marked.filter(
			(p) => A_MINOR_PENTATONIC.includes(p.pitchClass) && !p.isScaleNote,
		);
		expect(unshaped.every((p) => p.fret > 20 || p.fret < 2)).toBe(true);
	});

	it('no shapes marks nothing', () => {
		expect(mark([]).some(isMarked)).toBe(false);
	});

	it('keeps a chord tone outside the scale when it is inside a shown shape', () => {
		const marked = mark([1], chordPitchClasses(parseChordSymbol('E7')));
		expect(at(marked, 6, 4)).toMatchObject({ isChordTone: false }); // G♯ left of shape 1 (5–8)
		expect(at(marked, 4, 6)).toMatchObject({ isChordTone: true, isScaleNote: false }); // G♯ inside
	});

	it('without shapes, shapeNumbers is empty', () => {
		expect(markPositions(guitar, { root: 9 }).every((p) => p.shapeNumbers.length === 0)).toBe(
			true,
		);
	});
});
