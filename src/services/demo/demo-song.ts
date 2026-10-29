import { renderSong } from './synth';
import { encodeWav } from './wav';

/**
 * The demo song: a 12-bar blues in A, synthesized in the browser so a player can try
 * the workspace without a file of their own. It goes through the real pipeline
 * (playback, decoding, analysis), so everything shown for it is a genuine estimate
 * from audio. The score below is never shown as an analysis result.
 */
export const DEMO_SONG = {
	title: 'Demo: 12-bar blues in A',
	fileName: 'Demo - 12-bar blues in A (synthesized).wav',
	bpm: 100,
	chords: ['A7', 'A7', 'A7', 'A7', 'D7', 'D7', 'A7', 'A7', 'E7', 'D7', 'A7', 'E7'],
	repeats: 2,
	sampleRate: 22050,
} as const;

/** Renders the demo song as a WAV file. Takes a moment: call it from a user action. */
export function createDemoSongFile(): File {
	const { samples, sampleRate } = renderSong({
		bpm: DEMO_SONG.bpm,
		chords: DEMO_SONG.chords,
		repeats: DEMO_SONG.repeats,
		sampleRate: DEMO_SONG.sampleRate,
	});
	return new File([encodeWav(samples, sampleRate)], DEMO_SONG.fileName, { type: 'audio/wav' });
}
