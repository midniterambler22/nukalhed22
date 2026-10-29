/** Thrown when theory input (a note name, interval, or chord symbol) is invalid. */
export class TheoryError extends Error {
	override readonly name = 'TheoryError';
}
