// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { useLocalSong, type LocalSongOptions } from '../../hooks/useLocalSong';
import { AudioDecodeError, type DecodedAudio } from '../../services/audio';
import { SongPlayer } from './SongPlayer';

function Harness(options: LocalSongOptions) {
	const song = useLocalSong(options);
	return <SongPlayer song={song} />;
}

const decoded: DecodedAudio = {
	samples: Float32Array.from({ length: 4410 }, (_, i) => Math.sin(i / 10)),
	sampleRate: 44100,
	duration: 180,
	sourceChannels: 2,
};

let loadSpy: MockInstance<HTMLMediaElement['load']>;

/** The player's <audio> element: the one that last loaded a song. */
function media(): HTMLMediaElement {
	const element = loadSpy.mock.contexts.at(-1) as HTMLMediaElement | undefined;
	if (!element) throw new Error('No song has been loaded yet');
	return element;
}

function setMedia(property: string, value: unknown) {
	Object.defineProperty(media(), property, { value, configurable: true, writable: true });
}

async function fire(type: string) {
	await act(async () => {
		media().dispatchEvent(new Event(type));
	});
}

beforeEach(() => {
	let urls = 0;
	vi.stubGlobal(
		'URL',
		Object.assign(URL, {
			createObjectURL: vi.fn(() => `blob:song-${++urls}`),
			revokeObjectURL: vi.fn(),
		}),
	);
	loadSpy = vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
	vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (
		this: HTMLMediaElement,
	) {
		if (this.paused) return;
		Object.defineProperty(this, 'paused', { value: true, configurable: true });
		this.dispatchEvent(new Event('pause'));
	});
	vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (
		this: HTMLMediaElement,
	) {
		Object.defineProperty(this, 'paused', { value: false, configurable: true });
		this.dispatchEvent(new Event('play'));
		return Promise.resolve();
	});
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

const mp3 = () => new File(['fake mp3 bytes'], 'Little Wing.mp3', { type: 'audio/mpeg' });

function chooseFile(file: File) {
	fireEvent.change(screen.getByTestId('song-file-input'), { target: { files: [file] } });
}

async function loadMetadata(duration = 180) {
	setMedia('duration', duration);
	await fire('loadedmetadata');
}

const playsEverything = () => 'maybe';

describe('SongPlayer', () => {
	it('says the song stays on this device and lists supported formats and the size limit', () => {
		render(<Harness canPlayType={playsEverything} decode={async () => decoded} />);
		expect(screen.getByText(/stays on this device.*never uploaded/)).toBeTruthy();
		expect(screen.getByText('MP3, WAV, M4A, AAC or FLAC, up to 200 MB.')).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Choose a song' })).toBeTruthy();
		expect(screen.queryByRole('button', { name: 'Play' })).toBeNull();
	});

	it('refuses an unsupported file with a clear message', () => {
		render(<Harness canPlayType={playsEverything} decode={async () => decoded} />);
		chooseFile(new File(['hello'], 'notes.txt', { type: 'text/plain' }));
		expect(screen.getByRole('alert').textContent).toMatch(/isn’t a supported audio file/);
		expect(URL.createObjectURL).not.toHaveBeenCalled();
	});

	it('refuses a format this browser cannot play', () => {
		render(<Harness canPlayType={() => ''} decode={async () => decoded} />);
		chooseFile(new File(['x'], 'lossless.flac'));
		expect(screen.getByRole('alert').textContent).toMatch(/can’t play FLAC files/);
	});

	it('loads a song, then plays, pauses and seeks it', async () => {
		const decode = vi.fn(async () => decoded);
		render(<Harness canPlayType={playsEverything} decode={decode} />);
		chooseFile(mp3());
		expect(screen.getByText('Little Wing.mp3')).toBeTruthy();
		expect(screen.getByText('Loading the song…')).toBeTruthy();
		const play = screen.getByRole('button', { name: 'Play' }) as HTMLButtonElement;
		expect(play.disabled).toBe(true);
		expect(decode).not.toHaveBeenCalled();

		await loadMetadata(180);
		expect(play.disabled).toBe(false);
		expect(screen.getByText('0:00 / 3:00')).toBeTruthy();
		await waitFor(() =>
			expect(
				screen.getByText(/^Ready for analysis: 3:00 decoded on this device/),
			).toBeTruthy(),
		);
		expect(decode).toHaveBeenCalledTimes(1);

		await act(async () => fireEvent.click(play));
		expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
		await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Pause' })));
		expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy();

		const position = screen.getByLabelText('Position');
		fireEvent.change(position, { target: { value: '65' } });
		expect(media().currentTime).toBe(65);
		expect(screen.getByText('1:05 / 3:00')).toBeTruthy();
		expect(position.getAttribute('aria-valuetext')).toBe('1 minute 5 seconds of 3 minutes');

		fireEvent.click(screen.getByRole('button', { name: 'Forward 5 seconds' }));
		expect(media().currentTime).toBe(70);
		fireEvent.click(screen.getByRole('button', { name: 'Back 5 seconds' }));
		expect(media().currentTime).toBe(65);
	});

	it('shows a seek at once while playing, before the next animation frame', async () => {
		render(<Harness canPlayType={playsEverything} decode={async () => decoded} />);
		chooseFile(mp3());
		await loadMetadata(180);
		await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Play' })));
		const frame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);
		fireEvent.change(screen.getByLabelText('Position'), { target: { value: '90' } });
		expect(screen.getByText('1:30 / 3:00')).toBeTruthy();
		expect((screen.getByLabelText('Position') as HTMLInputElement).value).toBe('90');
		frame.mockRestore();
	});

	it('opens a dropped file', async () => {
		render(<Harness canPlayType={playsEverything} decode={async () => decoded} />);
		const zone = screen.getByText('or drop an audio file here').parentElement as HTMLElement;
		fireEvent.drop(zone, { dataTransfer: { files: [mp3()], types: ['Files'] } });
		expect(screen.getByText('Little Wing.mp3')).toBeTruthy();
	});

	it('sets the volume and mutes', async () => {
		render(<Harness canPlayType={playsEverything} decode={async () => decoded} />);
		chooseFile(mp3());
		await loadMetadata();
		fireEvent.change(screen.getByLabelText('Volume'), { target: { value: '0.3' } });
		expect(media().volume).toBeCloseTo(0.3);
		const mute = screen.getByRole('button', { name: 'Mute' });
		fireEvent.click(mute);
		expect(media().muted).toBe(true);
	});

	it('explains a damaged file and keeps the controls off', async () => {
		render(<Harness canPlayType={playsEverything} decode={async () => decoded} />);
		chooseFile(mp3());
		setMedia('error', { code: 3 });
		await fire('error');
		expect(screen.getByRole('alert').textContent).toMatch(/looks damaged/);
		expect((screen.getByRole('button', { name: 'Play' }) as HTMLButtonElement).disabled).toBe(
			true,
		);
	});

	it('keeps playback when decoding for analysis fails, and says why', async () => {
		const decode = async () => {
			throw new AudioDecodeError(
				'decode-failed',
				'The audio couldn’t be decoded for analysis.',
			);
		};
		render(<Harness canPlayType={playsEverything} decode={decode} />);
		chooseFile(mp3());
		await loadMetadata();
		await waitFor(() =>
			expect(screen.getByRole('alert').textContent).toMatch(/couldn’t be decoded/),
		);
		expect((screen.getByRole('button', { name: 'Play' }) as HTMLButtonElement).disabled).toBe(
			false,
		);
	});

	it('does not decode a song too long to analyze', async () => {
		const decode = vi.fn(async () => decoded);
		render(<Harness canPlayType={playsEverything} decode={decode} />);
		chooseFile(mp3());
		await loadMetadata(21 * 60);
		expect(screen.getByRole('alert').textContent).toMatch(
			/longer than 20 minutes can be played but not analyzed/,
		);
		expect(decode).not.toHaveBeenCalled();
	});

	it('releases the previous file when another is opened, and keeps a song when a bad file is refused', async () => {
		render(<Harness canPlayType={playsEverything} decode={async () => decoded} />);
		chooseFile(mp3());
		await loadMetadata();
		chooseFile(new File(['x'], 'Voodoo Child.wav', { type: 'audio/wav' }));
		expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:song-1');
		expect(screen.getByText('Voodoo Child.wav')).toBeTruthy();

		chooseFile(new File(['x'], 'cover.jpg', { type: 'image/jpeg' }));
		expect(screen.getByRole('alert')).toBeTruthy();
		expect(screen.getByText('Voodoo Child.wav')).toBeTruthy();
	});

	it('ignores a decode that finishes after another song was opened', async () => {
		let finishFirst: (audio: DecodedAudio) => void = () => {};
		const decode = vi
			.fn<(file: File) => Promise<DecodedAudio>>()
			.mockImplementationOnce(() => new Promise((resolve) => (finishFirst = resolve)))
			.mockImplementation(() => new Promise(() => {}));
		render(<Harness canPlayType={playsEverything} decode={decode} />);
		chooseFile(mp3());
		await loadMetadata();
		chooseFile(new File(['x'], 'Voodoo Child.wav', { type: 'audio/wav' }));
		await act(async () => finishFirst(decoded));
		expect(screen.queryByText(/^Ready for analysis/)).toBeNull();
	});
});
