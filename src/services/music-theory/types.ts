/** A pitch class: semitones above C, ignoring octave. C = 0, C♯/D♭ = 1, … B = 11. */
export type PitchClass = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

/** A MIDI note number. Middle C (C4) is 60; the low E string in standard tuning (E2) is 40. */
export type MidiNote = number;

export type Letter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

/**
 * A note name with its spelling, independent of octave.
 * `accidental` counts semitones from the natural letter: -2 = 𝄫, -1 = ♭, 0 = ♮, 1 = ♯, 2 = 𝄪.
 */
export interface SpelledNote {
	readonly letter: Letter;
	readonly accidental: number;
}

/** A spelled note at a specific octave (scientific pitch notation, e.g. E2, C♯4). */
export interface Pitch {
	readonly note: SpelledNote;
	readonly octave: number;
	readonly midi: MidiNote;
}

/**
 * An interval measured from a root.
 * `degree` is the scale-step number (1 = unison, 3 = third, 9 = ninth) and decides the letter;
 * `semitones` is the exact size and decides the accidental. b3 = { degree: 3, semitones: 3 }.
 */
export interface Interval {
	readonly degree: number;
	readonly semitones: number;
}

/** How to spell a pitch class that has no context, such as a key or scale. */
export type AccidentalPreference = 'sharp' | 'flat';

/** How accidentals are written: `ascii` uses # and b, `unicode` uses ♯ and ♭. */
export type AccidentalStyle = 'ascii' | 'unicode';
