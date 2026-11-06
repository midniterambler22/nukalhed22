import type { SongTimeline } from '../../hooks/useSongCorrections';
import { usePlaybackChord } from '../../hooks/usePlaybackChord';
import { describeTime, formatPreciseTime, type PlaybackController } from '../../services/audio';
import { chordsInLoop, loopForChords, type LoopRange } from '../../services/progression';
import { displayChord } from '../analysis';
import './chords.css';

export interface LoopControlProps {
	controller: PlaybackController;
	timeline: SongTimeline;
	duration: number;
	loop: LoopRange | null;
	onLoopChange(loop: LoopRange | null): void;
}

/**
 * Loop a chord or a run of chords. With no loop, "Loop chord" repeats the chord
 * playing now; with one, it can grow or shrink a chord at a time, or stop.
 */
export function LoopControl({
	controller,
	timeline,
	duration,
	loop,
	onLoopChange,
}: LoopControlProps) {
	const chords = timeline.chords;
	const { current } = usePlaybackChord(controller, chords);
	if (chords.length === 0) return null;

	if (!loop) {
		return (
			<div className="loop-control" role="group" aria-label="Loop">
				<button
					type="button"
					className="btn btn--ghost"
					disabled={current === -1}
					onClick={() => onLoopChange(loopForChords(chords, current, current, duration))}
				>
					<LoopIcon />
					Loop chord
				</button>
			</div>
		);
	}

	const range = chordsInLoop(chords, loop);
	const set = (first: number, last: number) => {
		const next = loopForChords(chords, first, last, duration);
		if (next) onLoopChange(next);
	};
	const first = range?.first ?? -1;
	const last = range?.last ?? -1;
	const name = (i: number) => {
		const chord = chords[i]?.chord;
		return chord ? displayChord(chord) : 'no chord';
	};
	const label =
		range === null
			? ''
			: first === last
				? name(first)
				: `${name(first)} to ${name(last)}, ${last - first + 1} chords`;

	return (
		<div className="loop-control is-active" role="group" aria-label="Loop">
			<span className="loop-control-label">
				<LoopIcon />
				<span>
					Looping {label}
					<span className="loop-control-time" aria-hidden="true">
						{' '}
						{formatPreciseTime(loop.start)}–{formatPreciseTime(loop.end)}
					</span>
					<span className="visually-hidden">
						, from {describeTime(loop.start)} to {describeTime(loop.end)}
					</span>
				</span>
			</span>
			<button
				type="button"
				className="btn btn--ghost"
				disabled={range === null || last <= first}
				onClick={() => set(first, last - 1)}
				aria-label="Loop one chord fewer"
			>
				−
			</button>
			<button
				type="button"
				className="btn btn--ghost"
				disabled={range === null || last >= chords.length - 1}
				onClick={() => set(first, last + 1)}
				aria-label="Loop one more chord"
			>
				+
			</button>
			<button type="button" className="btn btn--ghost" onClick={() => onLoopChange(null)}>
				Stop loop
			</button>
		</div>
	);
}

function LoopIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
			<path
				d="M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
