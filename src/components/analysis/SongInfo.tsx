import type { LocalSong } from '../../hooks/useLocalSong';
import type { SongAnalysis } from '../../hooks/useSongAnalysis';
import { formatTime } from '../../services/audio';
import { formatFileSize } from '../../services/validation';
import { KeyTempoPanel } from './KeyTempoPanel';
import './analysis.css';

export interface SongInfoProps {
	song: LocalSong;
	analysis: SongAnalysis;
}

/** Song Info: the file, and the full analysis with alternatives and its limits. */
export function SongInfo({ song, analysis }: SongInfoProps) {
	const file = song.song;
	return (
		<div className="song-info">
			<section>
				<h3 className="analysis-subheading">File</h3>
				{file ? (
					<dl className="analysis-summary">
						<div>
							<dt>Name</dt>
							<dd>{file.name}</dd>
						</div>
						<div>
							<dt>Format</dt>
							<dd>{file.format.label}</dd>
						</div>
						<div>
							<dt>Size</dt>
							<dd>{formatFileSize(file.size)}</dd>
						</div>
						<div>
							<dt>Length</dt>
							<dd>
								{song.playback.duration > 0
									? formatTime(song.playback.duration)
									: '…'}
							</dd>
						</div>
						<div>
							<dt>Where it’s processed</dt>
							<dd>On this device only; never uploaded</dd>
						</div>
					</dl>
				) : (
					<p className="analysis-muted">No song loaded.</p>
				)}
			</section>
			<section>
				<h3 className="analysis-subheading">Key and tempo, in detail</h3>
				<KeyTempoPanel audio={song.analysisAudio} analysis={analysis} />
			</section>
		</div>
	);
}
