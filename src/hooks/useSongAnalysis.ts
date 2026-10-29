import { useCallback, useEffect, useState } from 'react';
import {
	AnalysisError,
	createWorkerEngine,
	type AnalysisEngine,
	type AnalysisProgress,
	type AnalysisResult,
} from '../services/analysis';
import type { DecodedAudio } from '../services/audio';
import type { AnalysisAudioState } from './useLocalSong';

/** Automatic analysis of the current song. Corrections (Phase 5) are kept elsewhere. */
export type SongAnalysisState =
	| { status: 'idle' }
	| { status: 'analyzing'; progress: AnalysisProgress }
	| { status: 'done'; result: AnalysisResult }
	| { status: 'failed'; message: string };

export interface SongAnalysis {
	state: SongAnalysisState;
	/** Runs the analysis again after a failure. */
	retry(): void;
}

let defaultEngine: AnalysisEngine | null = null;

/** Analysis in a Web Worker, so playback and the page stay responsive. */
function workerEngine(): AnalysisEngine {
	defaultEngine ??= createWorkerEngine(
		() =>
			new Worker(new URL('../services/analysis/analysis.worker.ts', import.meta.url), {
				type: 'module',
			}),
	);
	return defaultEngine;
}

/**
 * Analyzes each song once its audio is decoded, on this device. A new song cancels
 * the analysis of the previous one, so a late result never shows for the wrong song.
 */
export function useSongAnalysis(
	audio: AnalysisAudioState,
	engine: AnalysisEngine = workerEngine(),
): SongAnalysis {
	const [attempt, setAttempt] = useState(0);
	const decoded = audio.status === 'ready' ? audio.audio : null;
	// The latest update from a job, tagged with the audio and attempt it belongs to, so
	// an update for an older song or attempt is never shown.
	const [latest, setLatest] = useState<{
		audio: DecodedAudio;
		attempt: number;
		state: SongAnalysisState;
	} | null>(null);

	useEffect(() => {
		if (!decoded) return;
		let current = true;
		const update = (state: SongAnalysisState) => {
			if (current) setLatest({ audio: decoded, attempt, state });
		};
		const job = engine.analyze(decoded, (progress) =>
			update({ status: 'analyzing', progress }),
		);
		job.result.then(
			(result) => update({ status: 'done', result }),
			(error: unknown) => {
				if (error instanceof AnalysisError && error.code === 'cancelled') return;
				const message =
					error instanceof AnalysisError
						? error.message
						: 'Analysis stopped because of an unexpected error. Playback still works; try analyzing again.';
				update({ status: 'failed', message });
			},
		);
		return () => {
			current = false;
			job.cancel();
		};
	}, [decoded, engine, attempt]);

	let state: SongAnalysisState = { status: 'idle' };
	if (decoded) {
		state =
			latest && latest.audio === decoded && latest.attempt === attempt
				? latest.state
				: { status: 'analyzing', progress: { stage: 'spectrum', fraction: 0 } };
	}

	const retry = useCallback(() => setAttempt((n) => n + 1), []);
	return { state, retry };
}
