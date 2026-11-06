/**
 * The user's corrections to the automatic analysis: key, tempo and chords. They are
 * a separate layer laid over the analysis result, which is never changed.
 */
export * from './types';
export {
	addChordChange,
	clearSpans,
	confirmChord,
	mergeChords,
	MIN_CHORD_SECONDS,
	normalizeChord,
	paintSpan,
	removeChord,
	revertChord,
	setChordLabel,
	setChordTiming,
} from './chords';
export {
	allKeys,
	hasCorrections,
	MAX_BPM,
	MIN_BPM,
	NO_CORRECTIONS,
	parseBpm,
	songKey,
	songTempo,
} from './song';
export {
	browserStore,
	loadCorrections,
	parseCorrections,
	saveCorrections,
	songStorageId,
	type KeyValueStore,
} from './storage';
