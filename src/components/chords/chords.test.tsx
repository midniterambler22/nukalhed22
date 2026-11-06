// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import type { SongFile } from '../../hooks/useLocalSong';
import type { SongAnalysis, SongAnalysisState } from '../../hooks/useSongAnalysis';
import { useSongCorrections } from '../../hooks/useSongCorrections';
import { toConfidence, type AnalysisResult, type ChordEvent } from '../../services/analysis';
import type { PlaybackController, PlaybackState } from '../../services/audio';
import type { KeyValueStore } from '../../services/corrections';
import type { LoopRange } from '../../services/progression';
import { AnalysisSummary, ChordList } from '../analysis';
import { ChordEditor, type ChordEditorTarget } from './ChordEditor';
import { KeyTempoEditor } from './KeyTempoEditor';
import { LoopControl } from './LoopControl';

afterEach(cleanup);

const SONG: SongFile = {
	name: 'blues.wav',
	size: 1000,
	format: { label: 'WAV' } as SongFile['format'],
};

function chord(start: number, end: number, name: string | null, confidence: number): ChordEvent {
	return {
		start,
		end,
		chord: name,
		confidence: toConfidence(confidence),
		alternatives: name ? ['E9', 'Em7'] : [],
		source: 'auto',
	};
}

function result(): AnalysisResult {
	return {
		engine: 'test',
		duration: 16,
		key: {
			tonic: 7,
			mode: 'major',
			name: 'G major',
			score: 0.4,
			confidence: toConfidence(0.2),
			alternatives: [{ tonic: 9, mode: 'major', name: 'A major', score: 0.3 }],
		},
		tonalSections: [],
		tempo: { bpm: 150, confidence: toConfidence(0.9), beats: [] },
		chords: [
			chord(0, 4, 'A7', 0.9),
			chord(4, 8, 'D7', 0.9),
			chord(8, 12, 'A7', 0.9),
			chord(12, 16, 'E7', 0.2),
		],
		notes: [],
	};
}

/** A controller over a pretend clock: enough for seeking and reading the time. */
function fakeController(): PlaybackController & { time: number } {
	const listeners = new Set<() => void>();
	const state: PlaybackState = {
		status: 'ready',
		playing: false,
		currentTime: 0,
		duration: 16,
		volume: 1,
		muted: false,
		error: null,
	};
	const c = {
		time: 0,
		getState: () => state,
		getCurrentTime: () => c.time,
		subscribe(l: () => void) {
			listeners.add(l);
			return () => listeners.delete(l);
		},
		seek(t: number) {
			c.time = t;
			listeners.forEach((l) => l());
		},
		load() {},
		unload() {},
		play: () => Promise.resolve(),
		pause() {},
		togglePlay: () => Promise.resolve(),
		skip() {},
		setVolume() {},
		setMuted() {},
		destroy() {},
	};
	return c as PlaybackController & { time: number };
}

function memoryStore(): KeyValueStore {
	const data = new Map<string, string>();
	return {
		getItem: (k) => data.get(k) ?? null,
		setItem: (k, v) => void data.set(k, v),
		removeItem: (k) => void data.delete(k),
	};
}

function Workspace({
	state,
	store,
	controller,
}: {
	state: SongAnalysisState;
	store: KeyValueStore;
	controller: PlaybackController;
}) {
	const analysis: SongAnalysis = { state, retry: () => {} };
	const timeline = useSongCorrections(SONG, analysis, store);
	const [target, setTarget] = useState<ChordEditorTarget | null>(null);
	const [keyOpen, setKeyOpen] = useState(false);
	const [loop, setLoop] = useState<LoopRange | null>(null);
	return (
		<>
			<AnalysisSummary
				analysis={analysis}
				hasSong
				timeline={timeline}
				onCorrect={() => setKeyOpen(true)}
			/>
			<ChordList
				analysis={analysis}
				timeline={timeline}
				onSeek={(t) => controller.seek(t)}
				onEdit={(i) => {
					const e = timeline.chords[i];
					if (e) setTarget({ kind: 'edit', anchor: (e.start + e.end) / 2 });
				}}
				onAdd={() => setTarget({ kind: 'add', time: controller.getCurrentTime() })}
			/>
			<LoopControl
				controller={controller}
				timeline={timeline}
				duration={16}
				loop={loop}
				onLoopChange={setLoop}
			/>
			<ChordEditor
				target={target}
				onTargetChange={setTarget}
				timeline={timeline}
				controller={controller}
				duration={16}
				onLoop={setLoop}
			/>
			<KeyTempoEditor open={keyOpen} onClose={() => setKeyOpen(false)} timeline={timeline} />
		</>
	);
}

function chordLabels() {
	return within(screen.getByRole('list', { name: 'Chord changes' }))
		.getAllByRole('button')
		.filter((b) => !b.textContent?.startsWith('Edit'))
		.map((b) => b.getAttribute('aria-label'));
}

const done = (): SongAnalysisState => ({ status: 'done', result: result() });

describe('correcting the chord timeline', () => {
	it('marks uncertain chords as needing review and corrects one by name', () => {
		const store = memoryStore();
		render(<Workspace state={done()} store={store} controller={fakeController()} />);
		expect(screen.getByText('1 chord needs review')).toBeTruthy();
		fireEvent.click(screen.getByRole('button', { name: 'Edit E7 at 12 seconds' }));
		const dialog = within(screen.getByRole('dialog', { name: 'Edit chord' }));
		expect(dialog.getByText(/Needs review/)).toBeTruthy();
		fireEvent.change(dialog.getByLabelText('Chord'), { target: { value: 'H7' } });
		fireEvent.click(dialog.getByRole('button', { name: 'Save chord' }));
		expect(dialog.getByRole('alert').textContent).toMatch(/isn’t a chord name/);
		fireEvent.change(dialog.getByLabelText('Chord'), { target: { value: 'e9' } });
		fireEvent.click(dialog.getByRole('button', { name: 'Save chord' }));
		expect(screen.getByText('Chord saved.')).toBeTruthy();
		expect(chordLabels()[3]).toBe('12 seconds: E9, set by you, edited');
		expect(screen.getByText('Every chord is likely or checked by you.')).toBeTruthy();
	});

	it('keeps corrections when the analysis runs again and when the song is opened again', () => {
		const store = memoryStore();
		const controller = fakeController();
		const { rerender, unmount } = render(
			<Workspace state={done()} store={store} controller={controller} />,
		);
		fireEvent.click(screen.getByRole('button', { name: 'Review next' }));
		fireEvent.click(screen.getByRole('button', { name: 'E7 is right' }));
		expect(screen.getByText('Marked as checked.')).toBeTruthy();
		// A fresh result object, as "Try again" produces.
		rerender(<Workspace state={done()} store={store} controller={controller} />);
		expect(chordLabels()[3]).toBe('12 seconds: E7, set by you, edited');
		unmount();
		render(<Workspace state={done()} store={store} controller={controller} />);
		expect(chordLabels()[3]).toBe('12 seconds: E7, set by you, edited');
	});

	it('moves a chord change and explains a timing it can’t use', () => {
		render(<Workspace state={done()} store={memoryStore()} controller={fakeController()} />);
		fireEvent.click(screen.getByRole('button', { name: 'Edit D7 at 4 seconds' }));
		const dialog = within(screen.getByRole('dialog', { name: 'Edit chord' }));
		fireEvent.change(dialog.getByLabelText('Starts at'), { target: { value: 'soon' } });
		fireEvent.click(dialog.getByRole('button', { name: 'Save timing' }));
		expect(dialog.getByRole('alert').textContent).toMatch(/minutes:seconds/);
		fireEvent.change(dialog.getByLabelText('Starts at'), { target: { value: '0:04.5' } });
		fireEvent.change(dialog.getByLabelText('Ends at'), { target: { value: '0:09' } });
		fireEvent.click(dialog.getByRole('button', { name: 'Save timing' }));
		expect(chordLabels().slice(0, 3)).toEqual([
			'0 seconds: A7, likely, edited',
			'4 seconds: D7, set by you, edited',
			'9 seconds: A7, likely',
		]);
	});

	it('loops a chord and grows the loop a chord at a time', () => {
		const controller = fakeController();
		render(<Workspace state={done()} store={memoryStore()} controller={controller} />);
		fireEvent.click(screen.getByRole('button', { name: 'Edit D7 at 4 seconds' }));
		fireEvent.click(screen.getByRole('button', { name: 'Loop this chord' }));
		expect(controller.time).toBe(4);
		const loop = within(screen.getByRole('group', { name: 'Loop' }));
		expect(loop.getByText(/Looping D7/)).toBeTruthy();
		fireEvent.click(loop.getByRole('button', { name: 'Loop one more chord' }));
		expect(loop.getByText(/Looping D7 to A7, 2 chords/)).toBeTruthy();
		fireEvent.click(loop.getByRole('button', { name: 'Stop loop' }));
		expect(loop.getByRole('button', { name: 'Loop chord' })).toBeTruthy();
	});

	it('corrects the key and tempo, keeping the estimate to go back to', () => {
		render(<Workspace state={done()} store={memoryStore()} controller={fakeController()} />);
		// The key, and the E7 in the chord list.
		expect(screen.getAllByText('Needs review')).toHaveLength(2);
		fireEvent.click(screen.getByRole('button', { name: 'Correct key or tempo' }));
		const dialog = within(screen.getByRole('dialog', { name: 'Correct key and tempo' }));
		fireEvent.change(dialog.getByLabelText('Key'), { target: { value: '0:major' } });
		expect(
			dialog.getByText(/You set the key; the estimate was Unclear, maybe G major/),
		).toBeTruthy();
		fireEvent.click(dialog.getByRole('button', { name: '×⅔ (shuffle)' }));
		expect(dialog.getByText('Tempo set to 100 BPM.')).toBeTruthy();
		expect(screen.getByText('C major', { selector: 'dd' })).toBeTruthy();
		expect(screen.getByText('100 BPM', { selector: 'dd' })).toBeTruthy();
		expect(screen.getAllByText('Needs review')).toHaveLength(1);
		fireEvent.click(
			dialog.getAllByRole('button', { name: 'Use the estimate' })[0] as HTMLElement,
		);
		expect(screen.getByText('Unclear, maybe G major', { selector: 'dd' })).toBeTruthy();
	});

	it('lets chords be entered by hand when the analysis fails', () => {
		const controller = fakeController();
		controller.time = 2;
		render(
			<Workspace
				state={{ status: 'failed', message: 'Analysis failed.' }}
				store={memoryStore()}
				controller={controller}
			/>,
		);
		fireEvent.click(screen.getByRole('button', { name: 'Add a chord at the playhead' }));
		const dialog = within(screen.getByRole('dialog', { name: 'Add a chord change' }));
		expect((dialog.getByLabelText(/Starts at/) as HTMLInputElement).value).toBe('0:02.0');
		fireEvent.change(dialog.getByLabelText('Chord'), { target: { value: 'G' } });
		fireEvent.click(dialog.getByRole('button', { name: 'Add chord' }));
		expect(chordLabels()).toEqual(['2 seconds: G, set by you, edited']);
	});
});
