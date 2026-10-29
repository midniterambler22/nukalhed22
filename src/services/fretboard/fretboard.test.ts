import { describe, expect, it } from 'vitest';
import {
	allPositions,
	createInstrumentOrThrow,
	findPositions,
	isPlayable,
	pitchAt,
	playableRange,
	positionAt,
	TUNINGS,
} from './index';

// MIDI reference: C4 = 60, A4 = 69. Pitch classes: C=0 … A=9, B=11.
const guitar = createInstrumentOrThrow();
const capo2 = createInstrumentOrThrow({ capo: 2 });
const dropD = createInstrumentOrThrow({ tuning: TUNINGS.find((t) => t.name.startsWith('Drop D'))! });

describe('pitchAt — TESTING.md reference values (standard tuning, no capo)', () => {
	it.each([
		[6, 0, 40, 'E2'],
		[5, 0, 45, 'A2'],
		[4, 0, 50, 'D3'],
		[3, 0, 55, 'G3'],
		[2, 0, 59, 'B3'],
		[1, 0, 64, 'E4'],
		[6, 5, 45, 'A2'],
		[5, 5, 50, 'D3'],
		[4, 7, 57, 'A3'],
		[3, 2, 57, 'A3'],
		[2, 1, 60, 'C4'],
		[1, 12, 76, 'E5'],
	])('string %i fret %i = MIDI %i (%s)', (string, fret, midi) => {
		expect(pitchAt(guitar, string, fret)).toBe(midi);
	});

	it('a fret 5 / next string open unison holds on every pair except G→B (fret 4)', () => {
		for (const string of [6, 5, 4, 2]) {
			expect(pitchAt(guitar, string, 5)).toBe(pitchAt(guitar, string - 1, 0));
		}
		expect(pitchAt(guitar, 3, 4)).toBe(pitchAt(guitar, 2, 0));
	});

	it('fret 12 is one octave above the open string on every string', () => {
		for (let string = 1; string <= 6; string++) {
			expect(pitchAt(guitar, string, 12) - pitchAt(guitar, string, 0)).toBe(12);
		}
	});
});

describe('capo', () => {
	it('capo 2: open string 6 sounds F♯2 (TESTING.md)', () => {
		expect(pitchAt(capo2, 6, 2)).toBe(42); // F♯2
		expect(positionAt(capo2, 6, 2).pitchClass).toBe(6); // F♯
	});

	it('frets are absolute: fret 5 sounds the same with or without a capo', () => {
		expect(pitchAt(capo2, 6, 5)).toBe(pitchAt(guitar, 6, 5));
	});

	it('frets below the capo are not playable', () => {
		expect(isPlayable(capo2, 6, 0)).toBe(false);
		expect(isPlayable(capo2, 6, 1)).toBe(false);
		expect(isPlayable(capo2, 6, 2)).toBe(true);
		expect(() => pitchAt(capo2, 6, 1)).toThrow(RangeError);
	});

	it('findPositions never returns a position behind the capo', () => {
		const es = findPositions(capo2, { pitchClass: 4 });
		expect(es.every((p) => p.fret >= 2)).toBe(true);
		// Open low/high E are gone; the next E on string 6 is fret 12.
		expect(es.filter((p) => p.string === 6).map((p) => p.fret)).toEqual([12]);
	});
});

describe('alternate tunings', () => {
	it('drop D lowers only string 6', () => {
		expect(pitchAt(dropD, 6, 0)).toBe(38); // D2
		expect(pitchAt(dropD, 6, 2)).toBe(40); // E2
		for (let string = 1; string <= 5; string++) {
			expect(pitchAt(dropD, string, 3)).toBe(pitchAt(guitar, string, 3));
		}
	});

	it('every tuning: each position = open pitch + fret', () => {
		for (const tuning of TUNINGS) {
			const instrument = createInstrumentOrThrow({ tuning, fretCount: 24 });
			for (const p of allPositions(instrument)) {
				const open = tuning.openMidi[tuning.openMidi.length - p.string]!;
				expect(p.midi).toBe(open + p.fret);
				expect(p.pitchClass).toBe(p.midi % 12);
			}
		}
	});
});

describe('isPlayable / pitchAt bounds', () => {
	it.each([
		[0, 0],
		[7, 0],
		[1, -1],
		[1, 23],
		[1.5, 3],
		[1, 3.5],
	])('string %s fret %s is not playable', (string, fret) => {
		expect(isPlayable(guitar, string, fret)).toBe(false);
		expect(() => pitchAt(guitar, string, fret)).toThrow(RangeError);
	});

	it('the last fret is playable', () => {
		expect(pitchAt(guitar, 1, 22)).toBe(86); // D6
	});
});

describe('playableRange', () => {
	it('defaults to capo..fretCount', () => {
		expect(playableRange(guitar)).toEqual({ min: 0, max: 22 });
		expect(playableRange(capo2)).toEqual({ min: 2, max: 22 });
	});

	it('clamps a requested range to what is playable', () => {
		expect(playableRange(capo2, { min: 0, max: 30 })).toEqual({ min: 2, max: 22 });
	});

	it('rejects inverted and empty ranges', () => {
		expect(() => playableRange(guitar, { min: 8, max: 5 })).toThrow(RangeError);
		expect(() => playableRange(capo2, { min: 0, max: 1 })).toThrow(RangeError);
	});
});

describe('allPositions', () => {
	it('covers every string × fret exactly once', () => {
		const positions = allPositions(guitar);
		expect(positions).toHaveLength(6 * 23);
		expect(new Set(positions.map((p) => `${p.string}:${p.fret}`)).size).toBe(6 * 23);
	});
});

describe('findPositions', () => {
	it('every A (pitch class 9) in frets 0–12', () => {
		const as = findPositions(guitar, { pitchClass: 9 }, { min: 0, max: 12 });
		expect(as.map((p) => [p.string, p.fret])).toEqual([
			[1, 5],
			[2, 10],
			[3, 2],
			[4, 7],
			[5, 0],
			[5, 12],
			[6, 5],
		]);
	});

	it('an exact pitch: A3 (MIDI 57) appears on strings 3, 4, 5 and 6', () => {
		const a3 = findPositions(guitar, { midi: 57 });
		expect(a3.map((p) => [p.string, p.fret])).toEqual([
			[3, 2],
			[4, 7],
			[5, 12],
			[6, 17],
		]);
	});

	it('C4 (MIDI 60, middle C) positions', () => {
		expect(findPositions(guitar, { midi: 60 }).map((p) => [p.string, p.fret])).toEqual([
			[2, 1],
			[3, 5],
			[4, 10],
			[5, 15],
			[6, 20],
		]);
	});

	it('normalizes out-of-range pitch classes (21 → 9)', () => {
		expect(findPositions(guitar, { pitchClass: 21 })).toEqual(findPositions(guitar, { pitchClass: 9 }));
	});
});
