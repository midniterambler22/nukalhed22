// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';

afterEach(cleanup);

describe('App workspace', () => {
	it('shows the header, the empty song state and Scale Viewer by default', () => {
		render(<App />);
		expect(screen.getByRole('heading', { level: 1, name: 'Nukalhed22 Studios' })).toBeTruthy();
		const current = within(screen.getByRole('region', { name: 'Current song' }));
		expect(current.getByText('No song loaded')).toBeTruthy();
		expect(current.getByText('Time signature')).toBeTruthy();
		expect(
			screen.getByRole('tab', { name: 'Scale Viewer' }).getAttribute('aria-selected'),
		).toBe('true');
		expect(screen.getByRole('tabpanel', { name: 'Scale Viewer' })).toBeTruthy();
		expect(screen.getByRole('grid', { name: /A Minor pentatonic/ })).toBeTruthy();
		expect(screen.getByRole('region', { name: 'Chord & scale info' })).toBeTruthy();
		expect(screen.getByText(/Choose a song or try the demo to see its key/)).toBeTruthy();
		expect(screen.getByRole('group', { name: 'Playback' })).toBeTruthy();
	});

	it('moves between tabs with the arrow keys and keeps Scale Viewer settings', () => {
		render(<App />);
		fireEvent.click(screen.getByRole('button', { name: 'Box 2' }));
		const scaleTab = screen.getByRole('tab', { name: 'Scale Viewer' });
		fireEvent.keyDown(scaleTab, { key: 'ArrowRight' });
		expect(screen.getByRole('tab', { name: 'Song Info' }).getAttribute('aria-selected')).toBe(
			'true',
		);
		expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Song Info' }));
		expect(screen.getByText('No song loaded.')).toBeTruthy();
		expect(screen.queryByRole('region', { name: 'Chord & scale info' })).toBeNull();
		fireEvent.keyDown(screen.getByRole('tab', { name: 'Song Info' }), { key: 'ArrowRight' });
		expect(screen.getByRole('tab', { name: /^Jam Master/ }).getAttribute('aria-selected')).toBe(
			'true',
		);
		fireEvent.keyDown(screen.getByRole('tab', { name: /^Jam Master/ }), { key: 'End' });
		fireEvent.keyDown(screen.getByRole('tab', { name: 'Song Info' }), { key: 'ArrowLeft' });
		expect(screen.getByRole('button', { name: 'Box 2' }).getAttribute('aria-pressed')).toBe(
			'false',
		);
	});

	it('says plainly that planned workspaces are not built yet, with a way back', () => {
		render(<App />);
		fireEvent.click(screen.getByRole('tab', { name: /^Riff Builder/ }));
		expect(screen.getByRole('heading', { name: 'Riff Builder isn’t built yet' })).toBeTruthy();
		fireEvent.click(screen.getByRole('button', { name: 'Open Scale Viewer' }));
		expect(screen.getByRole('grid', { name: /A Minor pentatonic/ })).toBeTruthy();
	});

	it('changes the tuning from Settings, and Help explains the fretboard', () => {
		render(<App />);
		fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
		fireEvent.change(screen.getByLabelText('Tuning'), { target: { value: '2' } });
		expect(screen.getByRole('gridcell', { name: /^String 6 \(D\), open: D/ })).toBeTruthy();
		fireEvent.click(screen.getByRole('button', { name: 'Close' }));
		fireEvent.click(screen.getByRole('button', { name: 'Help' }));
		expect(screen.getByText('Red square: the root of the scale.')).toBeTruthy();
	});
});
