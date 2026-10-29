import { allPositions } from './fretboard';
import type { PitchClass } from '../music-theory';
import type { ScalePosition } from './positions';
import type { FretPosition, FretRange, Instrument } from './types';

/** What to highlight, e.g. from scalePitchClasses / chordPitchClasses in music-theory. */
export interface Highlight {
	root?: PitchClass;
	scale?: readonly PitchClass[];
	chordTones?: readonly PitchClass[];
}

export interface MarkedPosition extends FretPosition {
	isRoot: boolean;
	isScaleNote: boolean;
	isChordTone: boolean;
	/** Numbers (1–5) of the shown scale shapes this note belongs to, ascending. Empty without shapes. */
	shapeNumbers: readonly number[];
}

/** True when the position has any highlight role. */
export function isMarked(position: MarkedPosition): boolean {
	return position.isRoot || position.isScaleNote || position.isChordTone;
}

/**
 * Tags every playable position in the range with its roles. A root is a
 * root whether or not it's also in `scale`; roles aren't exclusive.
 *
 * With `shapes` (from `getScalePositions`, filtered to the ones to show),
 * only notes inside those shapes keep their roles, and each records which
 * shapes it belongs to. A chord tone outside the scale stays marked when it
 * falls within a shown shape's fret span, since that's where you'd reach it.
 */
export function markPositions(
	instrument: Instrument,
	highlight: Highlight,
	range?: FretRange,
	shapes?: readonly ScalePosition[],
): MarkedPosition[] {
	const { root } = highlight;
	const scale = new Set(highlight.scale);
	const chordTones = new Set(highlight.chordTones);
	return allPositions(instrument, range).map((position) => {
		const isRoot = position.pitchClass === root;
		const isScaleNote = scale.has(position.pitchClass);
		const isChordTone = chordTones.has(position.pitchClass);
		if (!shapes) {
			return { ...position, isRoot, isScaleNote, isChordTone, shapeNumbers: [] };
		}
		const shapeNumbers = shapeNumbersAt(shapes, position);
		const inShape = shapeNumbers.length > 0;
		const nearShape = shapes.some(
			(shape) => position.fret >= shape.fretRange.min && position.fret <= shape.fretRange.max,
		);
		return {
			...position,
			isRoot: isRoot && inShape,
			isScaleNote: isScaleNote && inShape,
			isChordTone: isChordTone && (inShape || (!isScaleNote && nearShape)),
			shapeNumbers,
		};
	});
}

function shapeNumbersAt(shapes: readonly ScalePosition[], position: FretPosition): number[] {
	const numbers = new Set<number>();
	for (const shape of shapes) {
		if (shape.notes.some((n) => n.string === position.string && n.fret === position.fret)) {
			numbers.add(shape.number);
		}
	}
	return [...numbers].sort((a, b) => a - b);
}
