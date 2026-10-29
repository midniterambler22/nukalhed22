import type { MouseEvent } from 'react';

export interface WaveformProps {
	/** Loudness per bar, 0…1. */
	peaks: readonly number[];
	/** Played fraction, 0…1. */
	progress: number;
	/** Called with a fraction 0…1 when the waveform is clicked. */
	onSeek(fraction: number): void;
}

const HEIGHT = 60;

/**
 * Overview of the whole song with a playhead. Pointer only and hidden from assistive
 * technology: the Position slider is the accessible way to seek. Played bars are
 * solid and unplayed bars are faint, and the playhead line marks the position, so
 * progress doesn't depend on color.
 */
export function Waveform({ peaks, progress, onSeek }: WaveformProps) {
	if (peaks.length === 0) return null;
	const width = peaks.length;
	const playedBars = Math.round(Math.min(Math.max(progress, 0), 1) * width);

	function handleClick(event: MouseEvent<SVGSVGElement>) {
		const box = event.currentTarget.getBoundingClientRect();
		if (box.width > 0) onSeek(Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1));
	}

	return (
		<svg
			className="player-waveform"
			viewBox={`0 0 ${width} ${HEIGHT}`}
			preserveAspectRatio="none"
			aria-hidden="true"
			onClick={handleClick}
		>
			{peaks.map((peak, i) => {
				const barHeight = Math.max(peak * HEIGHT, 1);
				return (
					<rect
						key={i}
						className={
							i < playedBars ? 'player-waveform-bar is-played' : 'player-waveform-bar'
						}
						x={i + 0.15}
						y={(HEIGHT - barHeight) / 2}
						width={0.7}
						height={barHeight}
					/>
				);
			})}
			<line
				className="player-waveform-head"
				x1={playedBars}
				x2={playedBars}
				y1={0}
				y2={HEIGHT}
			/>
		</svg>
	);
}
