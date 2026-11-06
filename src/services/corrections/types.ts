import type { Confidence, KeyEstimate, KeyMode, TempoEstimate } from '../analysis';
import type { PitchClass } from '../music-theory';

/**
 * A stretch of the song the user has labelled. It overrides the automatic chords
 * under it; the automatic result itself is never changed.
 */
export interface ChordSpan {
	start: number;
	end: number;
	/** Canonical chord symbol ("Bb7"), or null for "no chord here". */
	chord: string | null;
}

export interface KeyCorrection {
	tonic: PitchClass;
	mode: KeyMode;
}

/**
 * Everything the user has corrected for one song, kept apart from the analysis so
 * running the analysis again never loses it. Null means "use the estimate".
 */
export interface SongCorrections {
	key: KeyCorrection | null;
	bpm: number | null;
	/** Sorted by start and never overlapping. */
	chords: ChordSpan[];
}

/**
 * One chord on the timeline the user sees: the automatic estimate with the user's
 * chords laid over it. Neighbouring pieces with the same chord are joined.
 */
export interface TimelineChord {
	start: number;
	end: number;
	chord: string | null;
	/** Lowest confidence among the automatic parts; null when the user set all of it. */
	confidence: Confidence | null;
	/** Other chords the analysis heard here, best first. Empty where the user set the chord. */
	alternatives: string[];
	/** The user set or changed some of this chord. */
	edited: boolean;
	/** An automatic part is less than likely and the user hasn't checked it. */
	needsReview: boolean;
}

/** The key the workspace uses: the user's correction if there is one, else the estimate. */
export interface SongKey {
	tonic: PitchClass;
	mode: KeyMode;
	name: string;
	source: 'auto' | 'user';
	/** The estimate's confidence; null when the user set the key. */
	confidence: Confidence | null;
	/** The automatic estimate, kept for comparison. */
	estimate: KeyEstimate | null;
}

export interface SongTempo {
	bpm: number;
	source: 'auto' | 'user';
	confidence: Confidence | null;
	estimate: TempoEstimate | null;
}

/** An edit the user asked for that can't be made, with the reason in plain words. */
export type EditResult = { ok: true; chords: ChordSpan[] } | { ok: false; message: string };
