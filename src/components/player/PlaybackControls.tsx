import { useId } from 'react';
import type { LocalSong } from '../../hooks/useLocalSong';
import { usePlaybackTime } from '../../hooks/usePlaybackTime';
import { describeTime, formatTime } from '../../services/audio';
import { previousChangeIndex, nextChangeIndex, type TimedChord } from '../../services/progression';
import './player.css';

const SKIP_SECONDS = 5;

export interface PlaybackControlsProps {
	song: LocalSong;
	/** Chord changes, for the previous/next chord buttons. Empty until analysis finishes. */
	chords?: readonly TimedChord[];
}

/**
 * The playback bar, always on screen: play and pause, skip, previous and next chord,
 * position and volume. Every control drives the one audio element.
 */
export function PlaybackControls({ song, chords = [] }: PlaybackControlsProps) {
	const { controller, playback } = song;
	const id = useId();
	const time = usePlaybackTime(controller);
	const ready = playback.status === 'ready';
	const previous = previousChangeIndex(chords, time);
	const next = nextChangeIndex(chords, time);
	const seekTo = (index: number) => {
		const event = chords[index];
		if (event) controller.seek(event.start);
	};

	return (
		<div className="playback" role="group" aria-label="Playback">
			<div className="playback-transport">
				{chords.length > 0 && (
					<button
						type="button"
						className="btn btn--ghost"
						disabled={!ready || previous === -1}
						onClick={() => seekTo(previous)}
						aria-label="Previous chord"
					>
						<Icon d="M6 5h2v14H6zM20 5v14L9 12z" />
					</button>
				)}
				<button
					type="button"
					className="btn btn--ghost"
					disabled={!ready}
					onClick={() => controller.skip(-SKIP_SECONDS)}
					aria-label={`Back ${SKIP_SECONDS} seconds`}
				>
					−{SKIP_SECONDS}s
				</button>
				<button
					type="button"
					className="btn btn--primary playback-play"
					disabled={!ready}
					onClick={() => void controller.togglePlay()}
				>
					{playback.playing ? (
						<Icon d="M6 5h4v14H6zM14 5h4v14h-4z" />
					) : (
						<Icon d="M7 4v16l13-8z" />
					)}
					{playback.playing ? 'Pause' : 'Play'}
				</button>
				<button
					type="button"
					className="btn btn--ghost"
					disabled={!ready}
					onClick={() => controller.skip(SKIP_SECONDS)}
					aria-label={`Forward ${SKIP_SECONDS} seconds`}
				>
					+{SKIP_SECONDS}s
				</button>
				{chords.length > 0 && (
					<button
						type="button"
						className="btn btn--ghost"
						disabled={!ready || next === -1}
						onClick={() => seekTo(next)}
						aria-label="Next chord"
					>
						<Icon d="M16 5h2v14h-2zM4 5v14l11-7z" />
					</button>
				)}
			</div>

			<label className="playback-slider playback-position" htmlFor={`${id}-position`}>
				<span className="visually-hidden">Position</span>
				<input
					id={`${id}-position`}
					type="range"
					min={0}
					max={playback.duration || 0}
					step={1}
					value={Math.min(time, playback.duration || 0)}
					disabled={!ready}
					aria-valuetext={`${describeTime(time)} of ${describeTime(playback.duration)}`}
					onChange={(event) => controller.seek(Number(event.target.value))}
				/>
			</label>
			<span className="playback-time">
				{song.song
					? `${formatTime(time)} / ${formatTime(playback.duration)}`
					: 'No song loaded'}
			</span>

			<div className="playback-volume">
				<button
					type="button"
					className="btn btn--ghost"
					aria-pressed={playback.muted}
					onClick={() => controller.setMuted(!playback.muted)}
				>
					{playback.muted ? (
						<Icon d="M4 9h4l5-4v14l-5-4H4zM16 9l5 6M21 9l-5 6" stroke />
					) : (
						<Icon
							d="M4 9h4l5-4v14l-5-4H4zM16 8a5 5 0 0 1 0 8M18.5 5.5a9 9 0 0 1 0 13"
							stroke
						/>
					)}
					Mute
				</button>
				<label className="playback-slider" htmlFor={`${id}-volume`}>
					<span className="visually-hidden">Volume</span>
					<input
						id={`${id}-volume`}
						type="range"
						min={0}
						max={1}
						step={0.05}
						value={playback.muted ? 0 : playback.volume}
						aria-valuetext={
							playback.muted ? 'Muted' : `${Math.round(playback.volume * 100)}%`
						}
						onChange={(event) => controller.setVolume(Number(event.target.value))}
					/>
				</label>
			</div>
		</div>
	);
}

function Icon({ d, stroke = false }: { d: string; stroke?: boolean }) {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
			<path
				d={d}
				fill={stroke ? 'none' : 'currentColor'}
				stroke={stroke ? 'currentColor' : 'none'}
				strokeWidth={stroke ? 2 : 0}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
