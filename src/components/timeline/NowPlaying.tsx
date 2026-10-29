import type { LocalSong } from '../../hooks/useLocalSong';
import { usePlaybackChord } from '../../hooks/usePlaybackChord';
import type { SongAnalysis } from '../../hooks/useSongAnalysis';
import type { ChordEvent } from '../../services/analysis';
import { formatTime } from '../../services/audio';
import { CONFIDENCE_WORDS, displayChord } from '../analysis';
import './timeline.css';

const NO_CHORDS: readonly ChordEvent[] = [];

export interface NowPlayingProps {
	song: LocalSong;
	analysis: SongAnalysis;
}

/** The chord playing now and the next change, large enough to read while playing. */
export function NowPlaying({ song, analysis }: NowPlayingProps) {
	const chords = analysis.state.status === 'done' ? analysis.state.result.chords : NO_CHORDS;
	const { current, next } = usePlaybackChord(song.controller, chords);
	const now = chords[current];
	const upcoming = chords[next];

	if (!song.song) return null;
	let empty = 'Chords appear after analysis.';
	if (analysis.state.status === 'failed') empty = 'No chords: the analysis didn’t finish.';
	if (analysis.state.status === 'done' && chords.length === 0) empty = 'No chords recognized.';

	return (
		<div className="now-playing" aria-live="polite">
			{chords.length === 0 ? (
				<p className="muted">{empty}</p>
			) : (
				<>
					<p className="now-playing-slot">
						<span className="now-playing-label">Now</span>
						<span className="now-playing-chord">
							{now?.chord ? displayChord(now.chord) : '—'}
						</span>
						{now?.chord && (
							<span className="tag">{CONFIDENCE_WORDS[now.confidence.level]}</span>
						)}
					</p>
					<p className="now-playing-slot">
						<span className="now-playing-label">Next</span>
						<span className="now-playing-chord now-playing-chord--next">
							{upcoming?.chord ? displayChord(upcoming.chord) : '—'}
						</span>
						{upcoming && <span className="muted">at {formatTime(upcoming.start)}</span>}
					</p>
				</>
			)}
		</div>
	);
}
