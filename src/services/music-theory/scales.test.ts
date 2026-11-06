import { describe, expect, it } from 'vitest';
import { TheoryError } from './errors';
import { formatInterval } from './intervals';
import { formatNote, noteToPitchClass, parseNoteName } from './notes';
import { parseFormula } from './formula';
import {
	SCALES,
	SCALE_CATEGORIES,
	SCALE_IDS,
	isScaleId,
	scalesInCategory,
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
	it('has the 20 scales of UI_SPEC §6 in four groups, in order', () => {
		expect(SCALE_CATEGORIES.map((c) => c.name)).toEqual([
			'Pentatonic and blues',
			'Major scale and modes',
			'Minor and harmonic variations',
			'Advanced and exotic',
		]);
		const grouped = SCALE_CATEGORIES.map((c) => scalesInCategory(c.id).map((s) => s.name));
		expect(grouped).toEqual([
			['Minor pentatonic', 'Major pentatonic', 'Minor blues', 'Major blues'],
			[
				'Major (Ionian)',
				'Natural minor (Aeolian)',
				'Dorian',
				'Phrygian',
				'Lydian',
				'Mixolydian',
				'Locrian',
			],
			['Harmonic minor', 'Melodic minor', 'Phrygian dominant', 'Hungarian minor'],
			[
				'Whole tone',
				'Diminished (half-whole)',
				'Diminished (whole-half)',
				'Altered',
				'Lydian dominant',
			],
		]);
		expect(SCALE_IDS).toHaveLength(20);
		expect(isScaleId('lydian')).toBe(true);
		expect(isScaleId('blues')).toBe(false);
	});

	it('stores scales as interval formulas', () => {
		const formulas = Object.fromEntries(
			SCALE_IDS.map((id) => [id, SCALES[id].formula.join(' ')]),
		);
		expect(formulas).toEqual({
			'minor-pentatonic': '1 b3 4 5 b7',
			'major-pentatonic': '1 2 3 5 6',
			'minor-blues': '1 b3 4 b5 5 b7',
			'major-blues': '1 2 b3 3 5 6',
			major: '1 2 3 4 5 6 7',
			'natural-minor': '1 2 b3 4 5 b6 b7',
			dorian: '1 2 b3 4 5 6 b7',
			phrygian: '1 b2 b3 4 5 b6 b7',
			lydian: '1 2 3 #4 5 6 7',
			mixolydian: '1 2 3 4 5 6 b7',
			locrian: '1 b2 b3 4 b5 b6 b7',
			'harmonic-minor': '1 2 b3 4 5 b6 7',
			'melodic-minor': '1 2 b3 4 5 6 7',
			'phrygian-dominant': '1 b2 3 4 5 b6 b7',
			'hungarian-minor': '1 2 b3 #4 5 b6 7',
			'whole-tone': '1 2 3 #4 #5 b7',
			'diminished-half-whole': '1 b2 #2 3 #4 5 6 b7',
			'diminished-whole-half': '1 2 b3 4 b5 #5 6 7',
			altered: '1 b2 #2 3 b5 #5 b7',
			'lydian-dominant': '1 2 3 #4 5 6 b7',
		});
	});

	it('has the right step pattern for every scale (semitones between notes, back to the octave)', () => {
		const steps = (id: ScaleId) => {
			const semis = [...SCALES[id].intervals.map((i) => i.semitones), 12];
			return semis
				.slice(1)
				.map((s, i) => s - (semis[i] ?? 0))
				.join('');
		};
		expect(steps('minor-pentatonic')).toBe('32232');
		expect(steps('major-pentatonic')).toBe('22323');
		expect(steps('minor-blues')).toBe('321132');
		expect(steps('major-blues')).toBe('211323');
		expect(steps('major')).toBe('2212221');
		expect(steps('phrygian')).toBe('1222122');
		expect(steps('lydian')).toBe('2221221');
		expect(steps('locrian')).toBe('1221222');
		expect(steps('harmonic-minor')).toBe('2122131');
		expect(steps('melodic-minor')).toBe('2122221');
		expect(steps('phrygian-dominant')).toBe('1312122');
		expect(steps('hungarian-minor')).toBe('2131131');
		expect(steps('whole-tone')).toBe('222222');
		expect(steps('diminished-half-whole')).toBe('12121212');
		expect(steps('diminished-whole-half')).toBe('21212121');
		expect(steps('altered')).toBe('1212222');
		expect(steps('lydian-dominant')).toBe('2221212');
	});

	it('works on all 12 roots: distinct notes, root first, nothing past the octave', () => {
		const roots = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
		for (const id of SCALE_IDS) {
			for (const root of roots) {
				const notes = spellScale(root, id);
				const pcs = notes.map((n) => n.pitchClass);
				expect(new Set(pcs).size, `${root} ${id}`).toBe(notes.length);
				expect(pcs[0]).toBe(noteToPitchClass(parseNoteName(root)));
				expect(scalePitchClasses(pcs[0] ?? 0, id)).toEqual(pcs);
			}
		}
	});

	it('uses each letter once in every seven-note scale except the altered scale, for every root', () => {
		const roots = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
		const heptatonic = SCALE_IDS.filter(
			(id) => SCALES[id].formula.length === 7 && id !== 'altered',
		);
		expect(heptatonic).toHaveLength(12);
		for (const id of heptatonic) {
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
		['A', 'minor-blues', 'A C D Eb E G'],
		['E', 'minor-blues', 'E G A Bb B D'],
		['C', 'major-blues', 'C D Eb E G A'],
		['A', 'major-blues', 'A B C C# E F#'],
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
		['E', 'phrygian', 'E F G A B C D'],
		['F', 'lydian', 'F G A B C D E'],
		['B', 'locrian', 'B C D E F G A'],
		['A', 'harmonic-minor', 'A B C D E F G#'],
		['A', 'melodic-minor', 'A B C D E F# G#'],
		['E', 'phrygian-dominant', 'E F G# A B C D'],
		['A', 'hungarian-minor', 'A B C D# E F G#'],
		['C', 'whole-tone', 'C D E F# G# Bb'],
		['C', 'diminished-half-whole', 'C Db D# E F# G A Bb'],
		['C', 'diminished-whole-half', 'C D Eb F Gb G# A B'],
		['G', 'altered', 'G Ab A# B Db D# F'],
		['C', 'lydian-dominant', 'C D E F# G A Bb'],
	] as const)('%s %s = %s', (root, id, expected) => {
		expect(names(root, id)).toBe(expected);
	});

	it('gives each scale note its interval from the root', () => {
		const intervals = spellScale('A', 'minor-blues').map(({ interval }) =>
			formatInterval(interval),
		);
		expect(intervals).toEqual(['1', 'b3', '4', 'b5', '5', 'b7']);
	});

	it('relates modes to their parent major scale', () => {
		const pcs = (root: string, id: ScaleId) =>
			[...scalePitchClasses(noteToPitchClass(parseNoteName(root)), id)].sort((a, b) => a - b);
		expect(pcs('A', 'natural-minor')).toEqual(pcs('C', 'major'));
		expect(pcs('D', 'dorian')).toEqual(pcs('C', 'major'));
		expect(pcs('G', 'mixolydian')).toEqual(pcs('C', 'major'));
		expect(pcs('A', 'minor-pentatonic')).toEqual(pcs('C', 'major-pentatonic'));
		expect(pcs('E', 'phrygian')).toEqual(pcs('C', 'major'));
		expect(pcs('F', 'lydian')).toEqual(pcs('C', 'major'));
		expect(pcs('B', 'locrian')).toEqual(pcs('C', 'major'));
	});

	it('relates the other scales to their parents', () => {
		const pcs = (root: string, id: ScaleId) =>
			[...scalePitchClasses(noteToPitchClass(parseNoteName(root)), id)].sort((a, b) => a - b);
		// Phrygian dominant is the 5th mode of harmonic minor: E phrygian dominant = A harmonic minor.
		expect(pcs('E', 'phrygian-dominant')).toEqual(pcs('A', 'harmonic-minor'));
		// Altered is the 7th mode of melodic minor, Lydian dominant the 4th.
		expect(pcs('G', 'altered')).toEqual(pcs('Ab', 'melodic-minor'));
		expect(pcs('C', 'lydian-dominant')).toEqual(pcs('G', 'melodic-minor'));
		// The two diminished scales are the same notes a semitone apart; whole tone repeats every step.
		expect(pcs('C', 'diminished-half-whole')).toEqual(pcs('Db', 'diminished-whole-half'));
		expect(pcs('C', 'whole-tone')).toEqual(pcs('D', 'whole-tone'));
		// Blues scales add one note to the pentatonics.
		expect(pcs('A', 'minor-blues')).toEqual(
			[...pcs('A', 'minor-pentatonic'), 3].sort((a, b) => a - b),
		);
		expect(pcs('C', 'major-blues')).toEqual(
			[...pcs('C', 'major-pentatonic'), 3].sort((a, b) => a - b),
		);
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
		const eFlat = scaleDegreeOf(3, a, 'minor-blues');
		expect(eFlat && formatInterval(eFlat)).toBe('b5');
	});
});
