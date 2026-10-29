/**
 * Decodes a song in the browser for analysis. Nothing leaves the device.
 *
 * Analysis gets one mono channel at a fixed sample rate, so later phases don't need
 * to handle every rate and channel layout a file can have.
 */

/** Sample rate used for analysis. 44.1 kHz is what Essentia.js and most music analysis expect. */
export const ANALYSIS_SAMPLE_RATE = 44100;

/** Longest song decoded for analysis: 20 minutes, about 212 MB of mono samples. */
export const MAX_ANALYSIS_SECONDS = 20 * 60;

export interface DecodedAudio {
	/** Mono samples (the average of all channels), -1…1. */
	samples: Float32Array;
	sampleRate: number;
	duration: number;
	/** Channel count of the source before mixing to mono. */
	sourceChannels: number;
}

/** The parts of an `AudioBuffer` decoding needs. */
export interface DecodedBufferLike {
	numberOfChannels: number;
	length: number;
	sampleRate: number;
	duration: number;
	getChannelData(channel: number): Float32Array;
}

/** Turns encoded bytes into PCM, e.g. `OfflineAudioContext.decodeAudioData`. */
export type DecodeAudioData = (data: ArrayBuffer) => Promise<DecodedBufferLike>;

export type DecodeErrorCode = 'too-long' | 'decode-failed' | 'no-audio' | 'unavailable';

export class AudioDecodeError extends Error {
	readonly code: DecodeErrorCode;

	constructor(code: DecodeErrorCode, message: string) {
		super(message);
		this.name = 'AudioDecodeError';
		this.code = code;
	}
}

/** Averages every channel into one. A mono buffer's channel is copied, not shared. */
export function mixToMono(buffer: DecodedBufferLike): Float32Array {
	const mono = new Float32Array(buffer.length);
	const channels = buffer.numberOfChannels;
	for (let c = 0; c < channels; c++) {
		const data = buffer.getChannelData(c);
		for (let i = 0; i < mono.length; i++) mono[i] = (mono[i] ?? 0) + (data[i] ?? 0);
	}
	if (channels > 1) {
		for (let i = 0; i < mono.length; i++) mono[i] = (mono[i] ?? 0) / channels;
	}
	return mono;
}

/** The browser decoder: an `OfflineAudioContext` resamples to `ANALYSIS_SAMPLE_RATE` while decoding. */
export function browserDecoder(): DecodeAudioData {
	const Context = globalThis.OfflineAudioContext;
	if (typeof Context !== 'function') {
		throw new AudioDecodeError(
			'unavailable',
			'This browser can’t decode audio for analysis. Playback still works; analysis needs a current version of Chrome, Edge, Firefox or Safari.',
		);
	}
	const context = new Context(1, 1, ANALYSIS_SAMPLE_RATE);
	return (data) => context.decodeAudioData(data);
}

/**
 * Decodes encoded audio into mono samples for analysis. Throws `AudioDecodeError`
 * with a readable message when the file can't be decoded or is too long.
 */
export async function decodeForAnalysis(
	data: ArrayBuffer,
	decode: DecodeAudioData = browserDecoder(),
): Promise<DecodedAudio> {
	let buffer: DecodedBufferLike;
	try {
		buffer = await decode(data);
	} catch {
		throw new AudioDecodeError(
			'decode-failed',
			'The audio couldn’t be decoded for analysis. The file may be damaged or use an unusual encoding; try converting it to MP3 or WAV.',
		);
	}
	if (buffer.length === 0 || buffer.numberOfChannels === 0) {
		throw new AudioDecodeError('no-audio', 'The file decoded but contains no audio.');
	}
	if (buffer.duration > MAX_ANALYSIS_SECONDS) {
		throw new AudioDecodeError(
			'too-long',
			`Songs longer than ${MAX_ANALYSIS_SECONDS / 60} minutes can be played but not analyzed.`,
		);
	}
	return {
		samples: mixToMono(buffer),
		sampleRate: buffer.sampleRate,
		duration: buffer.duration,
		sourceChannels: buffer.numberOfChannels,
	};
}
