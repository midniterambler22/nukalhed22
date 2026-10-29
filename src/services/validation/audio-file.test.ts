import { describe, expect, it } from 'vitest';
import {
	AUDIO_FILE_ACCEPT,
	detectAudioFormat,
	formatFileSize,
	MAX_AUDIO_FILE_BYTES,
	validateAudioFile,
	type CanPlayType,
} from './audio-file';

const playsEverything: CanPlayType = () => 'maybe';
const noFlac: CanPlayType = (type) => (type === 'audio/flac' ? '' : 'maybe');

const file = (name: string, size = 1_000_000, type = '') => ({ name, size, type });

describe('detectAudioFormat', () => {
	it.each([
		['song.mp3', 'mp3'],
		['SONG.MP3', 'mp3'],
		['take.wav', 'wav'],
		['take.wave', 'wav'],
		['track.m4a', 'm4a'],
		['track.aac', 'aac'],
		['lossless.flac', 'flac'],
		['my.band - live.flac', 'flac'],
	])('%s → %s', (name, id) => {
		expect(detectAudioFormat(file(name))?.id).toBe(id);
	});

	it('falls back to the MIME type when the name has no known extension', () => {
		expect(detectAudioFormat(file('recording', 1, 'audio/mpeg'))?.id).toBe('mp3');
		expect(detectAudioFormat(file('recording.bin', 1, 'audio/x-m4a'))?.id).toBe('m4a');
		expect(detectAudioFormat(file('recording', 1, 'audio/wav; codecs=1'))?.id).toBe('wav');
	});

	it('trusts the extension over a generic MIME type', () => {
		expect(detectAudioFormat(file('lossless.flac', 1, 'application/octet-stream'))?.id).toBe(
			'flac',
		);
	});

	it('returns null for anything else', () => {
		expect(detectAudioFormat(file('notes.txt', 1, 'text/plain'))).toBeNull();
		expect(detectAudioFormat(file('clip.ogg', 1, 'audio/ogg'))).toBeNull();
		expect(detectAudioFormat(file('video.mp4', 1, 'video/mp4'))).toBeNull();
	});
});

describe('validateAudioFile', () => {
	it('accepts a supported file the browser can play', () => {
		const result = validateAudioFile(file('song.mp3'), playsEverything);
		expect(result).toMatchObject({ ok: true, format: { id: 'mp3' } });
	});

	it('accepts a file exactly at the size limit', () => {
		expect(validateAudioFile(file('big.wav', MAX_AUDIO_FILE_BYTES), playsEverything).ok).toBe(
			true,
		);
	});

	it('rejects an empty file', () => {
		expect(validateAudioFile(file('song.mp3', 0), playsEverything)).toMatchObject({
			ok: false,
			error: { code: 'empty-file' },
		});
	});

	it('rejects a file over the limit and names both sizes', () => {
		const result = validateAudioFile(
			file('huge.wav', MAX_AUDIO_FILE_BYTES + 1),
			playsEverything,
		);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe('too-large');
			expect(result.error.message).toMatch(/200 MB/);
		}
	});

	it('rejects unsupported files and lists what is supported', () => {
		const result = validateAudioFile(file('notes.txt', 10, 'text/plain'), playsEverything);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe('unsupported-format');
			expect(result.error.message).toMatch(/MP3, WAV, M4A, AAC or FLAC/);
		}
	});

	it('rejects a supported format this browser cannot play, and suggests a fix', () => {
		const result = validateAudioFile(file('lossless.flac'), noFlac);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe('browser-cannot-play');
			expect(result.error.message).toMatch(/can’t play FLAC files.*MP3 or WAV/);
		}
		expect(validateAudioFile(file('song.mp3'), noFlac).ok).toBe(true);
	});
});

describe('formatFileSize', () => {
	it.each([
		[512, '512 bytes'],
		[2048, '2 KB'],
		[5 * 1024 * 1024, '5 MB'],
		[5.25 * 1024 * 1024, '5.3 MB'],
	])('%s → %s', (bytes, text) => {
		expect(formatFileSize(bytes)).toBe(text);
	});
});

it('accept attribute lists every extension', () => {
	for (const extension of ['.mp3', '.wav', '.m4a', '.aac', '.flac']) {
		expect(AUDIO_FILE_ACCEPT.split(',')).toContain(extension);
	}
});
