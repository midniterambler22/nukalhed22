import type { Tuning } from './types';

/**
 * Common guitar tunings, open strings LOW to HIGH as MIDI numbers.
 * MIDI 40 = E2, 45 = A2, 50 = D3, 55 = G3, 59 = B3, 64 = E4.
 */
export const STANDARD_TUNING: Tuning = {
	name: 'Standard (E A D G B E)',
	openMidi: [40, 45, 50, 55, 59, 64],
};

export const TUNINGS: readonly Tuning[] = [
	STANDARD_TUNING,
	{ name: 'Half step down (E♭ A♭ D♭ G♭ B♭ E♭)', openMidi: [39, 44, 49, 54, 58, 63] },
	{ name: 'Drop D (D A D G B E)', openMidi: [38, 45, 50, 55, 59, 64] },
	{ name: 'DADGAD (D A D G A D)', openMidi: [38, 45, 50, 55, 57, 62] },
	{ name: 'Open G (D G D G B D)', openMidi: [38, 43, 50, 55, 59, 62] },
	{ name: 'Open D (D A D F♯ A D)', openMidi: [38, 45, 50, 54, 57, 62] },
];
