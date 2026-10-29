import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createPlaybackController,
	type MediaElementLike,
	type PlaybackController,
} from './playback';

/** A stand-in for an <audio> element: tests set its properties and fire its events. */
class FakeMedia extends EventTarget implements MediaElementLike {
	src = '';
	currentTime = 0;
	duration = Number.NaN;
	paused = true;
	error: { code: number } | null = null;
	playResult: () => Promise<void> = () => Promise.resolve();
	#volume = 1;
	#muted = false;

	get volume() {
		return this.#volume;
	}
	set volume(value: number) {
		this.#volume = value;
		this.fire('volumechange');
	}
	get muted() {
		return this.#muted;
	}
	set muted(value: boolean) {
		this.#muted = value;
		this.fire('volumechange');
	}

	play = vi.fn(() => {
		this.paused = false;
		this.fire('play');
		return this.playResult();
	});
	pause = vi.fn(() => {
		if (this.paused) return;
		this.paused = true;
		this.fire('pause');
	});
	load = vi.fn();
	removeAttribute = vi.fn((name: string) => {
		if (name === 'src') this.src = '';
	});

	fire(type: string) {
		this.dispatchEvent(new Event(type));
	}

	/** Simulates the browser finishing loading metadata for a song of `duration` seconds. */
	loadMetadata(duration: number) {
		this.duration = duration;
		this.fire('loadedmetadata');
	}
}

let media: FakeMedia;
let player: PlaybackController;

beforeEach(() => {
	media = new FakeMedia();
	player = createPlaybackController(media);
});

function loadSong(duration = 180) {
	player.load('blob:song');
	media.loadMetadata(duration);
}

describe('createPlaybackController', () => {
	it('starts empty', () => {
		expect(player.getState()).toMatchObject({
			status: 'empty',
			playing: false,
			currentTime: 0,
			duration: 0,
		});
	});

	it('goes from loading to ready with the duration once metadata loads', () => {
		player.load('blob:song');
		expect(media.src).toBe('blob:song');
		expect(media.load).toHaveBeenCalled();
		expect(player.getState().status).toBe('loading');
		media.loadMetadata(212.5);
		expect(player.getState()).toMatchObject({ status: 'ready', duration: 212.5 });
	});

	it('plays and pauses, tracking the element', async () => {
		loadSong();
		await player.play();
		expect(player.getState().playing).toBe(true);
		player.pause();
		expect(player.getState().playing).toBe(false);
		await player.togglePlay();
		expect(player.getState().playing).toBe(true);
		await player.togglePlay();
		expect(player.getState().playing).toBe(false);
	});

	it('does not play before a song is ready', async () => {
		await player.play();
		expect(media.play).not.toHaveBeenCalled();
		player.load('blob:song');
		await player.play();
		expect(media.play).not.toHaveBeenCalled();
	});

	it('follows the element’s time updates', () => {
		loadSong();
		media.currentTime = 12.25;
		media.fire('timeupdate');
		expect(player.getState().currentTime).toBe(12.25);
		expect(player.getCurrentTime()).toBe(12.25);
	});

	it('updates the position immediately on seek, clamped to the song', () => {
		loadSong(100);
		player.seek(42);
		expect(media.currentTime).toBe(42);
		expect(player.getState().currentTime).toBe(42);
		player.seek(500);
		expect(media.currentTime).toBe(100);
		player.seek(-5);
		expect(media.currentTime).toBe(0);
	});

	it('keeps the seeked position after the element reports it', () => {
		loadSong(100);
		player.seek(30);
		media.currentTime = 30.01;
		media.fire('seeked');
		expect(player.getState().currentTime).toBe(30.01);
	});

	it('skips relative to the element’s current time', () => {
		loadSong(100);
		media.currentTime = 10;
		player.skip(5);
		expect(media.currentTime).toBe(15);
		player.skip(-20);
		expect(media.currentTime).toBe(0);
	});

	it('ignores seeks before a song is ready', () => {
		player.seek(10);
		expect(media.currentTime).toBe(0);
	});

	it('stops playing at the end of the song', async () => {
		loadSong(100);
		await player.play();
		media.paused = true;
		media.currentTime = 100;
		media.fire('ended');
		expect(player.getState()).toMatchObject({ playing: false, currentTime: 100 });
	});

	it('clamps volume to 0…1 and unmutes when the volume is raised', () => {
		player.setVolume(1.5);
		expect(player.getState().volume).toBe(1);
		player.setVolume(-1);
		expect(player.getState().volume).toBe(0);
		player.setMuted(true);
		expect(player.getState().muted).toBe(true);
		player.setVolume(0.4);
		expect(player.getState()).toMatchObject({ volume: 0.4, muted: false });
	});

	it('explains a damaged file', () => {
		player.load('blob:broken');
		media.error = { code: 3 };
		media.fire('error');
		expect(player.getState().status).toBe('error');
		expect(player.getState().error).toMatch(/looks damaged/);
	});

	it('explains a file the browser cannot play', () => {
		player.load('blob:odd');
		media.error = { code: 4 };
		media.fire('error');
		expect(player.getState().error).toMatch(/can’t play this file/);
	});

	it('reports a blocked play request without losing the song', async () => {
		loadSong();
		media.playResult = () => {
			media.paused = true;
			return Promise.reject(new DOMException('blocked', 'NotAllowedError'));
		};
		await player.play();
		expect(player.getState()).toMatchObject({ status: 'ready', playing: false });
		expect(player.getState().error).toMatch(/blocked playback/);
	});

	it('resets when a new song loads', async () => {
		loadSong(100);
		await player.play();
		player.seek(50);
		player.load('blob:next');
		expect(media.pause).toHaveBeenCalled();
		expect(player.getState()).toMatchObject({
			status: 'loading',
			playing: false,
			currentTime: 0,
			duration: 0,
		});
	});

	it('unloads without reporting the empty source as an error', () => {
		loadSong();
		player.unload();
		media.error = { code: 4 };
		media.fire('error');
		expect(player.getState()).toMatchObject({ status: 'empty', error: null });
		expect(media.src).toBe('');
	});

	it('notifies subscribers only when something changes', () => {
		const listener = vi.fn();
		const unsubscribe = player.subscribe(listener);
		loadSong();
		const calls = listener.mock.calls.length;
		media.fire('timeupdate');
		expect(listener).toHaveBeenCalledTimes(calls);
		unsubscribe();
		media.currentTime = 3;
		media.fire('timeupdate');
		expect(listener).toHaveBeenCalledTimes(calls);
	});

	it('stops listening to the element after destroy', () => {
		loadSong();
		player.destroy();
		media.currentTime = 9;
		media.fire('timeupdate');
		expect(player.getState().currentTime).toBe(0);
	});
});
