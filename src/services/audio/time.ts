/** Clamps a time in seconds to 0…duration. A missing or unknown duration only clamps at 0. */
export function clampTime(seconds: number, duration: number): number {
	if (!Number.isFinite(seconds) || seconds < 0) return 0;
	if (Number.isFinite(duration) && duration >= 0 && seconds > duration) return duration;
	return seconds;
}

function wholeSeconds(seconds: number): number {
	return Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
}

/** "m:ss", or "h:mm:ss" from one hour. Unknown or negative times show as 0:00. */
export function formatTime(seconds: number): string {
	const total = wholeSeconds(seconds);
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = String(total % 60).padStart(2, '0');
	return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

function plural(count: number, unit: string): string {
	return `${count} ${unit}${count === 1 ? '' : 's'}`;
}

/** Words for screen readers: "1 minute 5 seconds". */
export function describeTime(seconds: number): string {
	const total = wholeSeconds(seconds);
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = total % 60;
	const parts: string[] = [];
	if (h > 0) parts.push(plural(h, 'hour'));
	if (m > 0) parts.push(plural(m, 'minute'));
	if (s > 0 || parts.length === 0) parts.push(plural(s, 'second'));
	return parts.join(' ');
}

/** "m:ss.s" (tenths of a second), for editing chord times. */
export function formatPreciseTime(seconds: number): string {
	const tenths = Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds * 10) : 0;
	const whole = Math.floor(tenths / 10);
	return `${formatTime(whole)}.${tenths % 10}`;
}

/**
 * Reads a time the user typed: seconds ("83.5"), "m:ss.s" ("1:23.5") or
 * "h:mm:ss". Null when it isn't a time.
 */
export function parseTime(text: string): number | null {
	const parts = text.trim().split(':');
	if (parts.length > 3 || parts.some((p) => !/^\d+(\.\d+)?$/.test(p))) return null;
	const numbers = parts.map(Number);
	// Only the last part may have a fraction, and minutes and seconds after the first part stay under 60.
	if (numbers.slice(0, -1).some((n) => !Number.isInteger(n))) return null;
	if (numbers.slice(1).some((n) => n >= 60)) return null;
	return numbers.reduce((total, n) => total * 60 + n, 0);
}
