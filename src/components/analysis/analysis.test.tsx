// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AnalysisAudioState } from '../../hooks/useLocalSong';
import { useSongAnalysis } from '../../hooks/useSongAnalysis';
import type { DecodedAudio } from '../../services/audio';
import {
	AnalysisError,
	toConfidence,
	type AnalysisEngine,
	type AnalysisProgress,
	type AnalysisResult,
	type ChordEvent,
} from '../../services/analysis';
import { ChordList } from './ChordList';
import { chordShares, displayChord, keyHeadline } from './describe';
import { KeyTempoPanel } from './KeyTempoPanel';

afterEach(cleanup);

function audioState(): AnalysisAudioState {
	const audio: DecodedAudio = {
		samples: new Float32Array(10),
		sampleRate: 44100,
		duration: 60,
		sourceChannels: 2,
	};
	return { status: 'ready', audio };
}

/** An engine whose jobs the test finishes by hand. */
function controlledEngine() {
	const jobs: {
		progress: ((p: AnalysisProgress) => void) | undefined;
		resolve: (r: AnalysisResult) => void;
		reject: (e: unknown) => void;
		cancelled: boolean;
	}[] = [];
	const engine: AnalysisEngine = {
		analyze(_input, onProgress) {
			let resolve!: (r: AnalysisResult) => void;
			let reject!: (e: unknown) => void;
			const result = new Promise<AnalysisResult>((res, rej) => {
				resolve = res;
				reject = rej;
			});
			const job = { progress: onProgress, resolve, reject, cancelled: false };
			jobs.push(job);
			return {
				result,
				cancel: () => {
					job.cancelled = true;
					reject(new AnalysisError('cancelled', 'stopped'));
				},
			};
		},
	};
	return { engine, jobs };
}

const chord = (start: number, end: number, name: string | null, value = 0.9): ChordEvent => ({
	start,
	end,
	chord: name,
	confidence: toConfidence(value),
	alternatives: name ? ['C', 'Em'] : [],
	source: 'auto',
});

function result(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
	return {
		engine: 'test',
		duration: 60,
		key: {
			tonic: 9,
			mode: 'minor',
			name: 'A minor',
			score: 1.2,
			confidence: toConfidence(0.9),
			alternatives: [
				{ tonic: 0, mode: 'major', name: 'C major', score: 1 },
				{ tonic: 4, mode: 'minor', name: 'E minor', score: 0.8 },
			],
		},
		tonalSections: [],
		tempo: { bpm: 96.2, confidence: toConfidence(0.8), beats: [0, 0.625] },
		chords: [
			chord(0, 2, null, 1),
			chord(2, 10, 'Am'),
			chord(10, 14, 'F#m', 0.5),
			chord(14, 16, 'Bb7', 0.2),
		],
		notes: ['Estimated automatically on this device.'],
		...overrides,
	};
}

function Harness({
	audio,
	engine,
	onSeek = () => {},
}: {
	audio: AnalysisAudioState;
	engine: AnalysisEngine;
	onSeek?: (t: number) => void;
}) {
	const analysis = useSongAnalysis(audio, engine);
	return (
		<>
			<section aria-label="key">
				<KeyTempoPanel audio={audio} analysis={analysis} />
			</section>
			<section aria-label="chords">
				<ChordList analysis={analysis} onSeek={onSeek} />
			</section>
		</>
	);
}

describe('analysis panels', () => {
	it('asks for a song before there is one', () => {
		const { engine, jobs } = controlledEngine();
		render(<Harness audio={{ status: 'idle' }} engine={engine} />);
		expect(screen.getByRole('status').textContent).toMatch(/Choose a song/);
		expect(jobs).toHaveLength(0);
	});

	it('says the song is being prepared while it decodes', () => {
		const { engine } = controlledEngine();
		render(<Harness audio={{ status: 'decoding' }} engine={engine} />);
		expect(screen.getByRole('status').textContent).toMatch(/Preparing the song/);
	});

	it('shows progress, then the key, tempo and chords with confidence in words', async () => {
		const { engine, jobs } = controlledEngine();
		render(<Harness audio={audioState()} engine={engine} />);
		expect(screen.getByRole('status').textContent).toMatch(/Analyzing on this device/);
		act(() => jobs[0]?.progress?.({ stage: 'beats', fraction: 0.4 }));
		expect(screen.getByRole('status').textContent).toMatch(/finding the beat… 40%/);
		expect(screen.getByRole('progressbar', { name: 'Analysis progress' })).toHaveProperty(
			'value',
			40,
		);

		await act(async () => jobs[0]?.resolve(result()));
		const key = within(screen.getByRole('region', { name: 'key' }));
		expect(key.getByText('A minor')).toBeTruthy();
		expect(key.getAllByText('likely')).toHaveLength(2);
		expect(key.getByText(/Also possible: C major, E minor/)).toBeTruthy();
		expect(key.getByText('96 BPM')).toBeTruthy();
		expect(key.getByText('Estimated automatically on this device.')).toBeTruthy();
	});

	it('lists chords as buttons that seek, naming uncertain ones and their alternatives', async () => {
		const { engine, jobs } = controlledEngine();
		const onSeek = vi.fn();
		render(<Harness audio={audioState()} engine={engine} onSeek={onSeek} />);
		await act(async () => jobs[0]?.resolve(result()));
		const chords = within(screen.getByRole('list', { name: 'Chord changes' }));
		const buttons = chords.getAllByRole('button');
		expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual([
			'0 seconds: No chord',
			'2 seconds: Am, likely',
			'10 seconds: F♯m, possible, or C or Em',
			'14 seconds: B♭7, uncertain, or C or Em',
		]);
		expect(buttons[3]?.textContent).toBe('0:14B♭7?');
		fireEvent.click(buttons[2] as HTMLElement);
		expect(onSeek).toHaveBeenCalledWith(10);
		expect(screen.getByText(/Main chords/).parentElement?.textContent).toMatch(
			/Am 57%, F♯m 29%, B♭7 14%/,
		);
	});

	it('words a less certain key and flags a changing key and double time', async () => {
		const { engine, jobs } = controlledEngine();
		render(<Harness audio={audioState()} engine={engine} />);
		const base = result();
		await act(async () =>
			jobs[0]?.resolve(
				result({
					key: base.key && { ...base.key, confidence: toConfidence(0.2) },
					tempo: {
						bpm: 70,
						doubleTimeBpm: 140,
						confidence: toConfidence(0.5),
						beats: [],
					},
					tonalSections: [
						{
							start: 0,
							end: 30,
							key: { tonic: 0, mode: 'major', name: 'C major', score: 1 },
						},
						{
							start: 30,
							end: 60,
							key: { tonic: 2, mode: 'major', name: 'D major', score: 1 },
						},
					],
				}),
			),
		);
		expect(screen.getByText('Unclear, maybe A minor')).toBeTruthy();
		expect(screen.getByText('uncertain')).toBeTruthy();
		expect(screen.getByText('possible')).toBeTruthy();
		expect(screen.getByText(/Could also be counted at 140 BPM/)).toBeTruthy();
		expect(screen.getByRole('heading', { name: 'The key seems to change' })).toBeTruthy();
		expect(screen.getByText('0:00–0:30: C major')).toBeTruthy();
	});

	it('says plainly when no key or beat was found', async () => {
		const { engine, jobs } = controlledEngine();
		render(<Harness audio={audioState()} engine={engine} />);
		await act(async () => jobs[0]?.resolve(result({ key: null, tempo: null, chords: [] })));
		expect(screen.getByText('Not found')).toBeTruthy();
		expect(screen.getByText('No steady beat')).toBeTruthy();
		expect(screen.getByText('No chords were recognized in this song.')).toBeTruthy();
	});

	it('shows a failure with a next step, and can try again', async () => {
		const { engine, jobs } = controlledEngine();
		render(<Harness audio={audioState()} engine={engine} />);
		await act(async () => jobs[0]?.reject(new AnalysisError('silent', 'No music was found.')));
		expect(screen.getByRole('alert').textContent).toBe('No music was found.');
		expect(screen.getByText(/the analysis didn’t finish/)).toBeTruthy();
		fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
		expect(jobs).toHaveLength(2);
		expect(screen.getByRole('status').textContent).toMatch(/Analyzing/);
		await act(async () => jobs[1]?.resolve(result()));
		expect(screen.getByText('A minor')).toBeTruthy();
	});

	it('cancels the old song’s analysis and never shows its late result', async () => {
		const { engine, jobs } = controlledEngine();
		const { rerender } = render(<Harness audio={audioState()} engine={engine} />);
		rerender(<Harness audio={audioState()} engine={engine} />);
		expect(jobs[0]?.cancelled).toBe(true);
		await act(async () => jobs[0]?.resolve(result()));
		expect(screen.queryByText('A minor')).toBeNull();
		expect(screen.getByRole('status').textContent).toMatch(/Analyzing/);
	});

	it('reports an unexpected error without inventing results', async () => {
		const { engine, jobs } = controlledEngine();
		render(<Harness audio={audioState()} engine={engine} />);
		await act(async () => jobs[0]?.reject(new TypeError('boom')));
		expect(screen.getByRole('alert').textContent).toMatch(
			/unexpected error.*try analyzing again/,
		);
	});
});

describe('describe helpers', () => {
	it('words the key by confidence', () => {
		const key = result().key;
		if (!key) throw new Error('fixture has a key');
		expect(keyHeadline(key)).toBe('A minor');
		expect(keyHeadline({ ...key, confidence: toConfidence(0.5) })).toBe('Probably A minor');
	});

	it('shares leave out no-chord stretches', () => {
		expect(chordShares(result().chords).map((s) => s.chord)).toEqual(['Am', 'F#m', 'Bb7']);
	});

	it('shows accidentals as symbols', () => {
		expect(displayChord('F#m7')).toBe('F♯m7');
		expect(displayChord('Bb')).toBe('B♭');
		expect(displayChord('Bm')).toBe('Bm');
	});
});
