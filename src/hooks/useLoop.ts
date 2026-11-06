import { useEffect } from 'react';
import type { PlaybackController } from '../services/audio';
import { loopJumpTarget, type LoopRange } from '../services/progression';

/**
 * Repeats a stretch of the song. It watches the audio element's time on every frame
 * while playing and seeks back to the loop's start when playback passes its end; it
 * never keeps a clock of its own.
 */
export function useLoop(controller: PlaybackController, loop: LoopRange | null): void {
	useEffect(() => {
		if (!loop) return;
		let frame = 0;
		let previous = controller.getCurrentTime();
		function check() {
			cancelAnimationFrame(frame);
			const time = controller.getCurrentTime();
			const target = loop ? loopJumpTarget(loop, previous, time) : null;
			if (target !== null) controller.seek(target);
			previous = target ?? time;
			if (controller.getState().playing) frame = requestAnimationFrame(check);
		}
		frame = requestAnimationFrame(check);
		const unsubscribe = controller.subscribe(check);
		return () => {
			unsubscribe();
			cancelAnimationFrame(frame);
		};
	}, [controller, loop]);
}
