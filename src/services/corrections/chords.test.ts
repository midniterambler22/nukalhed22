import { describe, expect, it } from 'vitest';
import { toConfidence, type ChordEvent } from '../analysis';
import {
	addChordChange,
	clearSpans,
	confirmChord,
	mergeChords,
	normalizeChord,
	paintSpan,
	removeChord,
	revertChord,
	setChordLabel,
	setChordTiming,
} from './chords';
import type { ChordSpan, EditResult } from './types';

function auto(start: number, end: number, chord: string | null, confidence = 0.9): ChordEvent {
	return {
		start,
		end,
		chord,
		confidence: toConfidence(confidence),
		alternatives: chord ? ['C'] : [],
		source: 'auto',
	};
}

/** A 12-bar-ish line: A7 (likely), D7 (unsure), A7 (likely), E7 (uncertain). */
const AUTO = [auto(0, 4, 'A7'), auto(4, 8, 'D7', 0.5), auto(8, 12, 'A7'), auto(12, 16, 'E7', 0.2)];

function spansOf(result: EditResult): ChordSpan[] {
	if (!result.ok) throw new Error(result.message);
	return result.chords;
}

function labels(spans: readonly ChordSpan[]) {
	return mergeChords(AUTO, spans).map((c) => `${c.start}-${c.end} ${c.chord ?? '-'}`);
}

describe('chord symbols', () => {
	it('stores chords in one canonical spelling and refuses unknown ones', () => {
		expect(normalizeChord('bb7')).toBe('Bb7');
		expect(normalizeChord('F♯m')).toBe('F#m');
		expect(normalizeChord(' Cmaj7 ')).toBe('Cmaj7');
		expect(normalizeChord('H7')).toBeNull();
		expect(normalizeChord('Cfoo')).toBeNull();
	});
});

describe('span painting', () => {
	it('trims and splits older spans under a new one', () => {
		const spans = paintSpan([{ start: 0, end: 10, chord: 'A' }], {
			start: 4,
			end: 6,
			chord: 'D',
		});
		expect(spans).toEqual([
			{ start: 0, end: 4, chord: 'A' },
			{ start: 4, end: 6, chord: 'D' },
			{ start: 6, end: 10, chord: 'A' },
		]);
		expect(clearSpans(spans, 3, 7)).toEqual([
			{ start: 0, end: 3, chord: 'A' },
			{ start: 7, end: 10, chord: 'A' },
		]);
	});
});

describe('merged timeline', () => {
	it('is the estimate when nothing is corrected, flagging chords that are less than likely', () => {
		const timeline = mergeChords(AUTO, []);
		expect(timeline.map((c) => c.needsReview)).toEqual([false, true, false, true]);
		expect(timeline.every((c) => !c.edited)).toBe(true);
	});

	it('never changes the automatic chords', () => {
		const before = JSON.stringify(AUTO);
		const timeline = mergeChords(AUTO, []);
		spansOf(setChordLabel(timeline, [], 1, 'Dm'));
		expect(JSON.stringify(AUTO)).toBe(before);
	});

	it('joins neighbours that end up with the same chord', () => {
		const timeline = mergeChords(AUTO, []);
		const spans = spansOf(setChordLabel(timeline, [], 1, 'A7'));
		const merged = mergeChords(AUTO, spans);
		expect(merged.map((c) => `${c.start}-${c.end} ${c.chord}`)).toEqual([
			'0-12 A7',
			'12-16 E7',
		]);
		expect(merged[0]?.edited).toBe(true);
		expect(merged[0]?.needsReview).toBe(false);
	});
});

describe('chord edits', () => {
	const timeline = mergeChords(AUTO, []);

	it('renames a chord, which also clears Needs review', () => {
		const spans = spansOf(setChordLabel(timeline, [], 3, 'E9'));
		const merged = mergeChords(AUTO, spans);
		expect(merged[3]).toMatchObject({ chord: 'E9', edited: true, needsReview: false });
		expect(merged[3]?.confidence).toBeNull();
	});

	it('confirms an estimate without changing it', () => {
		const merged = mergeChords(AUTO, spansOf(confirmChord(timeline, [], 1)));
		expect(merged[1]).toMatchObject({ chord: 'D7', needsReview: false, edited: true });
	});

	it('moves a chord change, giving the gap to the neighbour', () => {
		// D7 really starts half a beat late and runs into the next bar.
		const spans = spansOf(setChordTiming(timeline, [], 1, 4.5, 9, 16));
		expect(labels(spans)).toEqual(['0-4.5 A7', '4.5-9 D7', '9-12 A7', '12-16 E7']);
	});

	it('refuses timings that would squeeze out a neighbour or leave the song', () => {
		expect(setChordTiming(timeline, [], 1, 0.1, 6, 16).ok).toBe(false);
		expect(setChordTiming(timeline, [], 1, 5, 5.1, 16).ok).toBe(false);
		expect(setChordTiming(timeline, [], 3, 12, 17, 16).ok).toBe(false);
		expect(setChordTiming(timeline, [], 0, -1, 4, 16).ok).toBe(false);
		expect(setChordTiming(timeline, [], 1, Number.NaN, 6, 16).ok).toBe(false);
	});

	it('removes a change so the chord before carries on', () => {
		const spans = spansOf(removeChord(timeline, [], 1));
		expect(labels(spans)).toEqual(['0-12 A7', '12-16 E7']);
	});

	it('adds a chord change inside a chord', () => {
		const spans = spansOf(addChordChange(timeline, [], 14, 'D7', 16));
		expect(labels(spans)).toEqual(['0-4 A7', '4-8 D7', '8-12 A7', '12-14 E7', '14-16 D7']);
		expect(addChordChange(timeline, [], 14, 'E7', 16).ok).toBe(false);
		expect(addChordChange(timeline, [], 12.1, 'D7', 16).ok).toBe(false);
		expect(addChordChange(timeline, [], 20, 'D7', 16).ok).toBe(false);
	});

	it('lets chords be entered by hand when the analysis found none', () => {
		let spans = spansOf(addChordChange([], [], 0, 'G', 30));
		spans = spansOf(addChordChange(mergeChords([], spans), spans, 10, 'C', 30));
		expect(mergeChords([], spans).map((c) => `${c.start}-${c.end} ${c.chord}`)).toEqual([
			'0-10 G',
			'10-30 C',
		]);
	});

	it('undoes the user’s edits on one chord and leaves the others', () => {
		let spans = spansOf(setChordLabel(timeline, [], 1, 'Dm'));
		spans = spansOf(setChordLabel(mergeChords(AUTO, spans), spans, 3, 'E9'));
		spans = spansOf(revertChord(mergeChords(AUTO, spans), spans, 1));
		expect(labels(spans)).toEqual(['0-4 A7', '4-8 D7', '8-12 A7', '12-16 E9']);
	});

	it('keeps corrections when the analysis is run again and its chords move', () => {
		const spans = spansOf(setChordLabel(timeline, [], 3, 'E9'));
		const rerun = [auto(0, 3.9, 'A7'), auto(3.9, 8.1, 'D7'), auto(8.1, 16, 'A7')];
		expect(mergeChords(rerun, spans).map((c) => `${c.start}-${c.end} ${c.chord}`)).toEqual([
			'0-3.9 A7',
			'3.9-8.1 D7',
			'8.1-12 A7',
			'12-16 E9',
		]);
	});

	it('says why an edit fails when the chord is gone', () => {
		const result = setChordLabel(timeline, [], 9, 'A');
		expect(result.ok).toBe(false);
	});
});
