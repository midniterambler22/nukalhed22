import {
	chordTones,
	formatInterval,
	formatNote,
	getScale,
	noteToPitchClass,
	parseChordSymbol,
	parseNoteName,
	semitonesBetween,
	spellScale,
	type ScaleId,
} from '../music-theory';
import {
	STYLE_PROFILES,
	type ChordFunction,
	type RegisterHint,
	type StyleId,
	type StyleOption,
} from './styles';

export interface TargetNote {
	/** Note name, spelled for the chord, e.g. "C♯". */
	readonly name: string;
	/** Interval from the chord's root, e.g. "3" or "♭7". */
	readonly interval: string;
	/** Why this note is worth landing on. */
	readonly reason: string;
}

export interface ScaleRecommendation {
	readonly scale: ScaleId;
	readonly scaleName: string;
	/** Root of the scale, spelled: the song's key or the chord's root. */
	readonly root: string;
	/** The same root as plain text a key picker takes, e.g. "Bb". */
	readonly rootKey: string;
	readonly over: 'key' | 'chord';
	readonly register: RegisterHint;
	/** Notes of the scale, spelled from its root. */
	readonly notes: readonly string[];
	readonly sound: string;
	readonly why: string;
}

export interface StyleRecommendation {
	readonly style: StyleId;
	readonly styleName: string;
	readonly summary: string;
	readonly chord: string;
	readonly chordFunction: ChordFunction;
	/** Roman numeral of the chord relative to the key, e.g. "IV". */
	readonly numeral: string;
	/** The choices, best first. Always at least one. */
	readonly options: readonly ScaleRecommendation[];
	/** Notes to land on when this chord arrives. */
	readonly targets: readonly TargetNote[];
}

const FUNCTIONS: Readonly<Record<number, ChordFunction>> = { 0: 'I', 5: 'IV', 7: 'V' };

/** The chord's place in the key: I, IV, V, or other. */
export function chordFunction(chord: string, key: string): ChordFunction {
	const distance = semitonesBetween(
		noteToPitchClass(parseNoteName(key)),
		noteToPitchClass(parseChordSymbol(chord).root),
	);
	return FUNCTIONS[distance] ?? 'other';
}

function hasMinorThird(chord: string): boolean {
	return chordTones(chord).some((tone) => formatInterval(tone.interval) === 'b3');
}

function pretty(text: string): string {
	return text.replace(/b/g, '♭').replace(/#/g, '♯');
}

function targetsFor(chord: string): TargetNote[] {
	const tones = chordTones(chord);
	const targets: TargetNote[] = [];
	for (const tone of tones) {
		const interval = formatInterval(tone.interval);
		const name = formatNote(tone.note, 'unicode');
		if (interval === '3' || interval === 'b3') {
			targets.push({
				name,
				interval: pretty(interval),
				reason: 'The third says whether the chord is major or minor. Land on it when the chord changes.',
			});
		} else if (interval === 'b7' || interval === '7') {
			targets.push({
				name,
				interval: pretty(interval),
				reason: 'The seventh gives the chord its blues flavour and pulls toward the next chord.',
			});
		}
	}
	if (targets.length === 0) {
		const root = tones[0];
		if (root) {
			targets.push({
				name: formatNote(root.note, 'unicode'),
				interval: '1',
				reason: 'The root is a safe place to rest.',
			});
		}
	}
	return targets;
}

function applies(option: StyleOption, fn: ChordFunction, minor: boolean): boolean {
	if ((option.chordType === 'minor') !== minor) return false;
	return option.when === undefined || option.when.includes(fn);
}

/**
 * What a blues player in a given style tends to reach for over a chord in a song key:
 * scales (built on the key or on the chord), the register, and notes to land on. These are
 * tendencies for practice, not transcriptions of anyone's playing.
 */
export function recommendForStyle(
	style: StyleId,
	songKey: string,
	chord: string,
): StyleRecommendation {
	const profile = STYLE_PROFILES[style];
	const parsed = parseChordSymbol(chord);
	const fn = chordFunction(chord, songKey);
	const minor = hasMinorThird(chord);
	const rootName = formatNote(parsed.root, 'unicode');
	const keyName = formatNote(parseNoteName(songKey), 'unicode');

	const options = profile.options
		.filter((option) => applies(option, fn, minor))
		.map((option): ScaleRecommendation => {
			const root = option.over === 'key' ? parseNoteName(songKey) : parsed.root;
			return {
				scale: option.scale,
				scaleName: getScale(option.scale).name,
				root: option.over === 'key' ? keyName : rootName,
				rootKey: formatNote(root),
				over: option.over,
				register: option.register,
				notes: spellScale(root, option.scale).map((n) => formatNote(n.note, 'unicode')),
				sound: option.sound,
				why: option.why,
			};
		});

	return {
		style,
		styleName: profile.name,
		summary: profile.summary,
		chord,
		chordFunction: fn,
		numeral: fn === 'other' ? 'other' : fn,
		options,
		targets: targetsFor(chord),
	};
}
