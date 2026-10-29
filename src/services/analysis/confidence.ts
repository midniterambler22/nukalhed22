import type { Confidence, ConfidenceLevel } from './types';

/** Cut-offs between confidence levels, shared by every estimate. */
export const CONFIDENCE_THRESHOLDS = { high: 0.7, medium: 0.4 } as const;

export function confidenceLevel(value: number): ConfidenceLevel {
	if (value >= CONFIDENCE_THRESHOLDS.high) return 'high';
	if (value >= CONFIDENCE_THRESHOLDS.medium) return 'medium';
	return 'low';
}

export function toConfidence(value: number): Confidence {
	const clamped = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
	return { value: Math.round(clamped * 100) / 100, level: confidenceLevel(clamped) };
}

/** Maps `x` linearly from [from, to] onto [0, 1], clamped. */
export function ramp(x: number, from: number, to: number): number {
	return Math.min(1, Math.max(0, (x - from) / (to - from)));
}
