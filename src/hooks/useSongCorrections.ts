import { useCallback, useMemo, useState } from 'react';
import type { ChordEvent } from '../services/analysis';
import {
	browserStore,
	hasCorrections,
	loadCorrections,
	mergeChords,
	NO_CORRECTIONS,
	saveCorrections,
	songKey,
	songStorageId,
	songTempo,
	type ChordSpan,
	type KeyCorrection,
	type KeyValueStore,
	type SongCorrections,
	type SongKey,
	type SongTempo,
	type TimelineChord,
} from '../services/corrections';
import type { SongFile } from './useLocalSong';
import type { SongAnalysis } from './useSongAnalysis';

/** The song as the workspace uses it: the analysis with the user's corrections laid over it. */
export interface SongTimeline {
	chords: readonly TimelineChord[];
	key: SongKey | null;
	tempo: SongTempo | null;
	corrections: SongCorrections;
	/** The user has corrected something for this song. */
	corrected: boolean;
	/** False when this browser won't save, so corrections last only until the page closes. */
	saved: boolean;
	setChords(chords: ChordSpan[]): void;
	setKey(key: KeyCorrection | null): void;
	setBpm(bpm: number | null): void;
	clearAll(): void;
}

const NO_CHORDS: readonly ChordEvent[] = [];

/**
 * Keeps the user's corrections for each song, apart from the analysis, and saves
 * them in this browser. A new analysis run (Try again) or reopening the same file
 * brings the same corrections back.
 */
export function useSongCorrections(
	song: SongFile | null,
	analysis: SongAnalysis,
	store: KeyValueStore | null = browserStore(),
): SongTimeline {
	const id = song ? songStorageId(song) : null;
	const [edits, setEdits] = useState<Readonly<Record<string, SongCorrections>>>({});
	const [saved, setSaved] = useState(true);
	const stored = useMemo(() => (id ? loadCorrections(store, id) : NO_CORRECTIONS), [id, store]);
	const corrections = (id ? edits[id] : undefined) ?? stored;

	const result = analysis.state.status === 'done' ? analysis.state.result : null;
	const auto = result?.chords ?? NO_CHORDS;
	const chords = useMemo(() => mergeChords(auto, corrections.chords), [auto, corrections.chords]);
	const key = useMemo(() => songKey(result, corrections), [result, corrections]);
	const tempo = useMemo(() => songTempo(result, corrections), [result, corrections]);

	const update = useCallback(
		(patch: Partial<SongCorrections>) => {
			if (!id) return;
			const next = { ...corrections, ...patch };
			setEdits((all) => ({ ...all, [id]: next }));
			setSaved(saveCorrections(store, id, next));
		},
		[corrections, id, store],
	);

	return {
		chords,
		key,
		tempo,
		corrections,
		corrected: hasCorrections(corrections),
		saved,
		setChords: (spans) => update({ chords: spans }),
		setKey: (k) => update({ key: k }),
		setBpm: (bpm) => update({ bpm }),
		clearAll: () => update(NO_CORRECTIONS),
	};
}
