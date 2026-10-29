import { describe, expect, it } from 'vitest';
import type { PitchClass } from '../music-theory';
import type { RecognizedChord } from './chords';
import {
	chordFit,
	chordKeyWeight,
	estimateKey,
	findTonalSections,
	keyName,
	KRUMHANSL_PROFILES,
	rankKeys,
} from './key';

function rotate(profile: readonly number[], tonic: number): number[] {
	return profile.map((_, i) => profile[(i - tonic + 12) % 12] ?? 0);
}

const chord = (
	root: PitchClass,
	quality: 'major' | 'minor' | 'dominant7',
	length = 1,
): RecognizedChord => ({
	start: 0,
	end: length,
	chord: { root, quality },
	confidence: { value: 1, level: 'high' },
	alternatives: [],
});

describe('key names', () => {
	it('spells each key with the fewer accidentals', () => {
		expect(keyName(10, 'major')).toBe('B♭ major');
		expect(keyName(6, 'minor')).toBe('F♯ minor');
		expect(keyName(1, 'major')).toBe('D♭ major');
		expect(keyName(8, 'minor')).toBe('G♯ minor');
		expect(keyName(3, 'minor')).toBe('E♭ minor');
		expect(keyName(0, 'major')).toBe('C major');
	});
});

describe('rankKeys', () => {
	it('finds every key from its own profile, with a perfect correlation', () => {
		for (const mode of ['major', 'minor'] as const) {
			for (let tonic = 0; tonic < 12; tonic++) {
				const [best] = rankKeys(rotate(KRUMHANSL_PROFILES[mode], tonic));
				expect(best).toMatchObject({ tonic, mode });
				expect(best?.score).toBeCloseTo(1, 10);
			}
		}
	});
});

describe('chord fit', () => {
	it('weights tonic, IV/V and other diatonic chords', () => {
		expect(chordKeyWeight({ root: 0, quality: 'major' }, 0, 'major')).toBe(1);
		expect(chordKeyWeight({ root: 7, quality: 'dominant7' }, 0, 'major')).toBe(0.7);
		expect(chordKeyWeight({ root: 9, quality: 'minor' }, 0, 'major')).toBe(0.4);
		expect(chordKeyWeight({ root: 9, quality: 'major' }, 0, 'major')).toBe(0);
		expect(chordKeyWeight({ root: 1, quality: 'major' }, 0, 'major')).toBe(0);
	});

	it('accepts the major V in a minor key (harmonic minor)', () => {
		expect(chordKeyWeight({ root: 4, quality: 'dominant7' }, 9, 'minor')).toBe(0.7);
		expect(chordKeyWeight({ root: 4, quality: 'minor' }, 9, 'minor')).toBe(0.7);
	});

	it('reads blues sevenths as I, IV and V', () => {
		const blues = [
			chord(9, 'dominant7', 6),
			chord(2, 'dominant7', 4),
			chord(4, 'dominant7', 2),
		];
		expect(chordFit(blues, 9, 'major')).toBeCloseTo((6 + 0.7 * 4 + 0.7 * 2) / 12, 10);
		expect(chordFit(blues, 2, 'major')).toBeLessThan(chordFit(blues, 9, 'major'));
	});

	it('breaks a profile tie between neighbouring keys', () => {
		// E major and B major share six notes; E–A–B chords only fit E major.
		const profile = rotate(KRUMHANSL_PROFILES.major, 4).map((v, i) =>
			i === 9 || i === 10 ? 4 : v,
		);
		const chords = [chord(4, 'major', 2), chord(9, 'major'), chord(11, 'major')];
		expect(estimateKey(profile, chords)?.name).toBe('E major');
	});
});

describe('estimateKey', () => {
	it('is confident for a clear profile and lists alternatives', () => {
		const result = estimateKey(rotate(KRUMHANSL_PROFILES.minor, 9));
		expect(result?.name).toBe('A minor');
		expect(result?.confidence.level).toBe('high');
		expect(result?.alternatives).toHaveLength(3);
	});

	it('returns null when all pitch classes are equal', () => {
		expect(estimateKey(new Array(12).fill(1))).toBeNull();
	});
});

describe('findTonalSections', () => {
	const C = rotate(KRUMHANSL_PROFILES.major, 0);
	const D = rotate(KRUMHANSL_PROFILES.major, 2);

	it('splits a song that moves from C major to D major', () => {
		const sections = findTonalSections(128, (start) => Float64Array.from(start < 64 ? C : D));
		expect(sections.map((s) => [s.start, s.end, s.key.name])).toEqual([
			[0, 64, 'C major'],
			[64, 128, 'D major'],
		]);
	});

	it('ignores a brief excursion and returns nothing for one key', () => {
		const sections = findTonalSections(128, (start) =>
			Float64Array.from(start >= 48 && start < 64 ? D : C),
		);
		expect(sections).toEqual([]);
	});

	it('returns nothing for songs too short to split', () => {
		expect(findTonalSections(40, () => Float64Array.from(C))).toEqual([]);
	});
});
