import type { PitchClass } from '../music-theory';

/**
 * How sure an estimate is. `value` is 0–1; `level` is what the UI shows in words.
 * Low-confidence results are still returned so the user can see the best guess,
 * but they must never be shown as fact.
 */
export interface Confidence {
	value: number;
	level: ConfidenceLevel;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type KeyMode = 'major' | 'minor';

export interface KeyCandidate {
	tonic: PitchClass;
	mode: KeyMode;
	/** Display name spelled for the key, e.g. "B♭ major", "F♯ minor". */
	name: string;
	/** How well the key fits: profile correlation (-1…1), plus up to 0.5 for chord fit. Compare within one result only. */
	score: number;
}

export interface KeyEstimate extends KeyCandidate {
	confidence: Confidence;
	/** The next most likely keys, best first. The relative major/minor is often among them. */
	alternatives: KeyCandidate[];
}

/** A stretch of the song that seems to centre on one key. */
export interface TonalSection {
	start: number;
	end: number;
	key: KeyCandidate;
}

export interface TempoEstimate {
	/** Beats per minute. */
	bpm: number;
	/** Set when the offbeats are nearly as strong as the beats, so the music could be felt twice as fast. */
	doubleTimeBpm?: number;
	confidence: Confidence;
	/** Beat times in seconds, ascending. */
	beats: number[];
}

/**
 * One chord from the automatic analysis. User corrections are a separate layer
 * (Phase 5) and never overwrite these.
 */
export interface ChordEvent {
	start: number;
	end: number;
	/** Chord symbol spelled for the key ("Bb7", "F#m"), or null where no chord was heard. */
	chord: string | null;
	confidence: Confidence;
	/** Other chords that fit this stretch nearly as well, best first. */
	alternatives: string[];
	source: 'auto';
}

export interface AnalysisResult {
	/** Identifies the engine and version that produced the result. */
	engine: string;
	duration: number;
	/** Null when the audio has too little pitched content to estimate a key. */
	key: KeyEstimate | null;
	/** Only filled when the tonal centre seems to move during the song. */
	tonalSections: TonalSection[];
	/** Null when no steady beat was found. */
	tempo: TempoEstimate | null;
	chords: ChordEvent[];
	/** Plain-language notes about limits of this result. */
	notes: string[];
}

export type AnalysisStage = 'spectrum' | 'beats' | 'key' | 'chords';

export interface AnalysisProgress {
	stage: AnalysisStage;
	/** 0–1 across the whole analysis. */
	fraction: number;
}

export type AnalysisErrorCode = 'silent' | 'too-short' | 'failed' | 'cancelled';

export class AnalysisError extends Error {
	readonly code: AnalysisErrorCode;

	constructor(code: AnalysisErrorCode, message: string) {
		super(message);
		this.name = 'AnalysisError';
		this.code = code;
	}
}
