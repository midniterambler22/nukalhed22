import { useEffect, useState } from 'react';
import type { PlaybackController } from '../services/audio';

/**
 * The current playback time for display, read from the audio element. The element is
 * the only clock: this hook never advances time itself. It re-reads the element on
 * every animation frame while playing, and at once on any playback change such as a
 * seek, so a control never shows (or sends back) a stale position.
 */
export function usePlaybackTime(controller: PlaybackController): number {
	const [time, setTime] = useState(() => controller.getCurrentTime());

	useEffect(() => {
		let frame = 0;
		function sync() {
			cancelAnimationFrame(frame);
			setTime(controller.getCurrentTime());
			if (controller.getState().playing) frame = requestAnimationFrame(sync);
		}
		frame = requestAnimationFrame(sync);
		const unsubscribe = controller.subscribe(sync);
		return () => {
			unsubscribe();
			cancelAnimationFrame(frame);
		};
	}, [controller]);

	return time;
}
