import { describe, expect, it } from 'vitest';
import {
	createInstrument,
	createInstrumentOrThrow,
	lowestPlayableFret,
	openMidiForString,
	STANDARD_TUNING,
	stringCount,
	TUNINGS,
} from './index';

describe('createInstrument', () => {
	it('defaults to standard tuning, no capo, 22 frets, right-handed', () => {
		const result = createInstrument();
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.instrument.tuning.openMidi).toEqual([40, 45, 50, 55, 59, 64]);
		expect(result.instrument.capo).toBe(0);
		expect(result.instrument.fretCount).toBe(22);
		expect(result.instrument.handedness).toBe('right');
	});

	it('copies the tuning so later mutation of the input has no effect', () => {
		const openMidi = [40, 45, 50, 55, 59, 64];
		const instrument = createInstrumentOrThrow({ tuning: { name: 'x', openMidi } });
		openMidi[0] = 0;
		expect(instrument.tuning.openMidi[0]).toBe(40);
	});

	it('accepts every built-in tuning', () => {
		for (const tuning of TUNINGS) {
			expect(createInstrument({ tuning }).ok).toBe(true);
		}
	});

	it.each([
		[
			'too few strings',
			{ tuning: { name: 't', openMidi: [40, 45, 50] } },
			'invalid-string-count',
		],
		[
			'too many strings',
			{ tuning: { name: 't', openMidi: Array(13).fill(40) } },
			'invalid-string-count',
		],
		[
			'non-integer pitch',
			{ tuning: { name: 't', openMidi: [40, 45, 50.5, 55, 59, 64] } },
			'invalid-open-pitch',
		],
		[
			'negative pitch',
			{ tuning: { name: 't', openMidi: [-1, 45, 50, 55, 59, 64] } },
			'invalid-open-pitch',
		],
		[
			'NaN pitch',
			{ tuning: { name: 't', openMidi: [Number.NaN, 45, 50, 55, 59, 64] } },
			'invalid-open-pitch',
		],
		['too few frets', { fretCount: 11 }, 'invalid-fret-count'],
		['too many frets', { fretCount: 37 }, 'invalid-fret-count'],
		['fractional frets', { fretCount: 21.5 }, 'invalid-fret-count'],
		['negative capo', { capo: -1 }, 'invalid-capo'],
		['fractional capo', { capo: 2.5 }, 'invalid-capo'],
		['capo on the last fret', { capo: 22 }, 'invalid-capo'],
		[
			'pitch above MIDI 127',
			{ tuning: { name: 't', openMidi: [100, 105, 110, 115, 119, 124] } },
			'pitch-out-of-range',
		],
	] as const)('rejects %s', (_label, options, code) => {
		const result = createInstrument(options);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors.map((e) => e.code)).toContain(code);
	});

	it('reports every problem at once', () => {
		const result = createInstrument({ fretCount: 5, capo: -1 });
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors.map((e) => e.code).sort()).toEqual([
			'invalid-capo',
			'invalid-fret-count',
		]);
	});

	it('createInstrumentOrThrow throws a RangeError on invalid input', () => {
		expect(() => createInstrumentOrThrow({ capo: 30 })).toThrow(RangeError);
	});
});

describe('string numbering', () => {
	const guitar = createInstrumentOrThrow();

	it('numbers strings 1 = high E to 6 = low E', () => {
		expect(stringCount(guitar)).toBe(6);
		expect(openMidiForString(guitar, 1)).toBe(64); // E4
		expect(openMidiForString(guitar, 2)).toBe(59); // B3
		expect(openMidiForString(guitar, 6)).toBe(40); // E2
	});

	it('works for other string counts (7-string, 4-string bass)', () => {
		const sevenString = createInstrumentOrThrow({
			tuning: { name: '7', openMidi: [35, ...STANDARD_TUNING.openMidi] },
		});
		expect(openMidiForString(sevenString, 7)).toBe(35); // B1
		const bass = createInstrumentOrThrow({
			tuning: { name: 'bass', openMidi: [28, 33, 38, 43] },
		});
		expect(openMidiForString(bass, 1)).toBe(43); // G2
		expect(openMidiForString(bass, 4)).toBe(28); // E1
	});

	it.each([0, 7, 1.5])('rejects string %s', (string) => {
		expect(() => openMidiForString(guitar, string)).toThrow(RangeError);
	});

	it('lowest playable fret is the capo fret', () => {
		expect(lowestPlayableFret(guitar)).toBe(0);
		expect(lowestPlayableFret(createInstrumentOrThrow({ capo: 3 }))).toBe(3);
	});
});
