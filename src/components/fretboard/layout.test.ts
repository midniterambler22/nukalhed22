import { describe, expect, it } from 'vitest';
import { computeLayout, inlayDots } from './layout';

describe('computeLayout', () => {
	it('orders columns low → high for right-handed, mirrored for left-handed', () => {
		expect(computeLayout({ min: 0, max: 3 }, 6, 0, 'right').columns).toEqual([0, 1, 2, 3]);
		expect(computeLayout({ min: 0, max: 3 }, 6, 0, 'left').columns).toEqual([3, 2, 1, 0]);
	});

	it('puts a fret wire on the body side of each cell', () => {
		const right = computeLayout({ min: 0, max: 3 }, 6, 0, 'right');
		expect(right.wireX(0)).toBeLessThan(right.cellX(1));
		expect(right.wireX(0)).toBeGreaterThan(right.cellX(0));
		const left = computeLayout({ min: 0, max: 3 }, 6, 0, 'left');
		expect(left.wireX(0)).toBeLessThan(left.cellX(0));
		expect(left.wireX(0)).toBeGreaterThan(left.cellX(1));
	});

	it('has an open column only when the range starts at the lowest playable fret', () => {
		expect(computeLayout({ min: 2, max: 5 }, 6, 2, 'right').hasOpenColumn).toBe(true);
		expect(computeLayout({ min: 5, max: 8 }, 6, 0, 'right').hasOpenColumn).toBe(false);
	});

	it('rejects frets outside the range', () => {
		expect(() => computeLayout({ min: 5, max: 8 }, 6, 0, 'right').cellX(4)).toThrow(RangeError);
	});
});

describe('inlayDots', () => {
	it.each([
		[0, 0],
		[1, 0],
		[3, 1],
		[5, 1],
		[7, 1],
		[9, 1],
		[12, 2],
		[15, 1],
		[17, 1],
		[24, 2],
	])('fret %i has %i dot(s)', (fret, dots) => {
		expect(inlayDots(fret)).toBe(dots);
	});
});
