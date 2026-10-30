import type { ChordEvent, Confidence } from '../analysis';
import { formatChordSymbol, parseChordSymbol } from '../music-theory';
import { chordIndexAt } from '../progression';
import type { ChordSpan, EditResult, TimelineChord } from './types';

/**
 * The chord correction layer. The user's chords are spans laid over the automatic
 * chords; every edit (rename, retime, add, remove, confirm) becomes "paint this
 * stretch with this chord", so edits are tied to times, not to positions in a list,
 * and survive the analysis being run again.
 */

/** Times closer than this are the same boundary. */
const EPSILON = 0.001;

/** The shortest chord an edit may leave behind, in seconds. */
export const MIN_CHORD_SECONDS = 0.25;

/** The chord symbol in its stored form ("Bb7" from "bb7" or "B♭7"), or null if it isn't one. */
export function normalizeChord(text: string): string | null {
	try {
		return formatChordSymbol(parseChordSymbol(text));
	} catch {
		return null;
	}
}

/** Removes `start`…`end` from the spans, trimming or splitting any that overlap it. */
export function clearSpans(spans: readonly ChordSpan[], start: number, end: number): ChordSpan[] {
	const out: ChordSpan[] = [];
	for (const span of spans) {
		if (span.end <= start + EPSILON || span.start >= end - EPSILON) {
			out.push(span);
			continue;
		}
		if (span.start < start - EPSILON) out.push({ ...span, end: start });
		if (span.end > end + EPSILON) out.push({ ...span, start: end });
	}
	return out;
}

/** Lays a span over the others: inside it, the new chord wins. */
export function paintSpan(spans: readonly ChordSpan[], span: ChordSpan): ChordSpan[] {
	if (!(span.end - span.start > EPSILON)) return [...spans];
	return [...clearSpans(spans, span.start, span.end), span].sort((a, b) => a.start - b.start);
}

interface Piece {
	start: number;
	end: number;
	chord: string | null;
	auto: ChordEvent | null;
}

function lower(a: Confidence | null, b: Confidence | null): Confidence | null {
	if (!a) return b;
	if (!b) return a;
	return b.value < a.value ? b : a;
}

function toTimelineChord(piece: Piece): TimelineChord {
	const confidence = piece.auto?.confidence ?? null;
	return {
		start: piece.start,
		end: piece.end,
		chord: piece.chord,
		confidence,
		alternatives: piece.auto?.alternatives ?? [],
		edited: piece.auto === null,
		needsReview: piece.chord !== null && confidence !== null && confidence.level !== 'high',
	};
}

/**
 * The timeline the user sees: automatic chords with the user's spans laid over
 * them, in time order, with touching pieces of the same chord joined into one.
 */
export function mergeChords(
	auto: readonly ChordEvent[],
	spans: readonly ChordSpan[],
): TimelineChord[] {
	const pieces: Piece[] = [];
	for (const event of auto) {
		let rest: ChordSpan[] = [{ start: event.start, end: event.end, chord: event.chord }];
		for (const span of spans) rest = clearSpans(rest, span.start, span.end);
		for (const r of rest) if (r.end - r.start > EPSILON) pieces.push({ ...r, auto: event });
	}
	for (const span of spans) pieces.push({ ...span, auto: null });
	pieces.sort((a, b) => a.start - b.start);

	const out: TimelineChord[] = [];
	for (const piece of pieces) {
		const next = toTimelineChord(piece);
		const last = out[out.length - 1];
		if (last && last.chord === piece.chord && Math.abs(last.end - piece.start) < EPSILON) {
			last.end = piece.end;
			last.edited ||= next.edited;
			last.needsReview ||= next.needsReview;
			last.confidence = lower(last.confidence, next.confidence);
			if (last.alternatives.length === 0) last.alternatives = next.alternatives;
		} else {
			out.push(next);
		}
	}
	return out;
}

function touches(a: TimelineChord | undefined, b: TimelineChord | undefined): boolean {
	return a !== undefined && b !== undefined && Math.abs(a.end - b.start) < EPSILON;
}

/** Sets the chord for the whole of timeline chord `index`. Setting the same chord confirms it. */
export function setChordLabel(
	timeline: readonly TimelineChord[],
	spans: readonly ChordSpan[],
	index: number,
	chord: string | null,
): EditResult {
	const event = timeline[index];
	if (!event) return { ok: false, message: 'That chord is no longer on the timeline.' };
	return { ok: true, chords: paintSpan(spans, { start: event.start, end: event.end, chord }) };
}

/** Marks timeline chord `index` as checked: the user agrees with the estimate. */
export function confirmChord(
	timeline: readonly TimelineChord[],
	spans: readonly ChordSpan[],
	index: number,
): EditResult {
	return setChordLabel(timeline, spans, index, timeline[index]?.chord ?? null);
}

/**
 * Moves the start and end of timeline chord `index`. The chords on either side
 * grow or shrink to fill the change, and must keep at least MIN_CHORD_SECONDS.
 */
export function setChordTiming(
	timeline: readonly TimelineChord[],
	spans: readonly ChordSpan[],
	index: number,
	start: number,
	end: number,
	duration: number,
): EditResult {
	const event = timeline[index];
	if (!event) return { ok: false, message: 'That chord is no longer on the timeline.' };
	if (!Number.isFinite(start) || !Number.isFinite(end)) {
		return {
			ok: false,
			message: 'Enter the times as seconds or minutes:seconds, like 1:05.5.',
		};
	}
	const previous = timeline[index - 1];
	const next = timeline[index + 1];
	const earliest = previous ? previous.start + MIN_CHORD_SECONDS : 0;
	const latest = next ? next.end - MIN_CHORD_SECONDS : duration > 0 ? duration : Infinity;
	if (end - start < MIN_CHORD_SECONDS) {
		return {
			ok: false,
			message: 'The chord has to end at least a quarter second after it starts.',
		};
	}
	if (start < earliest - EPSILON) {
		return {
			ok: false,
			message: previous
				? 'The chord can’t start before the chord before it has had a quarter second.'
				: 'The chord can’t start before the song does.',
		};
	}
	if (end > latest + EPSILON) {
		return {
			ok: false,
			message: next
				? 'The chord can’t end after the next chord has had a quarter second.'
				: 'The chord can’t end after the song does.',
		};
	}

	let out = [...spans];
	// What the chord gives up goes to the chord next to it, or to "no chord" across a gap.
	if (start > event.start + EPSILON) {
		const chord = touches(previous, event) ? (previous?.chord ?? null) : null;
		out = paintSpan(out, { start: event.start, end: start, chord });
	}
	if (end < event.end - EPSILON) {
		const chord = touches(event, next) ? (next?.chord ?? null) : null;
		out = paintSpan(out, { start: end, end: event.end, chord });
	}
	return { ok: true, chords: paintSpan(out, { start, end, chord: event.chord }) };
}

/** Removes the change into timeline chord `index`: the chord before it (or after it) carries on. */
export function removeChord(
	timeline: readonly TimelineChord[],
	spans: readonly ChordSpan[],
	index: number,
): EditResult {
	const event = timeline[index];
	if (!event) return { ok: false, message: 'That chord is no longer on the timeline.' };
	const previous = timeline[index - 1];
	const next = timeline[index + 1];
	let chord: string | null = null;
	if (touches(previous, event)) chord = previous?.chord ?? null;
	else if (touches(event, next)) chord = next?.chord ?? null;
	return { ok: true, chords: paintSpan(spans, { start: event.start, end: event.end, chord }) };
}

/**
 * Adds a chord change at `time`: from there to the next change, the chord is
 * `chord`. Works on an empty timeline too, for entering chords by hand.
 */
export function addChordChange(
	timeline: readonly TimelineChord[],
	spans: readonly ChordSpan[],
	time: number,
	chord: string | null,
	duration: number,
): EditResult {
	if (!Number.isFinite(time) || time < 0 || (duration > 0 && time >= duration)) {
		return { ok: false, message: 'Choose a time inside the song.' };
	}
	const index = chordIndexAt(timeline, time);
	const event = timeline[index];
	if (event) {
		if (event.chord === chord) {
			return { ok: false, message: 'That chord is already playing there.' };
		}
		if (time - event.start < MIN_CHORD_SECONDS || event.end - time < MIN_CHORD_SECONDS) {
			return {
				ok: false,
				message:
					'That’s too close to a chord change. Move a quarter second away, or edit that chord instead.',
			};
		}
		return { ok: true, chords: paintSpan(spans, { start: time, end: event.end, chord }) };
	}
	const following = timeline.find((e) => e.start > time);
	const end = following?.start ?? (duration > 0 ? duration : time + 4);
	if (end - time < MIN_CHORD_SECONDS) {
		return { ok: false, message: 'That’s too close to the next chord change.' };
	}
	return { ok: true, chords: paintSpan(spans, { start: time, end, chord }) };
}

/** Takes away the user's chords under timeline chord `index`, so the estimate shows again. */
export function revertChord(
	timeline: readonly TimelineChord[],
	spans: readonly ChordSpan[],
	index: number,
): EditResult {
	const event = timeline[index];
	if (!event) return { ok: false, message: 'That chord is no longer on the timeline.' };
	return { ok: true, chords: clearSpans(spans, event.start, event.end) };
}
