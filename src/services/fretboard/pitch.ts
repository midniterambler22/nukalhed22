/**
 * Temporary pitch helpers.
 *
 * TODO: replace with imports from src/services/music-theory once the
 * scaffold + theory engine lands. Kept to the bare minimum so nothing here
 * duplicates theory logic beyond MIDI → pitch class.
 */

/** Pitch class 0–11, where 0 = C. */
export type PitchClass = number;

export function midiToPitchClass(midi: number): PitchClass {
	return ((midi % 12) + 12) % 12;
}
