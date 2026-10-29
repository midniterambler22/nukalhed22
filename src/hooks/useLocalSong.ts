import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
	AudioDecodeError,
	createPlaybackController,
	decodeForAnalysis,
	MAX_ANALYSIS_SECONDS,
	type DecodedAudio,
	type PlaybackController,
	type PlaybackState,
} from '../services/audio';
import { validateAudioFile, type AudioFormat, type CanPlayType } from '../services/validation';

/** A song the user opened from this device. */
export interface SongFile {
	name: string;
	size: number;
	format: AudioFormat;
}

/** Decoding the song for analysis, which runs after playback has loaded. */
export type AnalysisAudioState =
	| { status: 'idle' }
	| { status: 'waiting' }
	| { status: 'decoding' }
	| { status: 'ready'; audio: DecodedAudio }
	| { status: 'error'; message: string };

export interface LocalSong {
	controller: PlaybackController;
	playback: PlaybackState;
	song: SongFile | null;
	/** Why the last chosen file was refused. The previous song, if any, stays loaded. */
	fileError: string | null;
	analysisAudio: AnalysisAudioState;
	openFile(file: File): void;
}

export interface LocalSongOptions {
	/** Decodes a file for analysis; defaults to the browser decoder. Tests pass a fake. */
	decode?: (file: File) => Promise<DecodedAudio>;
	/** Defaults to the player element's `canPlayType`. */
	canPlayType?: CanPlayType;
}

async function decodeFile(file: File): Promise<DecodedAudio> {
	return decodeForAnalysis(await file.arrayBuffer());
}

/**
 * Opens local audio files, plays them through one <audio> element, and decodes them
 * in the browser for analysis. Nothing is uploaded: the element plays an object URL
 * for the file, and decoding reads the file in memory.
 */
export function useLocalSong({
	decode = decodeFile,
	canPlayType,
}: LocalSongOptions = {}): LocalSong {
	const [{ media, controller }] = useState(() => {
		const element = new Audio();
		element.preload = 'auto';
		return { media: element, controller: createPlaybackController(element) };
	});
	const playback = useSyncExternalStore(controller.subscribe, controller.getState);
	const [song, setSong] = useState<SongFile | null>(null);
	const [fileError, setFileError] = useState<string | null>(null);
	const [analysisAudio, setAnalysisAudio] = useState<AnalysisAudioState>({ status: 'idle' });
	const objectUrl = useRef<string | null>(null);
	const generation = useRef(0);

	const openFile = useCallback(
		(file: File) => {
			const check = validateAudioFile(
				file,
				canPlayType ?? ((type) => media.canPlayType(type)),
			);
			if (!check.ok) {
				setFileError(check.error.message);
				return;
			}
			const current = ++generation.current;
			if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
			objectUrl.current = URL.createObjectURL(file);
			setFileError(null);
			setSong({ name: file.name, size: file.size, format: check.format });
			setAnalysisAudio({ status: 'waiting' });
			controller.load(objectUrl.current);

			// Decode once playback knows the duration, so a song too long to analyze is never decoded.
			const stop = controller.subscribe(() => {
				const { status, duration } = controller.getState();
				if (generation.current !== current) return stop();
				if (status === 'loading') return;
				stop();
				if (status !== 'ready') {
					setAnalysisAudio({ status: 'idle' });
				} else if (duration > MAX_ANALYSIS_SECONDS) {
					setAnalysisAudio({
						status: 'error',
						message: `Songs longer than ${MAX_ANALYSIS_SECONDS / 60} minutes can be played but not analyzed.`,
					});
				} else {
					setAnalysisAudio({ status: 'decoding' });
					decode(file).then(
						(audio) => {
							if (generation.current === current)
								setAnalysisAudio({ status: 'ready', audio });
						},
						(error: unknown) => {
							if (generation.current !== current) return;
							const message =
								error instanceof AudioDecodeError
									? error.message
									: 'The audio couldn’t be prepared for analysis. Playback still works; try choosing the file again.';
							setAnalysisAudio({ status: 'error', message });
						},
					);
				}
			});
		},
		[canPlayType, controller, decode, media],
	);

	// Stop and release the file when the workspace goes away.
	useEffect(
		() => () => {
			generation.current++;
			controller.unload();
			if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
			objectUrl.current = null;
		},
		[controller],
	);

	return { controller, playback, song, fileError, analysisAudio, openFile };
}
