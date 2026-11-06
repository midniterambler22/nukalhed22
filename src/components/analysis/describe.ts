import type { AnalysisStage, ConfidenceLevel, KeyEstimate } from '../../services/analysis';
import type { SongKey, SongTempo, TimelineChord } from '../../services/corrections';
import type { TimedChord } from '../../services/progression';

/** Confidence in words, so it never depends on colour or a number alone. */
export const CONFIDENCE_WORDS: Readonly<Record<ConfidenceLevel, string>> = {
	high: 'likely',
	medium: 'possible',
	low: 'uncertain',
};

export const STAGE_WORDS: Readonly<Record<AnalysisStage, string>> = {
	spectrum: 'listening for pitches',
	beats: 'finding the beat',
	chords: 'naming the chords',
	key: 'working out the key',
};

/** The key as a headline that says how sure it is: "A minor", "Probably A minor", "Unclear". */
export function keyHeadline(key: KeyEstimate): string {
	if (key.confidence.level === 'high') return key.name;
	if (key.confidence.level === 'medium') return `Probably ${key.name}`;
	return `Unclear, maybe ${key.name}`;
}

/** The key as a headline: the user's key as it is, an estimate with how sure it is. */
export function songKeyHeadline(key: SongKey): string {
	if (key.source === 'user' || !key.estimate) return key.name;
	return keyHeadline(key.estimate);
}

/** "Set by you", or the estimate's confidence in words. */
export function sourceWords(item: SongKey | SongTempo | TimelineChord): string {
	if (!item.confidence) return 'set by you';
	return CONFIDENCE_WORDS[item.confidence.level];
}

/** An estimate the user should check: anything less than likely they haven't corrected. */
export function keyOrTempoNeedsReview(item: SongKey | SongTempo | null): boolean {
	return item !== null && item.confidence !== null && item.confidence.level !== 'high';
}

export interface ChordShare {
	chord: string;
	/** Share of the time with any chord, 0–1. */
	share: number;
}

/** Chords ordered by how much of the song they cover; stretches with no chord are left out. */
export function chordShares(events: readonly TimedChord[]): ChordShare[] {
	const totals = new Map<string, number>();
	let total = 0;
	for (const event of events) {
		if (!event.chord) continue;
		const length = event.end - event.start;
		totals.set(event.chord, (totals.get(event.chord) ?? 0) + length);
		total += length;
	}
	return [...totals]
		.map(([chord, length]) => ({ chord, share: total > 0 ? length / total : 0 }))
		.sort((a, b) => b.share - a.share);
}

/** "B♭" from "Bb": chord symbols are stored in ASCII and shown with real accidentals. */
export function displayChord(symbol: string): string {
	return symbol.replace(/^([A-G])#/, '$1♯').replace(/^([A-G])b/, '$1♭');
}

/** How many chord colours the theme defines (--chord-0 … --chord-5). */
export const CHORD_COLOR_COUNT = 6;

/**
 * A colour slot per chord symbol, most-played chord first, so the timeline and the
 * chord list colour each chord the same way. Colour only reinforces the written name.
 */
export function chordColorSlots(events: readonly TimedChord[]): Map<string, number> {
	return new Map(chordShares(events).map((s, i) => [s.chord, i % CHORD_COLOR_COUNT]));
}
