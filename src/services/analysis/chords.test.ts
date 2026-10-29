import { describe, expect, it } from 'vitest';
import { parseNoteName, spellScale } from '../music-theory';
import {
	buildTemplates,
	chordSymbol,
	prepareChroma,
	recognizeChords,
	toChordEvents,
} from './chords';
import type { Chromagram } from './features';

function strongest(vector: Float64Array, count: number): number[] {
	return Array.from(vector.keys())
		.sort((a, b) => (vector[b] ?? 0) - (vector[a] ?? 0))
		.slice(0, count)
		.sort((a, b) => a - b);
}

/** A chromagram at 10 frames per second from (seconds, pitch classes) pairs. */
function chromagramOf(parts: [number, number[]][]): Chromagram {
	const frames: Float64Array[] = [];
	const rms: number[] = [];
	for (const [seconds, pcs] of parts) {
		for (let i = 0; i < seconds * 10; i++) {
			const frame = new Float64Array(12).fill(0.05);
			for (const pc of pcs) frame[pc] = 1;
			frames.push(frame);
			rms.push(pcs.length > 0 ? 0.2 : 0);
		}
	}
	return { frameRate: 10, frames, rms: Float64Array.from(rms) };
}

describe('chord templates', () => {
	it('builds 48 templates from the theory module’s formulas', () => {
		const templates = buildTemplates();
		expect(templates).toHaveLength(48);
		const cMajor = templates.find((t) => t.root === 0 && t.quality === 'major');
		expect(strongest(cMajor?.vector ?? new Float64Array(12), 3)).toEqual([0, 4, 7]);
		const a7 = templates.find((t) => t.root === 9 && t.quality === 'dominant7');
		expect(strongest(a7?.vector ?? new Float64Array(12), 4)).toEqual([1, 4, 7, 9]);
	});

	it('treats a flat chroma as no pitch', () => {
		expect(prepareChroma(new Array(12).fill(0.5))).toBeNull();
		expect(prepareChroma(new Array(12).fill(0))).toBeNull();
	});
});

describe('recognizeChords', () => {
	it('labels and times a progression, with silence as no chord', () => {
		const chromagram = chromagramOf([
			[1, []],
			[2, [0, 4, 7]],
			[2, [9, 0, 4]],
			[2, [7, 11, 2, 5]],
		]);
		const boundaries = Array.from({ length: 15 }, (_, i) => i * 0.5);
		const events = toChordEvents(recognizeChords(chromagram, boundaries));
		expect(events.map((e) => [e.start, e.end, e.chord])).toEqual([
			[0, 1, null],
			[1, 3, 'C'],
			[3, 5, 'Am'],
			[5, 7, 'G7'],
		]);
		expect(events.every((e) => e.source === 'auto')).toBe(true);
		expect(events[1]?.confidence.level).toBe('high');
	});

	it('smooths over a single odd segment', () => {
		const chromagram = chromagramOf([
			[2, [0, 4, 7]],
			[0.5, [0, 4, 7, 11]],
			[2, [0, 4, 7]],
		]);
		const boundaries = Array.from({ length: 10 }, (_, i) => i * 0.5);
		expect(toChordEvents(recognizeChords(chromagram, boundaries)).map((e) => e.chord)).toEqual([
			'C',
		]);
	});
});

describe('chord names', () => {
	it('spells roots for the key, and with sharps without one', () => {
		const fMajor = spellScale(parseNoteName('F'), 'major').map((n) => n.note);
		expect(chordSymbol({ root: 10, quality: 'major' }, fMajor)).toBe('Bb');
		expect(chordSymbol({ root: 10, quality: 'major' })).toBe('A#');
		expect(chordSymbol({ root: 6, quality: 'minor7' })).toBe('F#m7');
	});
});
