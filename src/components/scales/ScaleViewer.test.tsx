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

	it('shows the five boxes for the minor blues, with the blue note inside them', () => {
		render(<Harness />);
		fireEvent.change(screen.getByLabelText('Scale'), { target: { value: 'minor-blues' } });
		expect(screen.getByText(/^5 boxes, \d+ places on this neck$/)).toBeTruthy();
		expect(screen.getByRole('grid', { name: /A Minor blues, all 5 boxes/ })).toBeTruthy();
		// E♭ is the blue note: A string, fret 6, in box 1.
		expect(
			screen.getByRole('gridcell', {
				name: /^String 5 \(A\), fret 6: E♭, scale note, box(es)? 1/,
			}),
		).toBeTruthy();
	});

	it('offers six blues styles and shows what each tends to play over the chord', () => {
		render(<Harness />);
		const style = screen.getByLabelText('Style') as HTMLSelectElement;
		expect([...style.options].map((o) => o.text)).toEqual([
			'None',
			'B.B. King',
			'Eric Clapton',
			'Stevie Ray Vaughan',
			'Duane Allman',
			'Muddy Waters',
			'Joe Bonamassa',
		]);
		expect(screen.queryByText('Notes to land on:')).toBeNull();
		fireEvent.change(style, { target: { value: 'bb-king' } });
		fireEvent.change(screen.getByLabelText('Chord to play over'), { target: { value: 'D7' } });
		expect(screen.getByText(/the IV chord in A/)).toBeTruthy();
		expect(screen.getByText(/not copies of anyone’s licks/)).toBeTruthy();
		expect(screen.getByText('Notes to land on:')).toBeTruthy();
		fireEvent.click(screen.getByRole('button', { name: 'Show D major pentatonic' }));
		expect((screen.getByLabelText('Scale') as HTMLSelectElement).value).toBe(
			'major-pentatonic',
		);
		expect((screen.getByLabelText('Key') as HTMLSelectElement).value).toBe('D');
		expect(screen.getByRole('button', { name: 'High' }).getAttribute('aria-pressed')).toBe(
			'true',
		);
	});

	it('asks for a valid chord before recommending', () => {
		render(<Harness />);
		fireEvent.change(screen.getByLabelText('Style'), { target: { value: 'srv' } });
		fireEvent.change(screen.getByLabelText('Chord to play over'), { target: { value: 'Hm7' } });
		expect(screen.getByText('Enter a valid chord to play over to see choices.')).toBeTruthy();
	});

	it('spells notes from the chosen key (B♭ in F major, not A♯)', () => {
		render(<Harness />);
		fireEvent.change(screen.getByLabelText('Key'), { target: { value: 'F' } });
		fireEvent.change(screen.getByLabelText('Scale'), { target: { value: 'major' } });
		expect(
			screen.getByRole('gridcell', { name: /^String 5 \(A\), fret 1: B♭, scale note/ }),
		).toBeTruthy();
	});

	it('offers all 20 scales in four groups and shows the notes of an exotic one', () => {
		const { container } = render(<Harness />);
		const groups = [...container.querySelectorAll('optgroup')];
		expect(groups.map((g) => g.label)).toEqual([
			'Pentatonic and blues',
			'Major scale and modes',
			'Minor and harmonic variations',
			'Advanced and exotic',
		]);
		expect(container.querySelectorAll('optgroup option')).toHaveLength(20);
		fireEvent.change(screen.getByLabelText('Key'), { target: { value: 'C' } });
		fireEvent.change(screen.getByLabelText('Scale'), { target: { value: 'whole-tone' } });
		expect(container.querySelector('.scale-viewer-title')?.textContent).toBe('C Whole tone');
		expect(screen.getByText('C D E F♯ G♯ B♭')).toBeTruthy();
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
