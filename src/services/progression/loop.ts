import type { TimedChord } from './timeline';

/** A stretch of the song to repeat, in seconds. */
export interface LoopRange {
	start: number;
	end: number;
}

/** How far before the song's end a loop turns back, so the audio element never reaches "ended". */
export const LOOP_END_MARGIN = 0.1;

/** Playback moving forward by more than this between two reads is a seek, not playing. */
const MAX_PLAY_STEP = 1;

/**
 * The loop covering chords `first` to `last` (inclusive), or null if either is
 * missing. The end stops just short of the song's end.
 */
export function loopForChords(
	events: readonly TimedChord[],
	first: number,
	last: number,
	duration: number,
): LoopRange | null {
	const a = events[Math.min(first, last)];
	const b = events[Math.max(first, last)];
	if (!a || !b) return null;
	const end = duration > 0 ? Math.min(b.end, duration - LOOP_END_MARGIN) : b.end;
	return end > a.start ? { start: a.start, end } : null;
}

/** Indexes of the first and last chord inside a loop, or null when it covers none. */
export function chordsInLoop(
	events: readonly TimedChord[],
	loop: LoopRange,
): { first: number; last: number } | null {
	let first = -1;
	let last = -1;
	events.forEach((event, index) => {
		if (event.end > loop.start + 0.001 && event.start < loop.end - 0.001) {
			if (first === -1) first = index;
			last = index;
		}
	});
	return first === -1 ? null : { first, last };
}

/**
 * Where playback should jump when it plays past the loop's end: the loop's start.
 * Only when playback crossed the end by playing from inside the loop, so seeking
 * elsewhere in the song with a loop set still works. Null for "carry on".
 */
export function loopJumpTarget(loop: LoopRange, previous: number, time: number): number | null {
	const playedOver =
		previous >= loop.start &&
		previous < loop.end &&
		time >= loop.end &&
		time - previous < MAX_PLAY_STEP;
	return playedOver ? loop.start : null;
}
