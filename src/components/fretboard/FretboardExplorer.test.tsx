// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FretboardExplorer } from './FretboardExplorer';

afterEach(cleanup);

describe('FretboardExplorer', () => {
	it('starts on A minor pentatonic over Am', () => {
		render(<FretboardExplorer />);
		expect(
			screen.getByRole('grid', { name: 'A Minor pentatonic, Am chord tones' }),
		).toBeTruthy();
		expect(
			screen.getByRole('gridcell', {
				name: 'String 6 (E), fret 5: A, root, chord tone, scale note',
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
		expect(screen.getByText('String 2, fret 1: C4 (chord tone, scale note)')).toBeTruthy();
	});
});
