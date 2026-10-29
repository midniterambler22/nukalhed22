import { describe, expect, it } from 'vitest';
import { chordAt, renderSong, type RenderedSong, type SynthOptions } from '../../tests/synth';
import { analyzeAudio } from './analyze';
import { AnalysisError, type AnalysisResult } from './types';

/**
 * Reference songs rendered from a score, so the right answers are known exactly.
 * These measure the engine on clean, synthetic audio: they catch regressions and
 * prove the maths, but they are not a measure of accuracy on real recordings.
 */
interface Reference {
	name: string;
	song: SynthOptions;
	key: string;
	bpm: number;
}

const BLUES_IN_A = ['A7', 'D7', 'A7', 'A7', 'D7', 'D7', 'A7', 'A7', 'E7', 'D7', 'A7', 'E7'];

const REFERENCES: Reference[] = [
	{
		name: 'major key, I–V–vi–IV',
		song: { bpm: 120, chords: ['C', 'G', 'Am', 'F'], repeats: 4 },
		key: 'C major',
		bpm: 120,
	},
	{
		name: 'minor key with a dominant seventh, i–iv–V7–i',
		song: { bpm: 96, chords: ['Am', 'Dm', 'E7', 'Am'], repeats: 4 },
		key: 'A minor',
		bpm: 96,
	},
	{
		name: 'twelve-bar blues in A, all dominant sevenths',
		song: { bpm: 100, chords: BLUES_IN_A, repeats: 2 },
		key: 'A major',
		bpm: 100,
	},
	{
		name: 'flat key without drums, I–vi–IV–V',
		song: { bpm: 85, chords: ['Bb', 'Gm', 'Eb', 'F'], repeats: 4, drums: false },
		key: 'B♭ major',
		bpm: 85,
	},
	{
		name: 'slow ballad',
		song: { bpm: 70, chords: ['G', 'Em', 'C', 'D'], repeats: 4 },
		key: 'G major',
		bpm: 70,
	},
	{
		name: 'fast, kick on 1 and 3, snare on 2 and 4',
		song: { bpm: 160, chords: ['D', 'A', 'Bm', 'G'], repeats: 8 },
		key: 'D major',
		bpm: 160,
	},
	{
		name: 'distorted, noisy, heavy bass',
		song: { bpm: 140, chords: ['E', 'A', 'B', 'E'], repeats: 6, drive: 4, noise: 0.05 },
		key: 'E major',
		bpm: 140,
	},
];

/** Share of the scored time where the estimated chord matches the score. */
function chordAccuracy(song: RenderedSong, result: AnalysisResult): number {
	let agree = 0;
	let total = 0;
	for (let t = 0.05; t < (song.bars.at(-1)?.end ?? 0); t += 0.05) {
		const truth = chordAt(song, t);
		if (!truth) continue;
		total++;
		const estimate = result.chords.find((c) => t >= c.start && t < c.end);
		if (estimate?.chord === truth) agree++;
	}
	return agree / total;
}

/** Share of true beats with an estimated beat within 50 ms. */
function beatRecall(song: RenderedSong, result: AnalysisResult): number {
	const beats = result.tempo?.beats ?? [];
	const hits = song.beats.filter((b) => beats.some((e) => Math.abs(e - b) <= 0.05)).length;
	return hits / song.beats.length;
}

describe('analyzeAudio on reference songs', () => {
	for (const reference of REFERENCES) {
		it(reference.name, () => {
			const song = renderSong(reference.song);
			const result = analyzeAudio(song);
			expect(result.key?.name).toBe(reference.key);
			expect(result.tempo?.bpm).toBeCloseTo(reference.bpm, 0);
			expect(beatRecall(song, result)).toBeGreaterThanOrEqual(0.95);
			expect(chordAccuracy(song, result)).toBeGreaterThanOrEqual(0.95);
			expect(result.tempo?.confidence.level).toBe('high');
			expect(result.chords.every((c) => c.source === 'auto')).toBe(true);
			expect(result.tonalSections).toEqual([]);
		});
	}

	it('names chords with the key’s spelling', () => {
		const result = analyzeAudio(
			renderSong({ bpm: 85, chords: ['Bb', 'Gm', 'Eb', 'F'], repeats: 4, drums: false }),
		);
		const names = new Set(result.chords.map((c) => c.chord));
		expect(names).toEqual(new Set(['Bb', 'Gm', 'Eb', 'F']));
	});

	it('marks silence before the music as no chord, with no beats in it', () => {
		const song = renderSong({ bpm: 110, chords: ['D', 'G'], repeats: 6, leadIn: 4 });
		const result = analyzeAudio(song);
		expect(result.chords[0]).toMatchObject({ start: 0, chord: null });
		expect(result.chords[0]?.end).toBeCloseTo(4, 1);
		expect(result.tempo?.beats[0]).toBeGreaterThan(3.9);
		expect(chordAccuracy(song, result)).toBeGreaterThanOrEqual(0.95);
	});

	it('finds a change of tonal centre and doesn’t claim one key for the song', () => {
		const inC = Array.from({ length: 12 }, () => ['C', 'F', 'G', 'C']).flat();
		const inD = Array.from({ length: 12 }, () => ['D', 'G', 'A', 'D']).flat();
		const song = renderSong({ bpm: 120, chords: [...inC, ...inD] });
		const result = analyzeAudio(song);
		expect(result.tonalSections.map((s) => s.key.name)).toEqual(['C major', 'D major']);
		expect(result.tonalSections[0]?.end).toBeCloseTo(96, -1);
		expect(result.key?.confidence.level).toBe('low');
		expect(result.notes.join(' ')).toMatch(/key seems to change/);
	});
});

describe('analyzeAudio on ambiguous audio', () => {
	it('keeps relative major and minor open when the harmony doesn’t decide', () => {
		const result = analyzeAudio(renderSong({ bpm: 100, chords: ['Am', 'C'], repeats: 8 }));
		const top = [result.key?.name, result.key?.alternatives[0]?.name].sort();
		expect(top).toEqual(['A minor', 'C major']);
		expect(result.key?.confidence.level).not.toBe('high');
	});

	it('gives no confident key when every chord is equally important', () => {
		const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
		const result = analyzeAudio(renderSong({ bpm: 100, chords: chromatic, repeats: 2 }));
		expect(result.key?.confidence.level ?? 'low').toBe('low');
	});

	it('says noise has no clear harmony or beat', () => {
		const sampleRate = 22050;
		const samples = new Float32Array(sampleRate * 30);
		let seed = 1;
		for (let i = 0; i < samples.length; i++) {
			seed = (seed * 16807) % 2147483647;
			samples[i] = (seed / 2147483647 - 0.5) * 0.3;
		}
		const result = analyzeAudio({ samples, sampleRate });
		expect(result.key?.confidence.level ?? 'low').toBe('low');
		expect(result.tempo?.confidence.level ?? 'low').toBe('low');
		expect(result.notes.join(' ')).toMatch(/very uncertain/);
	});
});

describe('analyzeAudio errors and progress', () => {
	const sampleRate = 22050;

	it('refuses audio shorter than 5 seconds', () => {
		const run = () => analyzeAudio({ samples: new Float32Array(sampleRate * 4), sampleRate });
		expect(run).toThrow(AnalysisError);
		expect(run).toThrow(/too short/);
	});

	it('refuses silence instead of inventing results', () => {
		try {
			analyzeAudio({ samples: new Float32Array(sampleRate * 10), sampleRate });
			expect.fail('should throw');
		} catch (error) {
			expect(error).toBeInstanceOf(AnalysisError);
			expect((error as AnalysisError).code).toBe('silent');
		}
	});

	it('reports progress through every stage, ending at 1', () => {
		const stages: string[] = [];
		const fractions: number[] = [];
		analyzeAudio(renderSong({ bpm: 120, chords: ['C', 'G'], repeats: 2 }), {
			onProgress: (p) => {
				stages.push(p.stage);
				fractions.push(p.fraction);
			},
		});
		expect(new Set(stages)).toEqual(new Set(['spectrum', 'beats', 'chords', 'key']));
		expect(fractions).toEqual([...fractions].sort((a, b) => a - b));
		expect(fractions.at(-1)).toBe(1);
	});

	it('works at the 44.1 kHz rate the app decodes to', () => {
		const song = renderSong({
			sampleRate: 44100,
			bpm: 120,
			chords: ['G', 'C', 'D', 'G'],
			repeats: 2,
		});
		const result = analyzeAudio(song);
		expect(result.key?.name).toBe('G major');
		expect(result.tempo?.bpm).toBeCloseTo(120, 0);
		expect(chordAccuracy(song, result)).toBeGreaterThanOrEqual(0.95);
	});
});
