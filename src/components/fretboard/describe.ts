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
		position.fret === lowestPlayable
			? lowestPlayable === 0
				? 'open'
				: `fret ${position.fret}, capo`
			: `fret ${position.fret}`;
	const roles = roleWords(position);
	const shapes = shapeWords(position.shapeNumbers);
	return `String ${position.string} (${stringName}), ${fretText}: ${noteName}${roles.length ? `, ${roles.join(', ')}` : ''}${shapes ? `, ${shapes}` : ''}`;
}

/** "box 1", "boxes 1 and 2", "boxes 1, 2 and 3"; empty for none. */
export function shapeWords(numbers: readonly number[]): string {
	if (numbers.length === 0) return '';
	if (numbers.length === 1) return `box ${numbers[0]}`;
	return `boxes ${numbers.slice(0, -1).join(', ')} and ${numbers[numbers.length - 1]}`;
}
