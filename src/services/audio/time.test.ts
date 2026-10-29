import { describe, expect, it } from 'vitest';
import { clampTime, describeTime, formatTime } from './time';

describe('formatTime', () => {
	it.each([
		[0, '0:00'],
		[5.9, '0:05'],
		[65, '1:05'],
		[600, '10:00'],
		[3725, '1:02:05'],
		[-3, '0:00'],
		[Number.NaN, '0:00'],
		[Infinity, '0:00'],
	])('%s s → %s', (seconds, text) => {
		expect(formatTime(seconds)).toBe(text);
	});
});

describe('describeTime', () => {
	it.each([
		[0, '0 seconds'],
		[1, '1 second'],
		[65, '1 minute 5 seconds'],
		[120, '2 minutes'],
		[3661, '1 hour 1 minute 1 second'],
	])('%s s → %s', (seconds, text) => {
		expect(describeTime(seconds)).toBe(text);
	});
});

describe('clampTime', () => {
	it('keeps times inside 0…duration', () => {
		expect(clampTime(-1, 100)).toBe(0);
		expect(clampTime(50, 100)).toBe(50);
		expect(clampTime(150, 100)).toBe(100);
		expect(clampTime(Number.NaN, 100)).toBe(0);
	});

	it('only clamps at 0 when the duration is unknown', () => {
		expect(clampTime(150, Infinity)).toBe(150);
		expect(clampTime(150, Number.NaN)).toBe(150);
	});
});
