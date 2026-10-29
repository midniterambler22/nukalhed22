import { TheoryError } from './errors';
import { formulaPitchClasses, parseFormula, spellFormula, type FormulaNote } from './formula';
import { formatNote, noteToPitchClass, parseNoteName } from './notes';
import type { AccidentalStyle, Interval, PitchClass, SpelledNote } from './types';

export type ChordQualityId =
	| 'major'
	| 'minor'
	| 'diminished'
	| 'augmented'
	| 'sus2'
	| 'sus4'
	| 'power'
	| 'major6'
	| 'minor6'
	| 'dominant7'
	| 'major7'
	| 'minor7'
	| 'half-diminished7'
	| 'diminished7'
	| 'dominant7sus4'
	| 'add9'
	| 'dominant9';

export interface ChordQuality {
	readonly id: ChordQualityId;
	readonly name: string;
	/** The suffix used when writing the chord: "" for major, "m7" for minor seventh. */
	readonly symbol: string;
	/** Other suffixes accepted when reading a chord symbol. */
	readonly aliases: readonly string[];
	readonly formula: readonly string[];
	readonly intervals: readonly Interval[];
}

function defineQuality(
	id: ChordQualityId,
	name: string,
	symbol: string,
	aliases: readonly string[],
	formula: readonly string[],
): ChordQuality {
	return { id, name, symbol, aliases, formula, intervals: parseFormula(formula) };
}

/** Chord qualities as interval formulas. Add new qualities here. */
export const CHORD_QUALITIES: Readonly<Record<ChordQualityId, ChordQuality>> = {
	major: defineQuality('major', 'Major', '', ['maj', 'M'], ['1', '3', '5']),
	minor: defineQuality('minor', 'Minor', 'm', ['min', '-'], ['1', 'b3', '5']),
	diminished: defineQuality('diminished', 'Diminished', 'dim', ['°', 'o'], ['1', 'b3', 'b5']),
	augmented: defineQuality('augmented', 'Augmented', 'aug', ['+'], ['1', '3', '#5']),
	sus2: defineQuality('sus2', 'Suspended second', 'sus2', [], ['1', '2', '5']),
	sus4: defineQuality('sus4', 'Suspended fourth', 'sus4', ['sus'], ['1', '4', '5']),
	power: defineQuality('power', 'Power chord', '5', [], ['1', '5']),
	major6: defineQuality('major6', 'Major sixth', '6', [], ['1', '3', '5', '6']),
	minor6: defineQuality('minor6', 'Minor sixth', 'm6', ['min6'], ['1', 'b3', '5', '6']),
	dominant7: defineQuality('dominant7', 'Dominant seventh', '7', [], ['1', '3', '5', 'b7']),
	major7: defineQuality(
		'major7',
		'Major seventh',
		'maj7',
		['M7', 'Δ7', 'Δ'],
		['1', '3', '5', '7'],
	),
	minor7: defineQuality('minor7', 'Minor seventh', 'm7', ['min7', '-7'], ['1', 'b3', '5', 'b7']),
	'half-diminished7': defineQuality(
		'half-diminished7',
		'Half-diminished seventh',
		'm7b5',
		['ø', 'ø7', 'min7b5'],
		['1', 'b3', 'b5', 'b7'],
	),
	diminished7: defineQuality(
		'diminished7',
		'Diminished seventh',
		'dim7',
		['°7', 'o7'],
		['1', 'b3', 'b5', 'bb7'],
	),
	dominant7sus4: defineQuality(
		'dominant7sus4',
		'Dominant seventh, suspended fourth',
		'7sus4',
		['7sus'],
		['1', '4', '5', 'b7'],
	),
	add9: defineQuality('add9', 'Added ninth', 'add9', ['add2'], ['1', '3', '5', '9']),
	dominant9: defineQuality('dominant9', 'Dominant ninth', '9', [], ['1', '3', '5', 'b7', '9']),
};

export const CHORD_QUALITY_IDS = Object.keys(CHORD_QUALITIES) as readonly ChordQualityId[];

const QUALITY_BY_SUFFIX: ReadonlyMap<string, ChordQuality> = (() => {
	const map = new Map<string, ChordQuality>();
	for (const quality of Object.values(CHORD_QUALITIES)) {
		for (const suffix of [quality.symbol, ...quality.aliases]) {
			if (map.has(suffix)) throw new TheoryError(`Chord suffix "${suffix}" is defined twice`);
			map.set(suffix, quality);
		}
	}
	return map;
})();

export function getChordQuality(id: ChordQualityId): ChordQuality {
	const quality = CHORD_QUALITIES[id];
	if (!quality) throw new TheoryError(`Unknown chord quality "${String(id)}"`);
	return quality;
}

export interface Chord {
	readonly root: SpelledNote;
	readonly quality: ChordQualityId;
	/** Bass note of a slash chord (C/G). Absent when the root is in the bass. */
	readonly bass?: SpelledNote;
}

const CHORD_SYMBOL_PATTERN = /^([A-Ga-g](?:[#♯b♭])?)([^/]*)(?:\/([A-Ga-g](?:[#♯b♭])?))?$/u;

/**
 * Reads a chord symbol such as "A", "F#m", "Bb7", "Cmaj7", "Em7b5", "Dsus4" or "C/G".
 * Throws a TheoryError for symbols it doesn't recognize rather than guessing.
 */
export function parseChordSymbol(symbol: string): Chord {
	const text = symbol.trim();
	const match = CHORD_SYMBOL_PATTERN.exec(text);
	if (!match || match[1] === undefined) {
		throw new TheoryError(`"${symbol}" is not a chord symbol`);
	}
	const root = parseNoteName(match[1]);
	const suffix = match[2] ?? '';
	const quality = QUALITY_BY_SUFFIX.get(suffix);
	if (!quality) {
		throw new TheoryError(`"${symbol}" has an unknown chord type "${suffix}"`);
	}
	if (match[3] === undefined) return { root, quality: quality.id };
	return { root, quality: quality.id, bass: parseNoteName(match[3]) };
}

export function isChordSymbol(symbol: string): boolean {
	try {
		parseChordSymbol(symbol);
		return true;
	} catch {
		return false;
	}
}

/** Writes a chord back as a symbol in its canonical form: "F#m7", "C/G". */
export function formatChordSymbol(chord: Chord, style: AccidentalStyle = 'ascii'): string {
	const suffix = getChordQuality(chord.quality).symbol;
	const bass = chord.bass ? `/${formatNote(chord.bass, style)}` : '';
	return formatNote(chord.root, style) + suffix + bass;
}

/** Spelled chord tones from the root up, with their intervals. Am7 → A C E G. */
export function chordTones(chord: Chord | string): FormulaNote[] {
	const parsed = typeof chord === 'string' ? parseChordSymbol(chord) : chord;
	return spellFormula(parsed.root, getChordQuality(parsed.quality).intervals);
}

/** Chord-tone pitch classes from the root up (the bass of a slash chord is not added). */
export function chordPitchClasses(chord: Chord | string): PitchClass[] {
	const parsed = typeof chord === 'string' ? parseChordSymbol(chord) : chord;
	return formulaPitchClasses(
		noteToPitchClass(parsed.root),
		getChordQuality(parsed.quality).intervals,
	);
}
