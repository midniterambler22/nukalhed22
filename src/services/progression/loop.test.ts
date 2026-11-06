import { describe, expect, it } from 'vitest';
import { chordsInLoop, LOOP_END_MARGIN, loopForChords, loopJumpTarget } from './loop';

const CHORDS = [
	{ start: 0, end: 4, chord: 'A7' },
	{ start: 4, end: 8, chord: 'D7' },
	{ start: 8, end: 12, chord: 'E7' },
];

describe('loops', () => {
	it('covers a chord or a run of chords, stopping just short of the song’s end', () => {
		expect(loopForChords(CHORDS, 1, 1, 12)).toEqual({ start: 4, end: 8 });
		expect(loopForChords(CHORDS, 2, 0, 12)).toEqual({ start: 0, end: 12 - LOOP_END_MARGIN });
		expect(loopForChords(CHORDS, 5, 5, 12)).toBeNull();
		expect(chordsInLoop(CHORDS, { start: 4, end: 11.9 })).toEqual({ first: 1, last: 2 });
		expect(chordsInLoop(CHORDS, { start: 20, end: 30 })).toBeNull();
	});

	it('jumps back only when playback plays past the end from inside the loop', () => {
		const loop = { start: 4, end: 8 };
		expect(loopJumpTarget(loop, 7.98, 8.01)).toBe(4);
		expect(loopJumpTarget(loop, 6, 7)).toBeNull();
		// A seek out of the loop is the user's choice, not playback crossing the end.
		expect(loopJumpTarget(loop, 5, 30)).toBeNull();
		expect(loopJumpTarget(loop, 9, 9.02)).toBeNull();
		expect(loopJumpTarget(loop, 2, 2.02)).toBeNull();
	});
});
