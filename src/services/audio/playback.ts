import { clampTime } from './time';

/**
 * Playback controller around one media element. The element's `currentTime` is the
 * app's single clock: the controller never keeps its own timer, it only mirrors
 * what the element reports.
 */

/** The parts of `HTMLMediaElement` the controller uses, so tests can pass a fake. */
export interface MediaElementLike {
	src: string;
	currentTime: number;
	readonly duration: number;
	readonly paused: boolean;
	volume: number;
	muted: boolean;
	readonly error: { code: number } | null;
	play(): Promise<void>;
	pause(): void;
	load(): void;
	removeAttribute(name: string): void;
	addEventListener(type: string, listener: () => void): void;
	removeEventListener(type: string, listener: () => void): void;
}

export type PlaybackStatus = 'empty' | 'loading' | 'ready' | 'error';

export interface PlaybackState {
	status: PlaybackStatus;
	playing: boolean;
	/** Seconds, as last reported by the element (or set by a seek). */
	currentTime: number;
	/** Seconds; 0 until metadata has loaded. */
	duration: number;
	volume: number;
	muted: boolean;
	/** Why the song can't be played (status 'error'), or why a play request failed. */
	error: string | null;
}

export interface PlaybackController {
	getState(): PlaybackState;
	/** Reads the element directly; use this, not `getState().currentTime`, for anything that tracks the music. */
	getCurrentTime(): number;
	subscribe(listener: () => void): () => void;
	load(src: string): void;
	unload(): void;
	play(): Promise<void>;
	pause(): void;
	togglePlay(): Promise<void>;
	seek(seconds: number): void;
	skip(seconds: number): void;
	setVolume(volume: number): void;
	setMuted(muted: boolean): void;
	destroy(): void;
}

/** `MediaError` codes. */
const MEDIA_ERR_ABORTED = 1;
const MEDIA_ERR_NETWORK = 2;
const MEDIA_ERR_DECODE = 3;
const MEDIA_ERR_SRC_NOT_SUPPORTED = 4;

export function mediaErrorMessage(code: number | undefined): string {
	switch (code) {
		case MEDIA_ERR_ABORTED:
			return 'Loading the song was stopped. Choose the file again.';
		case MEDIA_ERR_NETWORK:
			return 'The file couldn’t be read. Check it’s still on this device and choose it again.';
		case MEDIA_ERR_DECODE:
			return 'The song couldn’t be played: the file looks damaged. Try another copy, or convert it to MP3 or WAV.';
		case MEDIA_ERR_SRC_NOT_SUPPORTED:
			return 'This browser can’t play this file. It may be damaged, or not the format its name says. Try converting it to MP3 or WAV.';
		default:
			return 'The song couldn’t be played. Choose the file again, or try another file.';
	}
}

function playRejectionMessage(reason: unknown): string {
	if (reason instanceof Error && reason.name === 'NotAllowedError') {
		return 'The browser blocked playback. Press Play again.';
	}
	return 'The song couldn’t start playing. Press Play again, or choose the file again.';
}

function knownDuration(duration: number): number {
	return Number.isFinite(duration) && duration > 0 ? duration : 0;
}

const EMPTY_STATE = {
	status: 'empty',
	playing: false,
	currentTime: 0,
	duration: 0,
	error: null,
} as const;

export function createPlaybackController(media: MediaElementLike): PlaybackController {
	let state: PlaybackState = { ...EMPTY_STATE, volume: media.volume, muted: media.muted };
	const listeners = new Set<() => void>();

	function update(patch: Partial<PlaybackState>) {
		const next = { ...state, ...patch };
		const changed = (Object.keys(patch) as (keyof PlaybackState)[]).some(
			(key) => next[key] !== state[key],
		);
		if (!changed) return;
		state = next;
		listeners.forEach((listener) => listener());
	}

	const handlers: Record<string, () => void> = {
		loadedmetadata: () => {
			if (state.status !== 'loading') return;
			update({
				status: 'ready',
				duration: knownDuration(media.duration),
				currentTime: media.currentTime,
			});
		},
		durationchange: () => {
			if (state.status === 'ready') update({ duration: knownDuration(media.duration) });
		},
		timeupdate: () => update({ currentTime: media.currentTime }),
		seeked: () => update({ currentTime: media.currentTime }),
		play: () => update({ playing: true, error: null }),
		pause: () => update({ playing: false, currentTime: media.currentTime }),
		ended: () => update({ playing: false, currentTime: media.currentTime }),
		volumechange: () => update({ volume: media.volume, muted: media.muted }),
		error: () => {
			// Clearing `src` on unload fires an error too; only report errors for a song being loaded or played.
			if (state.status === 'empty') return;
			update({
				status: 'error',
				playing: false,
				error: mediaErrorMessage(media.error?.code),
			});
		},
	};
	for (const [type, handler] of Object.entries(handlers)) media.addEventListener(type, handler);

	const controller: PlaybackController = {
		getState: () => state,
		getCurrentTime: () => media.currentTime,
		subscribe(listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		load(src) {
			media.pause();
			update({ ...EMPTY_STATE, status: 'loading' });
			media.src = src;
			media.load();
		},
		unload() {
			media.pause();
			update({ ...EMPTY_STATE });
			media.removeAttribute('src');
			media.load();
		},
		async play() {
			if (state.status !== 'ready') return;
			try {
				await media.play();
			} catch (reason) {
				// A newer load or a pause can interrupt play(); only a failure on the current song matters.
				if (state.status === 'ready' && media.paused) {
					update({ playing: false, error: playRejectionMessage(reason) });
				}
			}
		},
		pause() {
			media.pause();
		},
		togglePlay() {
			if (media.paused) return controller.play();
			media.pause();
			return Promise.resolve();
		},
		seek(seconds) {
			if (state.status !== 'ready') return;
			const time = clampTime(seconds, state.duration || Infinity);
			media.currentTime = time;
			// Show the new position at once instead of waiting for the element's 'seeked' event.
			update({ currentTime: time });
		},
		skip(seconds) {
			controller.seek(media.currentTime + seconds);
		},
		setVolume(volume) {
			media.volume = Math.min(Math.max(Number.isFinite(volume) ? volume : 0, 0), 1);
			if (media.volume > 0 && media.muted) media.muted = false;
		},
		setMuted(muted) {
			media.muted = muted;
		},
		destroy() {
			for (const [type, handler] of Object.entries(handlers))
				media.removeEventListener(type, handler);
			listeners.clear();
		},
	};
	return controller;
}
