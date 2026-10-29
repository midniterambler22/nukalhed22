import type {
	AnalysisStage,
	ChordEvent,
	ConfidenceLevel,
	KeyEstimate,
} from '../../services/analysis';

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

export interface ChordShare {
	chord: string;
	/** Share of the time with any chord, 0–1. */
	share: number;
}

/** Chords ordered by how much of the song they cover; stretches with no chord are left out. */
export function chordShares(events: readonly ChordEvent[]): ChordShare[] {
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
