import { describe, expect, it } from 'vitest';
import { toConfidence, type AnalysisResult } from '../analysis';
import { allKeys, NO_CORRECTIONS, parseBpm, songKey, songTempo } from './song';

const RESULT: AnalysisResult = {
	engine: 'test',
	duration: 60,
	key: {
		tonic: 7,
		mode: 'major',
		name: 'G major',
		score: 0.5,
		confidence: toConfidence(0.1),
		alternatives: [],
	},
	tonalSections: [],
	tempo: { bpm: 100.5, confidence: toConfidence(0.03), beats: [] },
	chords: [],
	notes: [],
};

describe('key and tempo corrections', () => {
	it('uses the estimate until the user corrects it, and keeps the estimate for comparison', () => {
		expect(songKey(RESULT, NO_CORRECTIONS)).toMatchObject({ name: 'G major', source: 'auto' });
		const key = songKey(RESULT, { ...NO_CORRECTIONS, key: { tonic: 0, mode: 'major' } });
		expect(key).toMatchObject({ name: 'C major', source: 'user', confidence: null });
		expect(key?.estimate?.name).toBe('G major');
		expect(songTempo(RESULT, { ...NO_CORRECTIONS, bpm: 65 })).toMatchObject({
			bpm: 65,
			source: 'user',
		});
		expect(songTempo(null, NO_CORRECTIONS)).toBeNull();
	});

	it('lets the user set a key even when none was found', () => {
		const key = songKey(
			{ ...RESULT, key: null },
			{ ...NO_CORRECTIONS, key: { tonic: 10, mode: 'minor' } },
		);
		expect(key?.name).toBe('B♭ minor');
	});

	it('checks typed tempos', () => {
		expect(parseBpm('65')).toEqual({ ok: true, bpm: 65 });
		expect(parseBpm(' 67.04 ')).toEqual({ ok: true, bpm: 67 });
		expect(parseBpm('fast').ok).toBe(false);
		expect(parseBpm('').ok).toBe(false);
		expect(parseBpm('10').ok).toBe(false);
		expect(parseBpm('400').ok).toBe(false);
	});

	it('offers all 24 major and minor keys, spelled as keys', () => {
		const keys = allKeys();
		expect(keys).toHaveLength(24);
		expect(keys.map((k) => k.name)).toContain('F♯ minor');
		expect(keys.map((k) => k.name)).toContain('B♭ major');
	});
});
