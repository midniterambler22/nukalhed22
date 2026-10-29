import { chordPitchClasses } from '../services/music-theory';

/**
 * Renders test songs with known content: chords, tempo and key are exactly what the
 * score says, so analysis results can be checked against ground truth. Used by tests
 * only. Deterministic: the same options always give the same samples.
 */

export interface SynthOptions {
	sampleRate?: number;
	bpm: number;
	/** One chord symbol per bar. */
	chords: readonly string[];
	beatsPerBar?: number;
	/** Plays the chord list this many times. */
	repeats?: number;
	drums?: boolean;
	bass?: boolean;
	/** 0 = clean; higher values push the mix into tanh saturation. */
	drive?: number;
	/** Level of white noise added to the mix. */
	noise?: number;
	/** Seconds of silence before the music starts. */
	leadIn?: number;
}

export interface RenderedSong {
	samples: Float32Array;
	sampleRate: number;
	/** Chord per bar with times, for checking results. */
	bars: { start: number; end: number; chord: string }[];
	beats: number[];
}

function random(seed: number) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const midiToHz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

export function renderSong(options: SynthOptions): RenderedSong {
	const {
		sampleRate = 22050,
		bpm,
		chords,
		beatsPerBar = 4,
		repeats = 1,
		drums = true,
		bass = true,
		drive = 0,
		noise = 0,
		leadIn = 0,
	} = options;
	const beat = 60 / bpm;
	const bar = beat * beatsPerBar;
	const sequence = Array.from({ length: repeats }, () => chords).flat();
	const duration = leadIn + sequence.length * bar + 1;
	const out = new Float32Array(Math.ceil(duration * sampleRate));
	const rand = random(22);

	const addTone = (start: number, length: number, midi: number, gain: number, harmonics = 6) => {
		const f0 = midiToHz(midi);
		const from = Math.floor(start * sampleRate);
		const count = Math.floor(length * sampleRate);
		for (let i = 0; i < count && from + i < out.length; i++) {
			const t = i / sampleRate;
			const envelope =
				Math.min(1, t / 0.005) * Math.exp(-t * 2.5) * Math.min(1, (length - t) / 0.02);
			let v = 0;
			for (let h = 1; h <= harmonics; h++) {
				if (f0 * h >= sampleRate / 2) break;
				v += Math.sin(2 * Math.PI * f0 * h * t) / h;
			}
			out[from + i] = (out[from + i] ?? 0) + gain * envelope * v;
		}
	};
	const addNoise = (start: number, length: number, gain: number, decay: number) => {
		const from = Math.floor(start * sampleRate);
		for (let i = 0; i < length * sampleRate && from + i < out.length; i++) {
			out[from + i] =
				(out[from + i] ?? 0) +
				gain * (rand() * 2 - 1) * Math.exp((-i / sampleRate) * decay);
		}
	};
	const addKick = (start: number) => {
		const from = Math.floor(start * sampleRate);
		let phase = 0;
		for (let i = 0; i < 0.15 * sampleRate && from + i < out.length; i++) {
			const t = i / sampleRate;
			phase += (2 * Math.PI * (50 + 70 * Math.exp(-t * 30))) / sampleRate;
			out[from + i] = (out[from + i] ?? 0) + 0.6 * Math.sin(phase) * Math.exp(-t * 25);
		}
	};

	const bars: RenderedSong['bars'] = [];
	const beats: number[] = [];
	sequence.forEach((symbol, b) => {
		const barStart = leadIn + b * bar;
		bars.push({ start: barStart, end: barStart + bar, chord: symbol });
		const pcs = chordPitchClasses(symbol);
		const root = pcs[0] ?? 0;
		for (let k = 0; k < beatsPerBar; k++) {
			const t = barStart + k * beat;
			beats.push(t);
			// Strum the chord on every beat, voiced between E3 and D#4.
			for (const pc of pcs) addTone(t, beat, 52 + ((pc - 4 + 12) % 12), 0.12);
			if (bass) addTone(t, beat, 40 + ((root - 4 + 12) % 12), 0.2, 4);
			if (drums) {
				if (k % 2 === 0) addKick(t);
				else addNoise(t, 0.12, 0.25, 30);
				addNoise(t + beat / 2, 0.03, 0.06, 120);
			}
		}
	});

	for (let i = 0; i < out.length; i++) {
		let v = (out[i] ?? 0) + (noise > 0 ? noise * (rand() * 2 - 1) : 0);
		if (drive > 0) v = Math.tanh(v * (1 + drive)) / Math.tanh(1 + drive);
		out[i] = Math.max(-1, Math.min(1, v * 0.8));
	}
	return { samples: out, sampleRate, bars, beats };
}

/** The chord the score has at time `t`, or null outside the music. */
export function chordAt(song: RenderedSong, t: number): string | null {
	return song.bars.find((b) => t >= b.start && t < b.end)?.chord ?? null;
}
