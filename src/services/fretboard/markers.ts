import { allPositions } from './fretboard';
import { midiToPitchClass, type PitchClass } from './pitch';
import type { FretPosition, FretRange, Instrument } from './types';

/** What to highlight. Pitch-class sets come from the theory module. */
export interface Highlight {
	root?: PitchClass;
	scale?: readonly PitchClass[];
	chordTones?: readonly PitchClass[];
}

export interface MarkedPosition extends FretPosition {
	isRoot: boolean;
	isScaleNote: boolean;
	isChordTone: boolean;
}

/** True when the position has any highlight role. */
export function isMarked(position: MarkedPosition): boolean {
	return position.isRoot || position.isScaleNote || position.isChordTone;
}

/**
 * Tags every playable position in the range with its roles. A root is a
 * root whether or not it's also in `scale`; roles aren't exclusive.
 */
export function markPositions(instrument: Instrument, highlight: Highlight, range?: FretRange): MarkedPosition[] {
	const root = highlight.root === undefined ? undefined : midiToPitchClass(highlight.root);
	const scale = new Set((highlight.scale ?? []).map(midiToPitchClass));
	const chordTones = new Set((highlight.chordTones ?? []).map(midiToPitchClass));
	return allPositions(instrument, range).map((position) => ({
		...position,
		isRoot: position.pitchClass === root,
		isScaleNote: scale.has(position.pitchClass),
		isChordTone: chordTones.has(position.pitchClass),
	}));
}
