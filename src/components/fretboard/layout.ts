import type { FretRange, Handedness } from '../../services/fretboard';

/** Visual geometry for the SVG fretboard. Pure; no theory. */
export interface FretboardLayout {
	width: number;
	height: number;
	/** Center x of the cell for a fret. */
	cellX(fret: number): number;
	/** x of the wire on the body side of a fret's cell; the nut/capo when fret is the open column. */
	wireX(fret: number): number;
	/** y of a string (1 = top). */
	stringY(string: number): number;
	cellWidth: number;
	stringGap: number;
	/** Left and right ends of the drawn neck. */
	startX: number;
	endX: number;
	/** Columns from left to right as drawn. */
	columns: number[];
	/** True when the first column is the open/capo column (nut drawn beside it). */
	hasOpenColumn: boolean;
}

export const CELL_WIDTH = 56;
export const STRING_GAP = 34;
export const PADDING_X = 28;
export const PADDING_TOP = 22;
export const PADDING_BOTTOM = 40;

/**
 * Columns go low fret → high fret for right-handed players and are mirrored
 * for left-handed players. `lowestPlayable` is the capo fret (or 0).
 */
export function computeLayout(
	range: FretRange,
	strings: number,
	lowestPlayable: number,
	handedness: Handedness,
): FretboardLayout {
	const frets: number[] = [];
	for (let fret = range.min; fret <= range.max; fret++) frets.push(fret);
	const columns = handedness === 'left' ? [...frets].reverse() : frets;
	const hasOpenColumn = range.min === lowestPlayable;
	const width = PADDING_X * 2 + frets.length * CELL_WIDTH;
	const height = PADDING_TOP + PADDING_BOTTOM + (strings - 1) * STRING_GAP;

	const indexOf = (fret: number) => {
		const index = columns.indexOf(fret);
		if (index === -1) throw new RangeError(`Fret ${fret} is outside the displayed range.`);
		return index;
	};
	const cellX = (fret: number) => PADDING_X + indexOf(fret) * CELL_WIDTH + CELL_WIDTH / 2;
	const wireX = (fret: number) =>
		cellX(fret) + (handedness === 'left' ? -1 : 1) * (CELL_WIDTH / 2);

	return {
		width,
		height,
		startX: PADDING_X,
		endX: width - PADDING_X,
		cellX,
		wireX,
		stringY: (string) => PADDING_TOP + (string - 1) * STRING_GAP,
		cellWidth: CELL_WIDTH,
		stringGap: STRING_GAP,
		columns,
		hasOpenColumn,
	};
}

/** Frets that carry inlay dots on a guitar; 12 and 24 are double. */
export function inlayDots(fret: number): 0 | 1 | 2 {
	const withinOctave = fret % 12;
	if (fret > 0 && withinOctave === 0) return 2;
	return [3, 5, 7, 9].includes(withinOctave) ? 1 : 0;
}
