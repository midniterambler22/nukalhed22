/**
 * Splits samples into `bucketCount` equal spans and returns the loudest absolute
 * sample in each (0…1), for drawing a waveform overview. Returns fewer buckets when
 * there are fewer samples than buckets.
 */
export function computePeaks(samples: Float32Array, bucketCount: number): number[] {
	if (!Number.isInteger(bucketCount) || bucketCount <= 0 || samples.length === 0) return [];
	const buckets = Math.min(bucketCount, samples.length);
	const peaks: number[] = [];
	for (let b = 0; b < buckets; b++) {
		const start = Math.floor((b * samples.length) / buckets);
		const end = Math.floor(((b + 1) * samples.length) / buckets);
		let peak = 0;
		for (let i = start; i < end; i++) {
			const value = Math.abs(samples[i] ?? 0);
			if (value > peak) peak = value;
		}
		peaks.push(Math.min(peak, 1));
	}
	return peaks;
}

/** Scales peaks so the loudest is 1, so quiet recordings still draw a readable waveform. Silence stays flat. */
export function normalizePeaks(peaks: readonly number[]): number[] {
	const loudest = peaks.reduce((max, peak) => Math.max(max, peak), 0);
	return loudest > 0 ? peaks.map((peak) => peak / loudest) : [...peaks];
}
