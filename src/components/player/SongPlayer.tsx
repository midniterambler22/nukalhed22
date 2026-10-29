import { useId, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import type { LocalSong } from '../../hooks/useLocalSong';
import { usePlaybackTime } from '../../hooks/usePlaybackTime';
import { computePeaks, describeTime, formatTime, normalizePeaks } from '../../services/audio';
import {
	AUDIO_FILE_ACCEPT,
	formatFileSize,
	MAX_AUDIO_FILE_BYTES,
	supportedFormatList,
} from '../../services/validation';
import { Waveform } from './Waveform';
import './player.css';

const SKIP_SECONDS = 5;
const WAVEFORM_BARS = 240;

export interface SongPlayerProps {
	song: LocalSong;
}

/** Song and playback region: choose or drop a local file, then play, pause, seek and set the volume. */
export function SongPlayer({ song }: SongPlayerProps) {
	const { controller, playback, analysisAudio } = song;
	const inputRef = useRef<HTMLInputElement>(null);
	const [dragging, setDragging] = useState(false);
	const id = useId();
	const time = usePlaybackTime(controller);
	const ready = playback.status === 'ready';

	const peaks = useMemo(
		() =>
			analysisAudio.status === 'ready'
				? normalizePeaks(computePeaks(analysisAudio.audio.samples, WAVEFORM_BARS))
				: [],
		[analysisAudio],
	);

	function openFirst(files: FileList | null) {
		const file = files?.[0];
		if (file) song.openFile(file);
	}

	function handleInput(event: ChangeEvent<HTMLInputElement>) {
		openFirst(event.target.files);
		// Let the same file be chosen again after an error.
		event.target.value = '';
	}

	function handleDragOver(event: DragEvent) {
		if (!event.dataTransfer.types.includes('Files')) return;
		event.preventDefault();
		event.dataTransfer.dropEffect = 'copy';
		setDragging(true);
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		setDragging(false);
		openFirst(event.dataTransfer.files);
	}

	return (
		<div className="player">
			<p className="player-privacy">
				Your song stays on this device. It plays and is prepared for analysis in this
				browser and is never uploaded.
			</p>

			<div
				className={dragging ? 'player-drop is-dragging' : 'player-drop'}
				onDragOver={handleDragOver}
				onDragLeave={() => setDragging(false)}
				onDrop={handleDrop}
			>
				<button
					type="button"
					className="player-button player-choose"
					onClick={() => inputRef.current?.click()}
				>
					{song.song ? 'Choose another song' : 'Choose a song'}
				</button>
				<span>or drop an audio file here</span>
				<input
					ref={inputRef}
					type="file"
					accept={AUDIO_FILE_ACCEPT}
					hidden
					data-testid="song-file-input"
					onChange={handleInput}
				/>
				<p className="player-hint">
					{supportedFormatList()}, up to {formatFileSize(MAX_AUDIO_FILE_BYTES)}.
				</p>
			</div>

			{song.fileError && (
				<p role="alert" className="player-error">
					{song.fileError}
				</p>
			)}

			{song.song && (
				<div className="player-song">
					<p className="player-title">
						<strong>{song.song.name}</strong>
						<span className="player-meta">
							{song.song.format.label} · {formatFileSize(song.song.size)}
						</span>
					</p>

					{playback.status === 'loading' && (
						<p role="status" className="player-status">
							Loading the song…
						</p>
					)}
					{playback.error && (
						<p role="alert" className="player-error">
							{playback.error}
						</p>
					)}

					<Waveform
						peaks={peaks}
						progress={playback.duration > 0 ? time / playback.duration : 0}
						onSeek={(fraction) => controller.seek(fraction * playback.duration)}
					/>

					<div className="player-transport">
						<button
							type="button"
							className="player-button"
							disabled={!ready}
							onClick={() => controller.skip(-SKIP_SECONDS)}
							aria-label={`Back ${SKIP_SECONDS} seconds`}
						>
							−{SKIP_SECONDS} s
						</button>
						<button
							type="button"
							className="player-button player-play"
							disabled={!ready}
							onClick={() => void controller.togglePlay()}
						>
							{playback.playing ? 'Pause' : 'Play'}
						</button>
						<button
							type="button"
							className="player-button"
							disabled={!ready}
							onClick={() => controller.skip(SKIP_SECONDS)}
							aria-label={`Forward ${SKIP_SECONDS} seconds`}
						>
							+{SKIP_SECONDS} s
						</button>
						<span className="player-time">
							{formatTime(time)} / {formatTime(playback.duration)}
						</span>
					</div>

					<div className="player-sliders">
						<label className="player-slider player-position" htmlFor={`${id}-position`}>
							Position
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
						<label className="player-slider" htmlFor={`${id}-volume`}>
							Volume
							<input
								id={`${id}-volume`}
								type="range"
								min={0}
								max={1}
								step={0.05}
								value={playback.muted ? 0 : playback.volume}
								aria-valuetext={
									playback.muted
										? 'Muted'
										: `${Math.round(playback.volume * 100)}%`
								}
								onChange={(event) =>
									controller.setVolume(Number(event.target.value))
								}
							/>
						</label>
						<button
							type="button"
							className="player-button"
							aria-pressed={playback.muted}
							onClick={() => controller.setMuted(!playback.muted)}
						>
							{playback.muted && <span aria-hidden="true">✓ </span>}
							Mute
						</button>
					</div>

					<AnalysisAudioStatus state={analysisAudio} />
				</div>
			)}
		</div>
	);
}

function AnalysisAudioStatus({ state }: { state: LocalSong['analysisAudio'] }) {
	if (state.status === 'error') {
		return (
			<p role="alert" className="player-error">
				{state.message}
			</p>
		);
	}
	let text = '';
	if (state.status === 'waiting' || state.status === 'decoding')
		text = 'Preparing the audio for analysis…';
	if (state.status === 'ready') {
		const kHz = (state.audio.sampleRate / 1000).toLocaleString('en', {
			maximumFractionDigits: 1,
		});
		text = `Ready for analysis: ${formatTime(state.audio.duration)} decoded on this device (${kHz} kHz).`;
	}
	return (
		<p role="status" className="player-status">
			{text}
		</p>
	);
}
