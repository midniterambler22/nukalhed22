// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FretboardExplorer } from './FretboardExplorer';

afterEach(cleanup);

describe('FretboardExplorer', () => {
	it('starts on A minor pentatonic over Am', () => {
		render(<FretboardExplorer />);
		expect(
			screen.getByRole('grid', { name: 'A Minor pentatonic, all 5 shapes, Am chord tones' }),
		).toBeTruthy();
		expect(
			screen.getByRole('gridcell', {
				name: 'String 6 (E), fret 5: A, root, chord tone, scale note, shapes 1 and 5',
			}),
		).toBeTruthy();
	});

	it('spells notes from the chosen key (B♭ in F major, not A♯)', () => {
		render(<FretboardExplorer />);
		fireEvent.change(screen.getByLabelText('Key'), { target: { value: 'F' } });
		fireEvent.change(screen.getByLabelText('Scale'), { target: { value: 'major' } });
		expect(
			screen.getByRole('gridcell', { name: /^String 5 \(A\), fret 1: B♭, scale note/ }),
		).toBeTruthy();
	});

	it('explains an invalid chord and hides chord tones until fixed', () => {
		render(<FretboardExplorer />);
		const chord = screen.getByLabelText('Chord');
		fireEvent.change(chord, { target: { value: 'Hm7' } });
		expect(screen.getByRole('alert').textContent).toMatch(/isn’t a chord symbol/);
		expect(chord.getAttribute('aria-invalid')).toBe('true');
		expect(screen.queryAllByRole('gridcell', { name: /chord tone/ })).toHaveLength(0);
		fireEvent.change(chord, { target: { value: 'C' } });
		expect(screen.queryByRole('alert')).toBeNull();
	});

	it('moving the capo removes frets behind it', () => {
		render(<FretboardExplorer />);
		fireEvent.change(screen.getByLabelText('Capo'), { target: { value: '3' } });
		expect(screen.queryAllByRole('gridcell', { name: /fret [012]\b|open/ })).toHaveLength(0);
		expect(
			screen.getByRole('gridcell', { name: /^String 6 \(E\), fret 3, capo: G/ }),
		).toBeTruthy();
	});

	it('reports the exact pitch of a selected note', () => {
		render(<FretboardExplorer />);
		fireEvent.click(screen.getByRole('gridcell', { name: /^String 2 \(B\), fret 1:/ }));
		expect(
			screen.getByText('String 2, fret 1: C4 (chord tone, scale note, shape 4)'),
		).toBeTruthy();
	});

	it('shows just shape 1, then 1–2, then 1–2–3 with the preset buttons', () => {
		render(<FretboardExplorer />);
		const scaleNotes = () => screen.queryAllByRole('gridcell', { name: /scale note/ });
		fireEvent.click(screen.getByRole('button', { name: 'Just 1' }));
		expect(screen.getByRole('grid', { name: /, shape 1, Am chord tones$/ })).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Just 1' }).getAttribute('aria-pressed')).toBe(
			'true',
		);
		// Shape 1 of A minor pentatonic: 12 notes at frets 5–8, again at 17–20.
		expect(scaleNotes()).toHaveLength(24);
		expect(
			scaleNotes().every((cell) =>
				/shapes? [\d ,and]*\b1\b/.test(cell.getAttribute('aria-label') ?? ''),
			),
		).toBe(true);
		const justOne = scaleNotes().length;
		fireEvent.click(screen.getByRole('button', { name: '1–2' }));
		expect(screen.getByRole('grid', { name: /, shapes 1 and 2,/ })).toBeTruthy();
		const oneTwo = scaleNotes().length;
		expect(oneTwo).toBeGreaterThan(justOne);
		fireEvent.click(screen.getByRole('button', { name: '1–3' }));
		expect(scaleNotes().length).toBeGreaterThan(oneTwo);
		expect((screen.getByLabelText('Shape 4') as HTMLInputElement).checked).toBe(false);
	});

	it('toggles any mix of shapes with the checkboxes, including none', () => {
		render(<FretboardExplorer />);
		for (const n of [1, 2, 3, 4, 5]) fireEvent.click(screen.getByLabelText(`Shape ${n}`));
		expect(screen.getByRole('status').textContent).toMatch(/Pick at least one shape/);
		expect(screen.queryAllByRole('gridcell', { name: /scale note/ })).toHaveLength(0);
		fireEvent.click(screen.getByLabelText('Shape 2'));
		fireEvent.click(screen.getByLabelText('Shape 4'));
		expect(screen.getByRole('grid', { name: /, shapes 2 and 4,/ })).toBeTruthy();
		expect(screen.queryByRole('status')).toBeNull();
	});

	it('hides the shape picker for scales that are not pentatonic', () => {
		render(<FretboardExplorer />);
		fireEvent.change(screen.getByLabelText('Scale'), { target: { value: 'major' } });
		expect(screen.queryByRole('group', { name: 'Shapes' })).toBeNull();
		expect(screen.getByText(/five shapes are for pentatonic scales/)).toBeTruthy();
	});
});
