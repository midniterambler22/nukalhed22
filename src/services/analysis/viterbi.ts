/**
 * Best path through a sequence of per-step state scores when switching state costs
 * a fixed amount: maximises the summed scores minus `changeCost` per switch. Used to
 * keep chords and keys from flickering between neighbouring segments.
 */
export function viterbiPath(scores: readonly Float64Array[], changeCost: number): number[] {
	const first = scores[0];
	if (!first) return [];
	const states = first.length;
	let total = Float64Array.from(first);
	const back: Int32Array[] = [];
	for (let n = 1; n < scores.length; n++) {
		const step = scores[n] ?? new Float64Array(states);
		const bestPrev = argmax(total);
		const move = (total[bestPrev] ?? 0) - changeCost;
		const next = new Float64Array(states);
		const from = new Int32Array(states);
		for (let k = 0; k < states; k++) {
			const stay = total[k] ?? 0;
			from[k] = stay >= move ? k : bestPrev;
			next[k] = Math.max(stay, move) + (step[k] ?? 0);
		}
		back.push(from);
		total = next;
	}
	const path = new Array<number>(scores.length);
	let state = argmax(total);
	path[scores.length - 1] = state;
	for (let n = scores.length - 1; n > 0; n--) {
		state = back[n - 1]?.[state] ?? state;
		path[n - 1] = state;
	}
	return path;
}

export function argmax(values: ArrayLike<number>): number {
	let best = 0;
	for (let i = 1; i < values.length; i++) if ((values[i] ?? 0) > (values[best] ?? 0)) best = i;
	return best;
}
