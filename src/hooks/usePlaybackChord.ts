import { useEffect, useState } from 'react';
import type { PlaybackController } from '../services/audio';
import { chordIndexAt, nextChangeIndex, type TimedChord } from '../services/progression';

export interface PlaybackChord {
	/** Index of the chord playing now, or -1. */
	current: number;
	/** Index of the next chord change, or -1. */
	next: number;
}

/**
 * The chord playing now and the next change, read from the audio element's time.
 * Re-reads on every animation frame while playing and at once on a seek, but only
 * re-renders when the chord actually changes.
 */
export function usePlaybackChord(
	controller: PlaybackController,
	events: readonly TimedChord[],
): PlaybackChord {
	const read = (): PlaybackChord => {
		const time = controller.getCurrentTime();
		return { current: chordIndexAt(events, time), next: nextChangeIndex(events, time) };
	};
	const [state, setState] = useState(read);

	useEffect(() => {
		let frame = 0;
		function sync() {
			cancelAnimationFrame(frame);
			const time = controller.getCurrentTime();
			const current = chordIndexAt(events, time);
			const next = nextChangeIndex(events, time);
			setState((prev) =>
				prev.current === current && prev.next === next ? prev : { current, next },
			);
			if (controller.getState().playing) frame = requestAnimationFrame(sync);
		}
		frame = requestAnimationFrame(sync);
		const unsubscribe = controller.subscribe(sync);
		return () => {
			unsubscribe();
			cancelAnimationFrame(frame);
		};
	}, [controller, events]);

	return state;
}
