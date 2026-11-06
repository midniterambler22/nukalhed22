import type { AnalysisResult, KeyMode } from '../analysis';
import { keyName } from '../analysis';
import type { PitchClass } from '../music-theory';
import type { SongCorrections, SongKey, SongTempo } from './types';

/** Tempos the user can enter. */
export const MIN_BPM = 30;
export const MAX_BPM = 300;

export const NO_CORRECTIONS: SongCorrections = { key: null, bpm: null, chords: [] };

export function hasCorrections(corrections: SongCorrections): boolean {
	return corrections.key !== null || corrections.bpm !== null || corrections.chords.length > 0;
}

/** The key to use: the user's, else the estimate; null when neither exists. */
export function songKey(
	result: AnalysisResult | null,
	corrections: SongCorrections,
): SongKey | null {
	const estimate = result?.key ?? null;
	if (corrections.key) {
		const { tonic, mode } = corrections.key;
		return {
			tonic,
			mode,
			name: keyName(tonic, mode),
			source: 'user',
			confidence: null,
			estimate,
		};
	}
	if (!estimate) return null;
	return {
		tonic: estimate.tonic,
		mode: estimate.mode,
		name: estimate.name,
		source: 'auto',
		confidence: estimate.confidence,
		estimate,
	};
}

/** The tempo to use: the user's, else the estimate; null when neither exists. */
export function songTempo(
	result: AnalysisResult | null,
	corrections: SongCorrections,
): SongTempo | null {
	const estimate = result?.tempo ?? null;
	if (corrections.bpm !== null) {
		return { bpm: corrections.bpm, source: 'user', confidence: null, estimate };
	}
	if (!estimate) return null;
	return { bpm: estimate.bpm, source: 'auto', confidence: estimate.confidence, estimate };
}

/** The tempo typed by the user, or a reason it can't be used. */
export function parseBpm(text: string): { ok: true; bpm: number } | { ok: false; message: string } {
	const bpm = Number(text.trim());
	if (text.trim() === '' || !Number.isFinite(bpm)) {
		return { ok: false, message: 'Enter the tempo as a number of beats per minute.' };
	}
	if (bpm < MIN_BPM || bpm > MAX_BPM) {
		return { ok: false, message: `Enter a tempo from ${MIN_BPM} to ${MAX_BPM} BPM.` };
	}
	return { ok: true, bpm: Math.round(bpm * 10) / 10 };
}

/** Every key the user can choose, C major first, in chromatic order. */
export function allKeys(): { tonic: PitchClass; mode: KeyMode; name: string }[] {
	const keys: { tonic: PitchClass; mode: KeyMode; name: string }[] = [];
	for (const mode of ['major', 'minor'] as const) {
		for (let tonic = 0; tonic < 12; tonic++) {
			keys.push({
				tonic: tonic as PitchClass,
				mode,
				name: keyName(tonic as PitchClass, mode),
			});
		}
	}
	return keys;
}
