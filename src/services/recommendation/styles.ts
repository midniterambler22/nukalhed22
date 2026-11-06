import type { ScaleId } from '../music-theory';

/**
 * Blues style profiles. Each profile is a set of playing tendencies (which scale to reach
 * for, where on the neck, what to aim at), not a transcription of anyone's licks.
 * They are data: the recommendation code reads them and works out notes from the theory module.
 */

export type StyleId = 'bb-king' | 'clapton' | 'srv' | 'allman' | 'muddy-waters' | 'bonamassa';

/** Where a chord sits in the key. Anything but the I, IV and V is "other". */
export type ChordFunction = 'I' | 'IV' | 'V' | 'other';

/** The register a style tends to live in. Matches the Scale Viewer's Low / Middle / High. */
export type RegisterHint = 'low' | 'middle' | 'high';

export interface StyleOption {
	readonly scale: ScaleId;
	/** Build the scale on the song's key (the classic blues move) or on the chord's own root. */
	readonly over: 'key' | 'chord';
	/** Chord functions this option applies to; omitted means any. */
	readonly when?: readonly ChordFunction[];
	/** Which kind of chord this option suits: with a major (or no) third, or a minor third. */
	readonly chordType: 'major' | 'minor';
	readonly register: RegisterHint;
	/** One short sentence on what this choice sounds like. */
	readonly sound: string;
	/** Why a player in this style reaches for it over this chord. */
	readonly why: string;
}

export interface StyleProfile {
	readonly id: StyleId;
	readonly name: string;
	/** What the style tends to do, in plain words. */
	readonly summary: string;
	readonly options: readonly StyleOption[];
}

const ANY_MAJOR_THIRD = 'major' as const;

export const STYLE_PROFILES: Readonly<Record<StyleId, StyleProfile>> = {
	'bb-king': {
		id: 'bb-king',
		name: 'B.B. King',
		summary:
			'Few notes, lots of space, played high on the neck. Mostly the minor pentatonic from the key, brightened with the major pentatonic of the chord.',
		options: [
			{
				scale: 'minor-pentatonic',
				over: 'key',
				chordType: ANY_MAJOR_THIRD,
				register: 'high',
				sound: 'Singing single notes with room to breathe.',
				why: 'The key’s minor pentatonic works over every chord in the blues, so you can leave space and let each note ring instead of changing shape.',
			},
			{
				scale: 'major-pentatonic',
				over: 'chord',
				when: ['I', 'IV'],
				chordType: ANY_MAJOR_THIRD,
				register: 'high',
				sound: 'Sweet and bright, with the major third and the sixth.',
				why: 'Moving to the major pentatonic of the chord brightens the sound on the I and IV chords and makes the change audible.',
			},
			{
				scale: 'minor-blues',
				over: 'key',
				chordType: ANY_MAJOR_THIRD,
				register: 'middle',
				sound: 'The same lines with the blue note as a passing tone.',
				why: 'Touch the blue note on the way past; don’t rest on it.',
			},
			{
				scale: 'dorian',
				over: 'chord',
				chordType: 'minor',
				register: 'high',
				sound: 'Smooth minor with a lifted sixth.',
				why: 'Over a minor chord, the Dorian keeps the singing, uncluttered feel while fitting the chord exactly.',
			},
			{
				scale: 'minor-pentatonic',
				over: 'chord',
				chordType: 'minor',
				register: 'high',
				sound: 'Plain minor, high and sparse.',
				why: 'On a minor chord, the minor pentatonic from the chord’s root is the safest shape.',
			},
		],
	},
	clapton: {
		id: 'clapton',
		name: 'Eric Clapton',
		summary:
			'Melodic and smooth, mostly in the first boxes. The minor blues scale from the key, with the major pentatonic when the chord changes to a bright sound.',
		options: [
			{
				scale: 'minor-blues',
				over: 'key',
				chordType: ANY_MAJOR_THIRD,
				register: 'middle',
				sound: 'Vocal, bending lines with the blue note.',
				why: 'The blues scale from the key gives the familiar sound, and the first boxes keep it easy to bend and sustain.',
			},
			{
				scale: 'major-pentatonic',
				over: 'chord',
				when: ['I', 'IV'],
				chordType: ANY_MAJOR_THIRD,
				register: 'middle',
				sound: 'Sweet and melodic, outlining the chord.',
				why: 'Following the chord with its major pentatonic makes the line sound like a melody written for each chord.',
			},
			{
				scale: 'mixolydian',
				over: 'chord',
				when: ['V'],
				chordType: ANY_MAJOR_THIRD,
				register: 'middle',
				sound: 'Dominant sound that leans toward home.',
				why: 'On the V chord, the Mixolydian has exactly the chord’s notes and pulls back to the I.',
			},
			{
				scale: 'dorian',
				over: 'chord',
				chordType: 'minor',
				register: 'middle',
				sound: 'Smooth minor with a lifted sixth.',
				why: 'The Dorian fits a minor chord and keeps a melodic, flowing line.',
			},
			{
				scale: 'minor-pentatonic',
				over: 'chord',
				chordType: 'minor',
				register: 'middle',
				sound: 'Plain minor.',
				why: 'The minor pentatonic from the chord’s root is the safe minor choice.',
			},
		],
	},
	srv: {
		id: 'srv',
		name: 'Stevie Ray Vaughan',
		summary:
			'Big, driving and low on the neck. The minor blues scale from the key, with heavy use of the major third against the minor shapes.',
		options: [
			{
				scale: 'minor-blues',
				over: 'key',
				chordType: ANY_MAJOR_THIRD,
				register: 'low',
				sound: 'Heavy, driving lines in the lowest boxes.',
				why: 'Low boxes on thick strings give weight, and the blue note adds grit between the fourth and the fifth.',
			},
			{
				scale: 'major-blues',
				over: 'key',
				chordType: ANY_MAJOR_THIRD,
				register: 'low',
				sound: 'Minor shapes with the major third mixed in.',
				why: 'Mixing the major third into the minor shape gives the sharp, bending clash typical of Texas blues.',
			},
			{
				scale: 'mixolydian',
				over: 'chord',
				when: ['IV', 'V'],
				chordType: ANY_MAJOR_THIRD,
				register: 'middle',
				sound: 'Dominant sound that follows the chord.',
				why: 'On the IV and V chords, the Mixolydian brings out the chord’s major third and flat seventh.',
			},
			{
				scale: 'dorian',
				over: 'chord',
				chordType: 'minor',
				register: 'low',
				sound: 'Minor with a lifted sixth, low and strong.',
				why: 'The Dorian fits a minor chord and keeps the low, driving feel.',
			},
			{
				scale: 'minor-pentatonic',
				over: 'chord',
				chordType: 'minor',
				register: 'low',
				sound: 'Plain minor, low and heavy.',
				why: 'The minor pentatonic from the chord’s root is the safe minor choice.',
			},
		],
	},
	allman: {
		id: 'allman',
		name: 'Duane Allman',
		summary:
			'Modal and Southern, following the chord: Mixolydian and the major pentatonic over the chords, with minor pentatonic in between.',
		options: [
			{
				scale: 'mixolydian',
				over: 'chord',
				chordType: ANY_MAJOR_THIRD,
				register: 'middle',
				sound: 'Open and singing, following each chord.',
				why: 'Building the Mixolydian on each chord’s root gives a line that always fits the chord, so the changes sound smooth.',
			},
			{
				scale: 'major-pentatonic',
				over: 'chord',
				when: ['I', 'IV'],
				chordType: ANY_MAJOR_THIRD,
				register: 'high',
				sound: 'Bright and sweet, higher on the neck.',
				why: 'The chord’s major pentatonic gives the sweet, major-sounding side that goes with the Southern sound.',
			},
			{
				scale: 'minor-pentatonic',
				over: 'key',
				chordType: ANY_MAJOR_THIRD,
				register: 'middle',
				sound: 'Gritty minor-pentatonic from the key.',
				why: 'Falling back to the key’s minor pentatonic gives the bluesy contrast to the brighter, chord-following lines.',
			},
			{
				scale: 'dorian',
				over: 'chord',
				chordType: 'minor',
				register: 'middle',
				sound: 'Modal minor with a lifted sixth.',
				why: 'The Dorian is the modal minor choice, and fits a minor chord exactly.',
			},
			{
				scale: 'minor-pentatonic',
				over: 'chord',
				chordType: 'minor',
				register: 'middle',
				sound: 'Plain minor.',
				why: 'The minor pentatonic from the chord’s root is the safe minor choice.',
			},
		],
	},
	'muddy-waters': {
		id: 'muddy-waters',
		name: 'Muddy Waters',
		summary:
			'Raw and rhythmic, close to the root, low on the neck. The key’s minor pentatonic and blues scale, bending between the minor and major third in a slide-guitar way.',
		options: [
			{
				scale: 'minor-pentatonic',
				over: 'key',
				chordType: ANY_MAJOR_THIRD,
				register: 'low',
				sound: 'Plain, heavy phrases that answer the vocal.',
				why: 'Staying close to the key’s minor pentatonic, low on the neck, keeps the phrases short and repeatable like a vocal answer.',
			},
			{
				scale: 'minor-blues',
				over: 'key',
				chordType: ANY_MAJOR_THIRD,
				register: 'low',
				sound: 'Slides and bends through the blue note.',
				why: 'Sliding or bending through the blue note and between the minor and major third gives the sound of a slide guitar.',
			},
			{
				scale: 'major-blues',
				over: 'key',
				when: ['I'],
				chordType: ANY_MAJOR_THIRD,
				register: 'middle',
				sound: 'Brighter, with the major third in play.',
				why: 'On the I chord the major third sits comfortably against the minor shapes, giving the in-between sound of the Delta.',
			},
			{
				scale: 'minor-pentatonic',
				over: 'chord',
				chordType: 'minor',
				register: 'low',
				sound: 'Plain minor, low and heavy.',
				why: 'On a minor chord, the minor pentatonic from the chord’s root is the safe shape.',
			},
			{
				scale: 'dorian',
				over: 'chord',
				chordType: 'minor',
				register: 'low',
				sound: 'Minor with a lifted sixth.',
				why: 'The Dorian fits a minor chord and keeps the sound open.',
			},
		],
	},
	bonamassa: {
		id: 'bonamassa',
		name: 'Joe Bonamassa',
		summary:
			'Blues-rock with long, connected runs across the neck. The minor blues scale from the key, Dorian and natural minor for a darker color, and big moves between boxes.',
		options: [
			{
				scale: 'minor-blues',
				over: 'key',
				chordType: ANY_MAJOR_THIRD,
				register: 'high',
				sound: 'Fast, connected runs with the blue note.',
				why: 'The blues scale from the key, travelling up through the boxes, gives long runs that don’t need to change when the chord does.',
			},
			{
				scale: 'dorian',
				over: 'key',
				chordType: ANY_MAJOR_THIRD,
				register: 'middle',
				sound: 'Darker, more modern minor color.',
				why: 'Using the key’s Dorian adds a lifted sixth to the minor sound for a more rock, less traditional feel.',
			},
			{
				scale: 'mixolydian',
				over: 'chord',
				when: ['IV', 'V'],
				chordType: ANY_MAJOR_THIRD,
				register: 'middle',
				sound: 'Follows the chord, dominant and strong.',
				why: 'On the IV and V chords the Mixolydian brings out the chord’s major third and flat seventh, so the changes stay clear inside a long run.',
			},
			{
				scale: 'natural-minor',
				over: 'chord',
				chordType: 'minor',
				register: 'high',
				sound: 'Full minor sound with a flat sixth.',
				why: 'Natural minor on a minor chord gives a bigger, darker sound than the pentatonic.',
			},
			{
				scale: 'minor-pentatonic',
				over: 'chord',
				chordType: 'minor',
				register: 'high',
				sound: 'Plain minor, high and fast.',
				why: 'The minor pentatonic from the chord’s root is the safe minor choice.',
			},
		],
	},
};

export const STYLE_IDS = Object.keys(STYLE_PROFILES) as readonly StyleId[];

export function isStyleId(value: string): value is StyleId {
	return Object.hasOwn(STYLE_PROFILES, value);
}
