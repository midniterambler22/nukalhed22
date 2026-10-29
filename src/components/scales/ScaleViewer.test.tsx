// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import {
	DEFAULT_INSTRUMENT_SETTINGS,
	useScaleViewer,
	type InstrumentSettings,
} from '../../hooks/useScaleViewer';
import { ChordScaleInfo } from './ChordScaleInfo';
import { ScaleViewer } from './ScaleViewer';

afterEach(cleanup);

function Harness({ initial = DEFAULT_INSTRUMENT_SETTINGS }: { initial?: InstrumentSettings }) {
	const [settings] = useState(initial);
	const viewer = useScaleViewer(settings);
	return (
		<>
			<ScaleViewer viewer={viewer} />
			<ChordScaleInfo viewer={viewer} />
		</>
	);
}

const scaleNotes = () => screen.queryAllByRole('gridcell', { name: /scale note/ });
const press = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const pressed = (name: string) => screen.getByRole('button', { name }).getAttribute('aria-pressed');

describe('ScaleViewer', () => {
	it('starts on A minor pentatonic over A7, with its formula, notes and positions', () => {
		render(<Harness />);
		expect(screen.getByRole('heading', { name: 'A Minor pentatonic' })).toBeTruthy();
		expect(screen.getByText('1 ♭3 4 5 ♭7')).toBeTruthy();
		expect(screen.getByText('A C D E G')).toBeTruthy();
		expect(screen.getByText(/^5 boxes, \d+ places on this neck$/)).toBeTruthy();
		expect(
			screen.getByRole('grid', { name: 'A Minor pentatonic, all 5 boxes, A7 chord tones' }),
		).toBeTruthy();
		expect(
			screen.getByRole('gridcell', {
				name: 'String 6 (E), fret 5: A, root, chord tone, scale note, boxes 1 and 5',
			}),
		).toBeTruthy();
	});

	it('labels each box with its register above the neck', () => {
		const { container } = render(<Harness />);
		const labels = [...container.querySelectorAll('.fretboard-shape-label')].map(
			(el) => el.textContent,
		);
		expect(labels).toContain('Box 1 (Low)');
		expect(labels).toContain('Box 3 (Mid)');
		expect(labels).toContain('Box 1 (High)');
	});

	it('spells notes from the chosen key (B♭ in F major, not A♯)', () => {
		render(<Harness />);
		fireEvent.change(screen.getByLabelText('Key'), { target: { value: 'F' } });
		fireEvent.change(screen.getByLabelText('Scale'), { target: { value: 'major' } });
		expect(
			screen.getByRole('gridcell', { name: /^String 5 \(A\), fret 1: B♭, scale note/ }),
		).toBeTruthy();
	});

	it('explains an invalid chord and hides chord tones until fixed', () => {
		render(<Harness />);
		const chord = screen.getByLabelText('Chord to play over');
		fireEvent.change(chord, { target: { value: 'Hm7' } });
		expect(screen.getByRole('alert').textContent).toMatch(/isn’t a chord symbol/);
		expect(chord.getAttribute('aria-invalid')).toBe('true');
		expect(screen.queryAllByRole('gridcell', { name: /chord tone/ })).toHaveLength(0);
		fireEvent.change(chord, { target: { value: 'C' } });
		expect(screen.queryByRole('alert')).toBeNull();
	});

	it('removes frets behind a capo', () => {
		render(<Harness initial={{ ...DEFAULT_INSTRUMENT_SETTINGS, capo: 3 }} />);
		expect(screen.queryAllByRole('gridcell', { name: /fret [012]\b|open/ })).toHaveLength(0);
		expect(
			screen.getByRole('gridcell', { name: /^String 6 \(E\), fret 3, capo: G/ }),
		).toBeTruthy();
	});

	it('shows a 12-fret neck when chosen', () => {
		render(<Harness initial={{ ...DEFAULT_INSTRUMENT_SETTINGS, fretCount: 12 }} />);
		expect(screen.queryAllByRole('gridcell', { name: /fret 13\b/ })).toHaveLength(0);
		expect(screen.getAllByRole('gridcell', { name: /fret 12\b/ }).length).toBeGreaterThan(0);
	});

	it('reports the exact pitch of a selected note', () => {
		render(<Harness />);
		fireEvent.click(screen.getByRole('gridcell', { name: /^String 2 \(B\), fret 1:/ }));
		expect(screen.getByText('String 2, fret 1: C4 (scale note, box 4)')).toBeTruthy();
	});

	it('toggles boxes one at a time, including none, and restores all', () => {
		render(<Harness />);
		for (const n of [2, 3, 4, 5]) press(`Box ${n}`);
		expect(screen.getByRole('grid', { name: /, box 1, A7 chord tones$/ })).toBeTruthy();
		expect(pressed('Box 1')).toBe('true');
		expect(pressed('Box 2')).toBe('false');
		// Box 1 of A minor pentatonic: 12 notes at frets 5–8, again at 17–20.
		expect(scaleNotes()).toHaveLength(24);
		press('Box 1');
		expect(screen.getByRole('status').textContent).toMatch(/Pick at least one box/);
		expect(scaleNotes()).toHaveLength(0);
		press('All boxes');
		expect(screen.getByRole('grid', { name: /, all 5 boxes,/ })).toBeTruthy();
	});

	it('steps a single box forward and back around the five-box cycle', () => {
		render(<Harness />);
		for (const n of [2, 3, 4, 5]) press(`Box ${n}`);
		fireEvent.click(screen.getByRole('button', { name: 'Next box (box 2)' }));
		expect(pressed('Box 2')).toBe('true');
		expect(pressed('Box 1')).toBe('false');
		fireEvent.click(screen.getByRole('button', { name: 'Previous box (box 1)' }));
		fireEvent.click(screen.getByRole('button', { name: 'Previous box (box 5)' }));
		expect(pressed('Box 5')).toBe('true');
	});

	it('Low, Middle and High show only the boxes in that third of the neck', () => {
		const { container } = render(<Harness />);
		const labels = () =>
			[...container.querySelectorAll('.fretboard-shape-label')].map((el) => el.textContent);
		press('Low');
		expect(pressed('Low')).toBe('true');
		expect(labels()).toEqual(['Box 4 (Low)', 'Box 5 (Low)', 'Box 1 (Low)']);
		expect(screen.getByRole('grid', { name: /low register/ })).toBeTruthy();
		press('Middle');
		expect(labels()).toEqual(['Box 2 (Mid)', 'Box 3 (Mid)', 'Box 4 (Mid)']);
		press('High');
		expect(labels()).toEqual(['Box 5 (High)', 'Box 1 (High)', 'Box 2 (High)']);
		// Scale notes stay in the same key: every marked note is still A minor pentatonic.
		expect(
			scaleNotes().every((cell) =>
				/: (A|C|D|E|G),/.test(cell.getAttribute('aria-label') ?? ''),
			),
		).toBe(true);
		press('All');
		expect(labels()).toHaveLength(9);
	});

	it('says when the chosen box is not in the register', () => {
		render(<Harness />);
		press('Low');
		for (const n of [1, 4, 5]) press(`Box ${n}`); // leaves boxes 2 and 3, both higher up
		expect(screen.getByRole('status').textContent).toMatch(/None of the chosen boxes/);
	});

	it('turns roots and chord tones off independently', () => {
		render(<Harness />);
		fireEvent.click(screen.getByLabelText('Roots'));
		expect(screen.queryAllByRole('gridcell', { name: /, root/ })).toHaveLength(0);
		expect(screen.getAllByRole('gridcell', { name: /chord tone/ }).length).toBeGreaterThan(0);
		fireEvent.click(screen.getByLabelText('Chord tones'));
		expect(screen.queryAllByRole('gridcell', { name: /chord tone/ })).toHaveLength(0);
		expect(scaleNotes().length).toBeGreaterThan(0);
	});

	it('limits a seven-note scale to the register’s part of the neck', () => {
		render(<Harness />);
		fireEvent.change(screen.getByLabelText('Scale'), { target: { value: 'major' } });
		expect(screen.queryByRole('group', { name: 'Boxes' })).toBeNull();
		expect(screen.getByText(/boxes for this scale come later/)).toBeTruthy();
		press('High');
		expect(screen.queryAllByRole('gridcell', { name: /fret [0-9]\b|open/ })).toHaveLength(0);
	});
});

describe('ChordScaleInfo', () => {
	it('shows A7 over A minor pentatonic: C♯ is outside the scale, and that is not wrong', () => {
		render(<Harness />);
		const tones = within(screen.getByRole('list', { name: 'A7 chord tones' }));
		expect(tones.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
			'A1',
			'C♯3not in scale',
			'E5',
			'G♭7',
		]);
		const scale = within(screen.getByRole('list', { name: 'A minor pentatonic notes' }));
		expect(scale.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
			'A1',
			'C♭3',
			'D4',
			'E5',
			'G♭7',
		]);
		const focus = screen.getByRole('heading', { name: 'Chord tone focus' }).parentElement;
		expect(focus?.textContent).toMatch(/A7 is A, C♯, E, G\./);
		expect(focus?.textContent).toMatch(/A, E, G are in A minor pentatonic/);
		expect(focus?.textContent).toMatch(/C♯ isn’t in the scale\. That isn’t wrong/);
	});
});
