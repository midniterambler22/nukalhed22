import { describe, expect, it } from 'vitest';
import { NO_CORRECTIONS } from './song';
import {
	loadCorrections,
	parseCorrections,
	saveCorrections,
	songStorageId,
	type KeyValueStore,
} from './storage';

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
	const data = new Map<string, string>();
	return {
		data,
		getItem: (k) => data.get(k) ?? null,
		setItem: (k, v) => void data.set(k, v),
		removeItem: (k) => void data.delete(k),
	};
}

describe('saved corrections', () => {
	it('round-trips and removes the entry when nothing is corrected', () => {
		const store = memoryStore();
		const id = songStorageId({ name: 'song.mp3', size: 1234 });
		const corrections = {
			key: { tonic: 0 as const, mode: 'major' as const },
			bpm: 65,
			chords: [{ start: 1, end: 2.5, chord: 'C' }],
		};
		expect(saveCorrections(store, id, corrections)).toBe(true);
		expect(loadCorrections(store, id)).toEqual(corrections);
		saveCorrections(store, id, NO_CORRECTIONS);
		expect(store.data.size).toBe(0);
		expect(loadCorrections(store, id)).toEqual(NO_CORRECTIONS);
	});

	it('drops anything that doesn’t check out instead of trusting it', () => {
		expect(parseCorrections('not json')).toBeNull();
		expect(parseCorrections('[]')).toEqual(NO_CORRECTIONS);
		const parsed = parseCorrections(
			JSON.stringify({
				key: { tonic: 12, mode: 'major' },
				bpm: 5000,
				chords: [
					{ start: 0, end: 2, chord: 'bb7' },
					{ start: 1, end: 3, chord: 'C' },
					{ start: 3, end: 2, chord: 'C' },
					{ start: 4, end: 5, chord: 'Hm' },
					{ start: 5, end: 6, chord: null },
					'junk',
				],
			}),
		);
		expect(parsed).toEqual({
			key: null,
			bpm: null,
			chords: [
				{ start: 0, end: 2, chord: 'Bb7' },
				{ start: 5, end: 6, chord: null },
			],
		});
	});

	it('works without storage, and survives a storage that throws', () => {
		expect(loadCorrections(null, 'x')).toEqual(NO_CORRECTIONS);
		expect(saveCorrections(null, 'x', NO_CORRECTIONS)).toBe(false);
		const broken: KeyValueStore = {
			getItem: () => {
				throw new Error('blocked');
			},
			setItem: () => {
				throw new Error('full');
			},
			removeItem: () => {},
		};
		expect(loadCorrections(broken, 'x')).toEqual(NO_CORRECTIONS);
		expect(saveCorrections(broken, 'x', { ...NO_CORRECTIONS, bpm: 90 })).toBe(false);
	});
});
