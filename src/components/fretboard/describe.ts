import type { MarkedPosition } from '../../services/fretboard';

/** Role words in a fixed order, e.g. ["root", "chord tone", "scale note"]. */
export function roleWords(position: MarkedPosition): string[] {
	const words: string[] = [];
	if (position.isRoot) words.push('root');
	if (position.isChordTone) words.push('chord tone');
	if (position.isScaleNote) words.push('scale note');
	return words;
}

/** Accessible name for a fretboard cell. */
export function describePosition(
	position: MarkedPosition,
	noteName: string,
	stringName: string,
	lowestPlayable: number,
): string {
	const fretText =
		position.fret === lowestPlayable ? (lowestPlayable === 0 ? 'open' : `fret ${position.fret}, capo`) : `fret ${position.fret}`;
	const roles = roleWords(position);
	return `String ${position.string} (${stringName}), ${fretText}: ${noteName}${roles.length ? `, ${roles.join(', ')}` : ''}`;
}
