import type { PitchClass } from '../music-theory';
import { normalizeChord } from './chords';
import { MAX_BPM, MIN_BPM, NO_CORRECTIONS } from './song';
import type { ChordSpan, KeyCorrection, SongCorrections } from './types';

/**
 * Saves each song's corrections in this browser only (localStorage), keyed by the
 * file's name and size. Nothing leaves the device. Saved data is checked before use,
 * since it may come from an older version or have been edited by hand.
 */

const PREFIX = 'nukalhed22.corrections.v1:';

/** The parts of `Storage` used here, so tests can pass a fake. */
export interface KeyValueStore {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
}

/** Identifies a song file across visits without reading or storing its audio. */
export function songStorageId(file: { name: string; size: number }): string {
	return `${file.name}:${file.size}`;
}

/** The browser's localStorage, or null where it's blocked (private mode, sandboxed previews). */
export function browserStore(): KeyValueStore | null {
	try {
		const store = globalThis.localStorage;
		return store ?? null;
	} catch {
		return null;
	}
}

function parseKey(value: unknown): KeyCorrection | null {
	if (typeof value !== 'object' || value === null) return null;
	const { tonic, mode } = value as Record<string, unknown>;
	if (typeof tonic !== 'number' || !Number.isInteger(tonic) || tonic < 0 || tonic > 11)
		return null;
	if (mode !== 'major' && mode !== 'minor') return null;
	return { tonic: tonic as PitchClass, mode };
}

function parseSpans(value: unknown): ChordSpan[] {
	if (!Array.isArray(value)) return [];
	const spans: ChordSpan[] = [];
	for (const item of value as unknown[]) {
		if (typeof item !== 'object' || item === null) continue;
		const { start, end, chord } = item as Record<string, unknown>;
		if (typeof start !== 'number' || typeof end !== 'number') continue;
		if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) continue;
		if (chord !== null && typeof chord !== 'string') continue;
		const symbol = chord === null ? null : normalizeChord(chord);
		if (chord !== null && symbol === null) continue;
		const last = spans[spans.length - 1];
		if (last && start < last.end) continue;
		spans.push({ start, end, chord: symbol });
	}
	return spans;
}

/** Reads saved corrections, dropping anything that doesn't check out. */
export function parseCorrections(json: string | null): SongCorrections | null {
	if (json === null) return null;
	let data: unknown;
	try {
		data = JSON.parse(json);
	} catch {
		return null;
	}
	if (typeof data !== 'object' || data === null) return null;
	const record = data as Record<string, unknown>;
	const bpm =
		typeof record.bpm === 'number' && record.bpm >= MIN_BPM && record.bpm <= MAX_BPM
			? record.bpm
			: null;
	return { key: parseKey(record.key), bpm, chords: parseSpans(record.chords) };
}

export function loadCorrections(store: KeyValueStore | null, id: string): SongCorrections {
	if (!store) return NO_CORRECTIONS;
	try {
		return parseCorrections(store.getItem(PREFIX + id)) ?? NO_CORRECTIONS;
	} catch {
		return NO_CORRECTIONS;
	}
}

/** Saves, or removes the entry when nothing is corrected. Returns false if the browser refused. */
export function saveCorrections(
	store: KeyValueStore | null,
	id: string,
	corrections: SongCorrections,
): boolean {
	if (!store) return false;
	try {
		const empty =
			corrections.key === null && corrections.bpm === null && corrections.chords.length === 0;
		if (empty) store.removeItem(PREFIX + id);
		else store.setItem(PREFIX + id, JSON.stringify(corrections));
		return true;
	} catch {
		return false;
	}
}
