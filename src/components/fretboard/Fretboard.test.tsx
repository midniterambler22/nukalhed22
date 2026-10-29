// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	createInstrumentOrThrow,
	filterShapes,
	getScalePositions,
	markPositions,
	type Instrument,
} from '../../services/fretboard';
import { shapeWords } from './describe';
import {
	chordPitchClasses,
	formatNote,
	getScale,
	parseChordSymbol,
	scalePitchClasses,
	spellPitchClass,
	type PitchClass,
} from '../../services/music-theory';
import { Fretboard } from './Fretboard';
import { FretboardLegend } from './FretboardLegend';

afterEach(cleanup);

const noteName = (pc: PitchClass) => formatNote(spellPitchClass(pc, 'sharp'), 'unicode');
const A_MINOR_PENTATONIC = scalePitchClasses(9, 'minor-pentatonic');
const A_MINOR_CHORD = chordPitchClasses(parseChordSymbol('Am'));

function renderBoard(
	instrument: Instrument,
	range = { min: 5, max: 8 },
	extra: Partial<Parameters<typeof Fretboard>[0]> = {},
) {
	const positions = markPositions(
		instrument,
		{ root: 9, scale: A_MINOR_PENTATONIC, chordTones: A_MINOR_CHORD },
		range,
	);
	return render(
		<Fretboard
			instrument={instrument}
			positions={positions}
			noteName={noteName}
			label="A minor pentatonic"
			{...extra}
		/>,
	);
}

describe('Fretboard', () => {
	const guitar = createInstrumentOrThrow();

	it('renders one gridcell per string × fret with descriptive names', () => {
		renderBoard(guitar);
		expect(screen.getByRole('grid', { name: 'A minor pentatonic' })).toBeTruthy();
		expect(screen.getAllByRole('row')).toHaveLength(6);
		expect(screen.getAllByRole('gridcell')).toHaveLength(6 * 4);
		expect(
			screen.getByRole('gridcell', {
				name: 'String 6 (E), fret 5: A, root, chord tone, scale note',
			}),
		).toBeTruthy();
		expect(
			screen.getByRole('gridcell', { name: 'String 5 (A), fret 5: D, scale note' }),
		).toBeTruthy();
		expect(screen.getByRole('gridcell', { name: 'String 6 (E), fret 6: A♯' })).toBeTruthy();
	});

	it('distinguishes roles by shape, not only color', () => {
		const { container } = renderBoard(guitar);
		const root = container.querySelectorAll('.fretboard-marker--root');
		expect([...root].every((el) => el.tagName === 'rect')).toBe(true);
		expect(root).toHaveLength(3);
		const scale = container.querySelectorAll('.fretboard-marker--scale');
		expect([...scale].every((el) => el.tagName === 'circle')).toBe(true);
		// Every chord tone (A, C, E) in frets 5–8 gets a ring: 3 roots + 3 C + 3 E... count from the engine.
		const chordCount = markPositions(
			guitar,
			{ chordTones: A_MINOR_CHORD },
			{ min: 5, max: 8 },
		).filter((p) => p.isChordTone).length;
		expect(container.querySelectorAll('.fretboard-ring')).toHaveLength(chordCount);
	});

	it('draws chord tones outside the scale hollow', () => {
		const positions = markPositions(
			guitar,
			{ root: 9, scale: A_MINOR_PENTATONIC, chordTones: chordPitchClasses('E7') },
			{ min: 3, max: 5 },
		);
		const { container } = render(
			<Fretboard instrument={guitar} positions={positions} noteName={noteName} label="E7" />,
		);
		// G♯ is in E7 but not in A minor pentatonic.
		const cell = screen.getByRole('gridcell', { name: 'String 6 (E), fret 4: G♯, chord tone' });
		expect(cell.querySelector('.fretboard-marker--outside')).toBeTruthy();
		expect(container.querySelectorAll('.fretboard-marker--outside').length).toBeGreaterThan(0);
	});

	it('hides labels for unmarked notes unless showAllNotes', () => {
		const { container, rerender } = renderBoard(guitar);
		expect(container.querySelectorAll('.fretboard-label--plain')).toHaveLength(0);
		const positions = markPositions(
			guitar,
			{ root: 9, scale: A_MINOR_PENTATONIC },
			{ min: 5, max: 8 },
		);
		rerender(
			<Fretboard
				instrument={guitar}
				positions={positions}
				noteName={noteName}
				label="x"
				showAllNotes
			/>,
		);
		expect(container.querySelectorAll('.fretboard-label--plain').length).toBeGreaterThan(0);
	});

	it('uses one tab stop, starting on the first root', () => {
		renderBoard(guitar);
		const tabbable = screen
			.getAllByRole('gridcell')
			.filter((el) => el.getAttribute('tabindex') === '0');
		expect(tabbable).toHaveLength(1);
		expect(tabbable[0]?.getAttribute('aria-label')).toMatch(/^String 1 \(E\), fret 5: A, root/);
	});

	it('moves focus with arrow keys, Home and End', () => {
		renderBoard(guitar);
		const start = screen.getByRole('gridcell', { name: /^String 1 \(E\), fret 5/ });
		start.focus();
		fireEvent.keyDown(start, { key: 'ArrowRight' });
		expect(document.activeElement?.getAttribute('aria-label')).toMatch(
			/^String 1 \(E\), fret 6/,
		);
		fireEvent.keyDown(document.activeElement ?? document.body, { key: 'ArrowDown' });
		expect(document.activeElement?.getAttribute('aria-label')).toMatch(
			/^String 2 \(B\), fret 6/,
		);
		fireEvent.keyDown(document.activeElement ?? document.body, { key: 'End' });
		expect(document.activeElement?.getAttribute('aria-label')).toMatch(
			/^String 2 \(B\), fret 8/,
		);
		fireEvent.keyDown(document.activeElement ?? document.body, { key: 'ArrowRight' }); // edge: stays put
		expect(document.activeElement?.getAttribute('aria-label')).toMatch(
			/^String 2 \(B\), fret 8/,
		);
		fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Home' });
		expect(document.activeElement?.getAttribute('aria-label')).toMatch(
			/^String 2 \(B\), fret 5/,
		);
		fireEvent.keyDown(document.activeElement ?? document.body, { key: 'ArrowUp' });
		fireEvent.keyDown(document.activeElement ?? document.body, { key: 'ArrowUp' }); // edge: stays on string 1
		expect(document.activeElement?.getAttribute('aria-label')).toMatch(
			/^String 1 \(E\), fret 5/,
		);
		const tabbable = screen
			.getAllByRole('gridcell')
			.filter((el) => el.getAttribute('tabindex') === '0');
		expect(tabbable).toHaveLength(1);
	});

	it('mirrors arrow direction for left-handed players', () => {
		const lefty = createInstrumentOrThrow({ handedness: 'left' });
		renderBoard(lefty);
		const start = screen.getByRole('gridcell', { name: /^String 1 \(E\), fret 6/ });
		start.focus();
		fireEvent.keyDown(start, { key: 'ArrowRight' });
		expect(document.activeElement?.getAttribute('aria-label')).toMatch(/fret 5/);
	});

	it('selects with Enter, Space and click', () => {
		const onSelect = vi.fn();
		renderBoard(guitar, undefined, { onSelect });
		const cell = screen.getByRole('gridcell', { name: /^String 4 \(D\), fret 7/ });
		fireEvent.keyDown(cell, { key: 'Enter' });
		fireEvent.keyDown(cell, { key: ' ' });
		fireEvent.click(cell);
		expect(onSelect).toHaveBeenCalledTimes(3);
		expect(onSelect.mock.calls[0]?.[0]).toMatchObject({
			string: 4,
			fret: 7,
			midi: 57,
			isRoot: true,
		});
	});

	it('marks the selected cell with aria-selected', () => {
		renderBoard(guitar, undefined, { onSelect: () => {}, selected: { string: 3, fret: 7 } });
		expect(
			screen
				.getByRole('gridcell', { name: /^String 3 \(G\), fret 7/ })
				.getAttribute('aria-selected'),
		).toBe('true');
		expect(
			screen
				.getByRole('gridcell', { name: /^String 3 \(G\), fret 5/ })
				.getAttribute('aria-selected'),
		).toBe('false');
	});

	it('with a capo, labels the capo column and omits frets behind it', () => {
		const capo2 = createInstrumentOrThrow({ capo: 2 });
		const { container } = renderBoard(capo2, { min: 0, max: 5 });
		expect(screen.queryByRole('gridcell', { name: /fret 1:/ })).toBeNull();
		expect(
			screen.getByRole('gridcell', { name: 'String 6 (E), fret 2, capo: F♯' }),
		).toBeTruthy();
		expect(container.querySelector('.fretboard-capo')).toBeTruthy();
		expect(container.querySelector('.fretboard-nut')).toBeNull();
	});

	it('calls the open column "open" with no capo and draws a nut', () => {
		const { container } = renderBoard(guitar, { min: 0, max: 3 });
		expect(
			screen.getByRole('gridcell', {
				name: 'String 5 (A), open: A, root, chord tone, scale note',
			}),
		).toBeTruthy();
		expect(container.querySelector('.fretboard-nut')).toBeTruthy();
	});

	it('shows a message when there is nothing to draw', () => {
		render(<Fretboard instrument={guitar} positions={[]} noteName={noteName} label="empty" />);
		expect(screen.getByText('No frets to show.')).toBeTruthy();
	});
});

describe('Fretboard shapes', () => {
	const guitar = createInstrumentOrThrow();
	const intervals = getScale('minor-pentatonic').intervals.map((i) => i.semitones);
	const shapes = filterShapes(getScalePositions(guitar, 9, intervals), [1, 2]);

	it('labels each shown shape above the neck and names shapes on each note', () => {
		const positions = markPositions(
			guitar,
			{ root: 9, scale: A_MINOR_PENTATONIC },
			undefined,
			shapes,
		);
		const { container } = render(
			<Fretboard
				instrument={guitar}
				positions={positions}
				noteName={noteName}
				label="x"
				shapes={shapes}
			/>,
		);
		const labels = [...container.querySelectorAll('.fretboard-shape-label')].map(
			(el) => el.textContent,
		);
		expect(labels).toEqual(['Box 1', 'Box 2', 'Box 1', 'Box 2']);
		expect(
			screen.getByRole('gridcell', {
				name: 'String 6 (E), fret 8: C, scale note, boxes 1 and 2',
			}),
		).toBeTruthy();
		expect(
			screen.getByRole('gridcell', {
				name: 'String 6 (E), fret 5: A, root, scale note, box 1',
			}),
		).toBeTruthy();
	});
});

describe('shapeWords', () => {
	it.each([
		[[], ''],
		[[3], 'box 3'],
		[[1, 2], 'boxes 1 and 2'],
		[[1, 2, 3], 'boxes 1, 2 and 3'],
	])('%j → %s', (numbers, words) => {
		expect(shapeWords(numbers)).toBe(words);
	});
});

describe('FretboardLegend', () => {
	it('names each role in words', () => {
		render(<FretboardLegend showOutsideChordTones />);
		expect(screen.getByText('Red square: root')).toBeTruthy();
		expect(screen.getByText('Orange circle: scale note')).toBeTruthy();
		expect(screen.getByText('Blue ring: chord tone')).toBeTruthy();
		expect(screen.getByText('Hollow blue ring: chord tone outside the scale')).toBeTruthy();
	});
});
