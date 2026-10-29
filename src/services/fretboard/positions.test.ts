import { describe, expect, it } from 'vitest';
import {
	createInstrumentOrThrow,
	getNextPosition,
	getPreviousPosition,
	getScalePositions,
	getSharedNotes,
	registerRange,
	REGISTERS,
	selectRegister,
	MAX_POSITION_SPAN,
	TUNINGS,
	type ScalePosition,
} from './index';

function defined<T>(value: T | undefined): T {
	if (value === undefined) throw new Error('Expected a value');
	return value;
}

const MINOR_PENTATONIC = [0, 3, 5, 7, 10];
const A = 9;
const E = 4;

const guitar = createInstrumentOrThrow();
const tuning = (prefix: string) => defined(TUNINGS.find((t) => t.name.startsWith(prefix)));

function fretsByString(position: ScalePosition): Record<number, number[]> {
	const result: Record<number, number[]> = {};
	for (const note of position.notes) {
		(result[note.string] ??= []).push(note.fret);
	}
	return result;
}

const aMinor = getScalePositions(guitar, A, MINOR_PENTATONIC);
const byStart = (number: number, startFret: number) =>
	defined(aMinor.find((p) => p.number === number && p.startFret === startFret));

describe('A minor pentatonic positions, standard tuning', () => {
	it('position 1 matches the TESTING.md reference box (frets 5–8)', () => {
		const p1 = byStart(1, 5);
		expect(fretsByString(p1)).toEqual({
			6: [5, 8],
			5: [5, 7],
			4: [5, 7],
			3: [5, 7],
			2: [5, 8],
			1: [5, 8],
		});
		expect(p1.fretRange).toEqual({ min: 5, max: 8 });
		expect(p1.roots.map((n) => [n.string, n.fret])).toEqual([
			[6, 5],
			[4, 7],
			[1, 5],
		]);
		expect(p1.startString).toBe(6);
	});

	it('builds all five standard boxes', () => {
		expect(fretsByString(byStart(2, 8))).toEqual({
			6: [8, 10],
			5: [7, 10],
			4: [7, 10],
			3: [7, 9],
			2: [8, 10],
			1: [8, 10],
		});
		expect(fretsByString(byStart(3, 10))).toEqual({
			6: [10, 12],
			5: [10, 12],
			4: [10, 12],
			3: [9, 12],
			2: [10, 13],
			1: [10, 12],
		});
		expect(fretsByString(byStart(4, 12))).toEqual({
			6: [12, 15],
			5: [12, 15],
			4: [12, 14],
			3: [12, 14],
			2: [13, 15],
			1: [12, 15],
		});
		expect(fretsByString(byStart(5, 3))).toEqual({
			6: [3, 5],
			5: [3, 5],
			4: [2, 5],
			3: [2, 5],
			2: [3, 5],
			1: [3, 5],
		});
	});

	it('uses only A C D E G, two notes per string, ascending in pitch', () => {
		for (const position of aMinor) {
			expect(position.notes).toHaveLength(12);
			expect(new Set(position.notes.map((n) => n.pitchClass))).toEqual(
				new Set([9, 0, 2, 4, 7]),
			);
			const pitches = position.notes.map((n) => n.midi);
			expect(pitches).toEqual([...pitches].sort((a, b) => a - b));
			expect(new Set(pitches).size).toBe(12);
		}
	});

	it('orders positions up the neck and cycles 5 → 1 an octave higher', () => {
		expect(aMinor.map((p) => [p.number, p.startFret])).toEqual([
			[4, 0],
			[5, 3],
			[1, 5],
			[2, 8],
			[3, 10],
			[4, 12],
			[5, 15],
			[1, 17],
			[2, 20],
		]);
		expect(byStart(1, 17).fretRange.min).toBe(byStart(1, 5).fretRange.min + 12);
		expect(fretsByString(byStart(4, 0))).toEqual({
			6: [0, 3],
			5: [0, 3],
			4: [0, 2],
			3: [0, 2],
			2: [1, 3],
			1: [0, 3],
		});
	});

	it('marks intervals from the root', () => {
		const p1 = byStart(1, 5);
		expect(p1.notes.map((n) => n.interval)).toEqual([0, 3, 5, 7, 10, 0, 3, 5, 7, 10, 0, 3]);
	});
});

describe('connections between positions', () => {
	it('adjacent positions share one exact note on every string', () => {
		for (let i = 0; i < aMinor.length - 1; i++) {
			const shared = getSharedNotes(defined(aMinor[i]), defined(aMinor[i + 1]));
			expect(shared.map((n) => n.string).sort()).toEqual([1, 2, 3, 4, 5, 6]);
		}
	});

	it('shared notes between positions 1 and 2 are the top of 1 and the bottom of 2', () => {
		const shared = getSharedNotes(byStart(1, 5), byStart(2, 8));
		expect(shared.map((n) => [n.string, n.fret])).toEqual([
			[6, 8],
			[5, 7],
			[4, 7],
			[3, 7],
			[2, 8],
			[1, 8],
		]);
	});

	it('positions two steps apart share no notes', () => {
		expect(getSharedNotes(byStart(1, 5), byStart(3, 10))).toEqual([]);
	});

	it('navigates next and previous along the neck', () => {
		const p1 = byStart(1, 5);
		expect(getNextPosition(aMinor, p1)?.number).toBe(2);
		expect(getPreviousPosition(aMinor, p1)?.number).toBe(5);
		expect(getNextPosition(aMinor, byStart(4, 12))).toMatchObject({ number: 5, startFret: 15 });
		expect(getNextPosition(aMinor, byStart(5, 15))).toMatchObject({ number: 1, startFret: 17 });
		expect(getPreviousPosition(aMinor, defined(aMinor[0]))).toBeNull();
		expect(getNextPosition(aMinor, defined(aMinor.at(-1)))).toBeNull();
	});
});

describe('neck limits, keys, tunings, and capo', () => {
	it('E minor position 1 uses open strings', () => {
		const eMinor = getScalePositions(guitar, E, MINOR_PENTATONIC);
		expect(eMinor[0]).toMatchObject({ number: 1, startFret: 0, fretRange: { min: 0, max: 3 } });
		expect(fretsByString(defined(eMinor[0]))).toEqual({
			6: [0, 3],
			5: [0, 2],
			4: [0, 2],
			3: [0, 2],
			2: [0, 3],
			1: [0, 3],
		});
	});

	it('every note of every position is on the playable neck', () => {
		const shortNeck = createInstrumentOrThrow({ fretCount: 12 });
		for (let root = 0; root < 12; root++) {
			for (const position of getScalePositions(shortNeck, root, MINOR_PENTATONIC)) {
				for (const note of position.notes) {
					expect(note.fret).toBeGreaterThanOrEqual(0);
					expect(note.fret).toBeLessThanOrEqual(12);
				}
			}
		}
	});

	it('every key has all five positions on a 22-fret neck', () => {
		for (let root = 0; root < 12; root++) {
			const numbers = new Set(
				getScalePositions(guitar, root, MINOR_PENTATONIC).map((p) => p.number),
			);
			expect(numbers).toEqual(new Set([1, 2, 3, 4, 5]));
		}
	});

	it('never places a note below the capo', () => {
		const withCapo = getScalePositions(
			createInstrumentOrThrow({ capo: 2 }),
			E,
			MINOR_PENTATONIC,
		);
		expect(withCapo.length).toBeGreaterThan(0);
		expect(withCapo.every((p) => p.fretRange.min >= 2)).toBe(true);
	});

	it('capo 2 puts F# minor position 1 on the capo fret, shaped like open E minor', () => {
		const fSharp = getScalePositions(createInstrumentOrThrow({ capo: 2 }), 6, MINOR_PENTATONIC);
		expect(fSharp[0]).toMatchObject({ number: 1, startFret: 2, fretRange: { min: 2, max: 5 } });
		expect(fretsByString(defined(fSharp[0]))).toEqual({
			6: [2, 5],
			5: [2, 4],
			4: [2, 4],
			3: [2, 4],
			2: [2, 5],
			1: [2, 5],
		});
	});

	it('positions follow the tuning (drop D: A on the low string is fret 7)', () => {
		const dropD = createInstrumentOrThrow({ tuning: tuning('Drop D') });
		const p1 = defined(
			getScalePositions(dropD, A, MINOR_PENTATONIC).find((p) => p.number === 1),
		);
		expect(p1.startFret).toBe(7);
		expect(p1.notes.slice(0, 2).map((n) => n.fret)).toEqual([7, 10]);
		expect(fretsByString(p1)).toMatchObject({
			5: [5, 7],
			4: [5, 7],
			3: [5, 7],
			2: [5, 8],
			1: [5, 8],
		});
	});

	it('every built-in tuning gives in-scale, playable, ascending shapes', () => {
		for (const t of TUNINGS) {
			const instrument = createInstrumentOrThrow({ tuning: t });
			for (const position of getScalePositions(instrument, A, MINOR_PENTATONIC)) {
				const pitches = position.notes.map((n) => n.midi);
				expect(pitches).toEqual([...pitches].sort((a, b) => a - b));
				expect(position.notes.every((n) => MINOR_PENTATONIC.includes(n.interval))).toBe(
					true,
				);
				expect(position.fretRange.max - position.fretRange.min).toBeLessThanOrEqual(
					MAX_POSITION_SPAN,
				);
			}
		}
	});

	it('works for other pentatonic formulas (major pentatonic, C)', () => {
		const cMajor = getScalePositions(guitar, 0, [0, 2, 4, 7, 9]);
		const p1 = defined(cMajor.find((p) => p.number === 1 && p.startFret === 8));
		expect(fretsByString(p1)).toEqual({
			6: [8, 10],
			5: [7, 10],
			4: [7, 10],
			3: [7, 9],
			2: [8, 10],
			1: [8, 10],
		});
	});

	it('rejects a formula that is not pentatonic', () => {
		expect(() => getScalePositions(guitar, A, [0, 3, 5, 7])).toThrow(RangeError);
		expect(() => getScalePositions(guitar, A, [0, 5, 3, 7, 10])).toThrow(RangeError);
		expect(() => getScalePositions(guitar, A, [1, 3, 5, 7, 10])).toThrow(RangeError);
		expect(() => getScalePositions(guitar, A, [0, 3, 5, 7, 12])).toThrow(RangeError);
	});
});

describe('register selection', () => {
	it('splits the playable neck into thirds', () => {
		expect(REGISTERS.map((r) => registerRange(guitar, r))).toEqual([
			{ min: 0, max: 22 / 3 },
			{ min: 22 / 3, max: 44 / 3 },
			{ min: 44 / 3, max: 22 },
		]);
		const capo = createInstrumentOrThrow({ capo: 4 });
		expect(registerRange(capo, 'low').min).toBe(4);
		expect(registerRange(capo, 'high').max).toBe(22);
	});

	it('low, middle, and high pick different real positions, best first', () => {
		const low = selectRegister(guitar, aMinor, 'low');
		const middle = selectRegister(guitar, aMinor, 'middle');
		const high = selectRegister(guitar, aMinor, 'high');
		expect(low.map((p) => [p.number, p.startFret])).toEqual([
			[5, 3],
			[4, 0],
			[1, 5],
		]);
		expect(middle.map((p) => [p.number, p.startFret])).toEqual([
			[3, 10],
			[2, 8],
			[4, 12],
		]);
		expect(high.map((p) => [p.number, p.startFret])).toEqual([
			[1, 17],
			[2, 20],
			[5, 15],
		]);
		for (const p of [...low, ...middle, ...high]) {
			expect(aMinor).toContain(p);
		}
	});

	it('every register selects at least one position in every key', () => {
		for (let root = 0; root < 12; root++) {
			const positions = getScalePositions(guitar, root, MINOR_PENTATONIC);
			for (const register of REGISTERS) {
				expect(selectRegister(guitar, positions, register).length).toBeGreaterThan(0);
			}
		}
	});

	it('falls back to the nearest positions when a third holds none', () => {
		// Capo 10 leaves frets 10–22; the low third (10–14) still gets the closest real shapes.
		const capo = createInstrumentOrThrow({ capo: 10 });
		const positions = getScalePositions(capo, A, MINOR_PENTATONIC);
		for (const register of REGISTERS) {
			const selected = selectRegister(capo, positions, register);
			expect(selected.length).toBeGreaterThan(0);
			expect(selected.every((p) => positions.includes(p))).toBe(true);
		}
	});

	it('returns nothing when there are no positions', () => {
		expect(selectRegister(guitar, [], 'middle')).toEqual([]);
	});
});
