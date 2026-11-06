import type { LocalSong } from '../../hooks/useLocalSong';
import type { SongAnalysis } from '../../hooks/useSongAnalysis';
import type { SongTimeline } from '../../hooks/useSongCorrections';
import { formatTime } from '../../services/audio';
import { formatFileSize } from '../../services/validation';
import { KeyTempoPanel } from './KeyTempoPanel';
import './analysis.css';

export interface SongInfoProps {
	song: LocalSong;
	analysis: SongAnalysis;
	timeline: SongTimeline;
}

/** Song Info: the file, and the full analysis with alternatives and its limits. */
export function SongInfo({ song, analysis, timeline }: SongInfoProps) {
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
			{file && (
				<section>
					<h3 className="analysis-subheading">Your corrections</h3>
					<p className="analysis-muted">
						{timeline.saved
							? 'Your corrections to the key, tempo and chords are saved in this browser only, with the file’s name and size. They come back when you open the same file, and running the analysis again keeps them.'
							: 'This browser isn’t saving data, so your corrections last until you close the page.'}
					</p>
					{timeline.corrected && (
						<div>
							<button type="button" className="btn" onClick={timeline.clearAll}>
								Remove all my corrections for this song
							</button>
						</div>
					)}
				</section>
			)}
			<section>
				<h3 className="analysis-subheading">Key and tempo estimate, in detail</h3>
				<KeyTempoPanel audio={song.analysisAudio} analysis={analysis} />
			</section>
		</div>
	);
}
