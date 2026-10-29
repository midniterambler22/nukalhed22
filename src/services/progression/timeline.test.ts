import { describe, expect, it } from 'vitest';
import {
	chordIndexAt,
	nextChangeIndex,
	previousChangeIndex,
	timeMarkers,
	type TimedChord,
} from '.';

const events: TimedChord[] = [
	{ start: 0, end: 0.5, chord: null },
	{ start: 0.5, end: 2.9, chord: 'A7' },
	{ start: 2.9, end: 5.3, chord: 'A7' },
	{ start: 5.3, end: 7.7, chord: 'D7' },
	{ start: 8, end: 10, chord: 'E7' },
];

describe('chordIndexAt', () => {
	it('finds the event playing at a time, start inclusive and end exclusive', () => {
		expect(chordIndexAt(events, 0)).toBe(0);
		expect(chordIndexAt(events, 0.5)).toBe(1);
		expect(chordIndexAt(events, 2.899)).toBe(1);
		expect(chordIndexAt(events, 2.9)).toBe(2);
		expect(chordIndexAt(events, 9.99)).toBe(4);
	});

	it('returns -1 in a gap, before the start, after the end, and for no events', () => {
		expect(chordIndexAt(events, 7.8)).toBe(-1);
		expect(chordIndexAt(events, -1)).toBe(-1);
		expect(chordIndexAt(events, 10)).toBe(-1);
		expect(chordIndexAt([], 1)).toBe(-1);
	});
});

describe('nextChangeIndex', () => {
	it('skips later events with the same chord as now', () => {
		expect(nextChangeIndex(events, 1)).toBe(3);
	});

	it('finds the first named chord from silence or a gap', () => {
		expect(nextChangeIndex(events, 0.1)).toBe(1);
		expect(nextChangeIndex(events, 7.8)).toBe(4);
	});

	it('returns -1 when nothing changes again', () => {
		expect(nextChangeIndex(events, 9)).toBe(-1);
	});
});

describe('timeMarkers', () => {
	it('picks a round step for about the target number of labels', () => {
		expect(timeMarkers(58, 8)).toEqual([0, 10, 20, 30, 40, 50]);
		expect(timeMarkers(240, 6)).toEqual([0, 60, 120, 180, 240]);
		expect(timeMarkers(6, 8)).toEqual([0, 1, 2, 3, 4, 5, 6]);
	});

	it('returns nothing for an unknown duration', () => {
		expect(timeMarkers(0, 8)).toEqual([]);
		expect(timeMarkers(Number.NaN, 8)).toEqual([]);
	});
});

describe('previousChangeIndex', () => {
	it('goes to the start of the current chord, or the one before near its start', () => {
		expect(previousChangeIndex(events, 6.8)).toBe(3);
		expect(previousChangeIndex(events, 5.6)).toBe(2);
	});

	it('returns -1 when nothing named starts earlier', () => {
		expect(previousChangeIndex(events, 1)).toBe(-1);
	});
});
