import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import type { LocalSong } from '../../hooks/useLocalSong';
import { formatTime } from '../../services/audio';
import { createDemoSongFile, DEMO_SONG } from '../../services/demo';
import {
	AUDIO_FILE_ACCEPT,
	formatFileSize,
	MAX_AUDIO_FILE_BYTES,
	supportedFormatList,
} from '../../services/validation';
import './player.css';

export interface SongImportProps {
	song: LocalSong;
	/** Makes the demo file; tests pass a small fake. */
	createDemo?: () => File;
}

/**
 * Choosing a song: pick or drop a local file, or make the demo song. Shows the loaded
 * song's name and every loading and error state. Nothing is uploaded.
 */
export function SongImport({ song, createDemo = createDemoSongFile }: SongImportProps) {
	const { playback, analysisAudio } = song;
	const inputRef = useRef<HTMLInputElement>(null);
	const [dragging, setDragging] = useState(false);
	const [makingDemo, setMakingDemo] = useState(false);
	const isDemo = song.song?.name === DEMO_SONG.fileName;

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

	function openDemo() {
		setMakingDemo(true);
		// Let the "Making…" state paint before the synthesis blocks the thread briefly.
		setTimeout(() => {
			song.openFile(createDemo());
			setMakingDemo(false);
		}, 30);
	}

	return (
		<div
			className={dragging ? 'player is-dragging' : 'player'}
			onDragOver={handleDragOver}
			onDragLeave={() => setDragging(false)}
			onDrop={handleDrop}
		>
			{song.song ? (
				<p className="player-title">
					<strong>{isDemo ? DEMO_SONG.title : song.song.name}</strong>
					<span className="player-meta">
						{isDemo
							? 'Synthesized in this browser; its analysis is a real estimate'
							: `${song.song.format.label} · ${formatFileSize(song.song.size)}`}
					</span>
				</p>
			) : (
				<p className="player-title">
					<strong>No song loaded</strong>
					<span className="player-meta">
						Choose a song or drop an audio file here, or try the demo.
					</span>
				</p>
			)}

			<div className="player-actions">
				<button
					type="button"
					className="btn btn--primary"
					onClick={() => inputRef.current?.click()}
				>
					{song.song ? 'Choose another song' : 'Choose a song'}
				</button>
				{!isDemo && (
					<button type="button" className="btn" disabled={makingDemo} onClick={openDemo}>
						{makingDemo ? 'Making the demo…' : 'Try the demo song'}
					</button>
				)}
				<input
					ref={inputRef}
					type="file"
					accept={AUDIO_FILE_ACCEPT}
					hidden
					data-testid="song-file-input"
					onChange={handleInput}
				/>
			</div>
			{!song.song && (
				<p className="player-hint">
					{supportedFormatList()}, up to {formatFileSize(MAX_AUDIO_FILE_BYTES)}. Your song
					stays on this device: it plays and is analyzed in this browser and is never
					uploaded.
				</p>
			)}

			{song.fileError && (
				<p role="alert" className="error-text">
					{song.fileError}
				</p>
			)}
			{song.song && playback.status === 'loading' && (
				<p role="status" className="muted">
					Loading the song…
				</p>
			)}
			{song.song && playback.error && (
				<p role="alert" className="error-text">
					{playback.error}
				</p>
			)}
			{song.song && <AnalysisAudioStatus state={analysisAudio} />}
		</div>
	);
}

function AnalysisAudioStatus({ state }: { state: LocalSong['analysisAudio'] }) {
	if (state.status === 'error') {
		return (
			<p role="alert" className="error-text">
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
		<p role="status" className="muted player-status">
			{text}
		</p>
	);
}
