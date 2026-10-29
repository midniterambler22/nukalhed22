import { describe, expect, it } from 'vitest';
import { estimatePeriod, estimateTempo, normalizeOnsets, offbeatRatio, trackBeats } from './tempo';

const FRAME_RATE = 100;

/** An onset envelope with pulses every `period` frames, optionally weaker offbeats. */
function pulses(seconds: number, bpm: number, offbeat = 0): Float64Array {
	const values = new Float64Array(seconds * FRAME_RATE);
	const period = (60 * FRAME_RATE) / bpm;
	for (let t = 0; t < values.length; t += period) {
		values[Math.round(t)] = 1;
		const half = Math.round(t + period / 2);
		if (offbeat > 0 && half < values.length) values[half] = offbeat;
	}
	return values;
}

describe('tempo estimation', () => {
	it.each([60, 90, 120, 150])('finds %i BPM from a clean pulse', (bpm) => {
		const result = estimateTempo({ frameRate: FRAME_RATE, values: pulses(30, bpm) });
		expect(result?.bpm).toBeCloseTo(bpm, 0);
		expect(result?.confidence.level).toBe('high');
	});

	it('places beats on the pulses', () => {
		const values = pulses(20, 100);
		const envelope = normalizeOnsets({ frameRate: FRAME_RATE, values }) ?? new Float64Array();
		const beats = trackBeats(envelope, 60);
		for (const b of beats.slice(1, -1)) expect(b % 60).toBe(0);
	});

	it('doubles the tempo when offbeats are as strong as beats', () => {
		const result = estimateTempo({ frameRate: FRAME_RATE, values: pulses(30, 80, 1) });
		expect(result?.bpm).toBeCloseTo(160, 0);
	});

	it('keeps the tempo but mentions double time when offbeats are fairly strong', () => {
		const result = estimateTempo({ frameRate: FRAME_RATE, values: pulses(30, 100, 0.5) });
		expect(result?.bpm).toBeCloseTo(100, 0);
		expect(result?.doubleTimeBpm).toBeCloseTo(200, 0);
		expect(result?.confidence.level).not.toBe('high');
	});

	it('measures offbeat strength', () => {
		const envelope = pulses(10, 120, 0.5);
		const beats = Array.from({ length: 19 }, (_, i) => i * 50);
		expect(offbeatRatio(envelope, beats, 50)).toBeCloseTo(0.5, 2);
	});

	it('returns null for a flat envelope or one too short to measure', () => {
		expect(estimateTempo({ frameRate: FRAME_RATE, values: new Float64Array(3000) })).toBeNull();
		expect(estimatePeriod(new Float64Array(100).fill(1), FRAME_RATE)).toBeNull();
	});
});
