import type { PitchClass } from './types';

/** Wraps any integer into the 0–11 pitch-class range (handles negatives). */
export function toPitchClass(semitones: number): PitchClass {
	if (!Number.isInteger(semitones)) {
		throw new RangeError(`Pitch class must come from an integer, got ${semitones}`);
	}
	return (((semitones % 12) + 12) % 12) as PitchClass;
}

/** Semitones to move up from `from` to reach `to`, in 0–11. */
export function semitonesBetween(from: PitchClass, to: PitchClass): number {
	return toPitchClass(to - from);
}

/** Moves a pitch class by a number of semitones (positive or negative). */
export function transposePitchClass(pitchClass: PitchClass, semitones: number): PitchClass {
	return toPitchClass(pitchClass + semitones);
}
