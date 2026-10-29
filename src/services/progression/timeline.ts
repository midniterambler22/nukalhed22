/**
 * Where playback is in a chord progression. Pure functions over time-ordered chord
 * events; the time always comes from the audio element (the single clock).
 */

/** The minimum a timed chord needs: when it starts and ends, and its symbol. */
export interface TimedChord {
	start: number;
	end: number;
	/** Null for a stretch with no chord. */
	chord: string | null;
}

/**
 * Index of the event playing at `time` (start inclusive, end exclusive), or -1 before
 * the first, after the last, or in a gap. Events must be in time order.
 */
export function chordIndexAt(events: readonly TimedChord[], time: number): number {
	let low = 0;
	let high = events.length - 1;
	while (low <= high) {
		const mid = (low + high) >> 1;
		const event = events[mid];
		if (!event) break;
		if (time < event.start) high = mid - 1;
		else if (time >= event.end) low = mid + 1;
		else return mid;
	}
	return -1;
}

/**
 * Index of the next chord change after `time`: the first later event whose chord is
 * a different, named chord than the one playing now. -1 when nothing changes again.
 */
export function nextChangeIndex(events: readonly TimedChord[], time: number): number {
	const current = chordIndexAt(events, time);
	const playing = current === -1 ? null : (events[current]?.chord ?? null);
	for (let i = 0; i < events.length; i++) {
		const event = events[i];
		if (!event || event.start <= time || event.chord === null) continue;
		if (event.chord !== playing) return i;
	}
	return -1;
}

/**
 * Index of the chord to go back to, like a media player's "previous": the start of
 * the chord playing now, unless playback is within `grace` seconds of that start,
 * then the named chord before it. -1 when there is nothing earlier.
 */
export function previousChangeIndex(
	events: readonly TimedChord[],
	time: number,
	grace = 1,
): number {
	for (let i = events.length - 1; i >= 0; i--) {
		const event = events[i];
		if (event && event.chord !== null && event.start <= time - grace) return i;
	}
	return -1;
}

/** Evenly spaced time-marker positions in seconds, at a step that keeps about `target` labels. */
export function timeMarkers(duration: number, target: number): number[] {
	if (!(duration > 0) || target < 1) return [];
	const steps = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
	const step = steps.find((s) => duration / s <= target) ?? 600;
	const markers: number[] = [];
	for (let t = 0; t <= duration; t += step) markers.push(t);
	return markers;
}
