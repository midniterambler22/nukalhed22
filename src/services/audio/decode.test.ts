import { describe, expect, it } from 'vitest';
import {
	ANALYSIS_SAMPLE_RATE,
	AudioDecodeError,
	decodeForAnalysis,
	MAX_ANALYSIS_SECONDS,
	mixToMono,
	type DecodedBufferLike,
} from './decode';

function fakeBuffer(channels: number[][], sampleRate = ANALYSIS_SAMPLE_RATE): DecodedBufferLike {
	const data = channels.map((c) => Float32Array.from(c));
	const length = data[0]?.length ?? 0;
	return {
		numberOfChannels: data.length,
		length,
		sampleRate,
		duration: length / sampleRate,
		getChannelData: (c) => data[c] ?? new Float32Array(length),
	};
}

describe('mixToMono', () => {
	it('averages stereo channels sample by sample', () => {
		const mono = mixToMono(
			fakeBuffer([
				[1, 0.5, -1],
				[0, 0.5, 1],
			]),
		);
		expect(Array.from(mono)).toEqual([0.5, 0.5, 0]);
	});

	it('copies a mono channel instead of sharing it', () => {
		const buffer = fakeBuffer([[0.25, -0.25]]);
		const mono = mixToMono(buffer);
		expect(Array.from(mono)).toEqual([0.25, -0.25]);
		expect(mono).not.toBe(buffer.getChannelData(0));
	});

	it('cancels a channel against its inverse', () => {
		const mono = mixToMono(
			fakeBuffer([
				[0.8, -0.3],
				[-0.8, 0.3],
			]),
		);
		expect(Array.from(mono)).toEqual([0, 0]);
	});
});

describe('decodeForAnalysis', () => {
	it('returns mono samples with the rate, duration and source channel count', async () => {
		const buffer = fakeBuffer([new Array(44100).fill(0.5), new Array(44100).fill(-0.5)]);
		const result = await decodeForAnalysis(new ArrayBuffer(8), async () => buffer);
		expect(result.sampleRate).toBe(44100);
		expect(result.duration).toBe(1);
		expect(result.sourceChannels).toBe(2);
		expect(result.samples).toHaveLength(44100);
		expect(result.samples[100]).toBe(0);
	});

	it('explains a decoder failure', async () => {
		const failing = async () => {
			throw new DOMException('Unable to decode', 'EncodingError');
		};
		await expect(decodeForAnalysis(new ArrayBuffer(8), failing)).rejects.toMatchObject({
			code: 'decode-failed',
			message: expect.stringMatching(/couldn’t be decoded/),
		});
	});

	it('rejects a decode with no samples', async () => {
		await expect(
			decodeForAnalysis(new ArrayBuffer(8), async () => fakeBuffer([[]])),
		).rejects.toMatchObject({
			code: 'no-audio',
		});
	});

	it('refuses songs over the analysis length limit', async () => {
		const long: DecodedBufferLike = {
			numberOfChannels: 1,
			length: 1,
			sampleRate: ANALYSIS_SAMPLE_RATE,
			duration: MAX_ANALYSIS_SECONDS + 1,
			getChannelData: () => new Float32Array(1),
		};
		const error = await decodeForAnalysis(new ArrayBuffer(8), async () => long).catch(
			(e: unknown) => e,
		);
		expect(error).toBeInstanceOf(AudioDecodeError);
		expect((error as AudioDecodeError).code).toBe('too-long');
	});
});
