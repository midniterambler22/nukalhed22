import type { SongAnalysis } from '../../hooks/useSongAnalysis';
import { describeTime, formatTime } from '../../services/audio';
import { CONFIDENCE_WORDS, chordShares, displayChord } from './describe';
import './analysis.css';

export interface ChordListProps {
	analysis: SongAnalysis;
	/** Moves playback to a time in seconds. */
	onSeek(seconds: number): void;
}

const MAIN_CHORDS = 6;

/**
 * Chords region: the estimated chords in time order. Each change is a button that
 * moves playback there. Following the current chord during playback is Phase 5.
 */
export function ChordList({ analysis, onSeek }: ChordListProps) {
	const { state } = analysis;
	if (state.status !== 'done') {
		const text =
			state.status === 'analyzing'
				? 'Chords appear when the analysis finishes.'
				: state.status === 'failed'
					? 'No chords: the analysis didn’t finish.'
					: 'Choose a song to estimate its chords.';
		return <p className="analysis-muted">{text}</p>;
	}
	const events = state.result.chords;
	const shares = chordShares(events).slice(0, MAIN_CHORDS);
	if (shares.length === 0) {
		return <p className="analysis-muted">No chords were recognized in this song.</p>;
	}
	return (
		<div className="analysis">
			<p>
				<span className="analysis-label">Main chords (estimated): </span>
				{shares.map((s, i) => (
					<span key={s.chord}>
						{i > 0 && ', '}
						<strong>{displayChord(s.chord)}</strong> {Math.round(s.share * 100)}%
					</span>
				))}
			</p>
			<p className="analysis-muted">
				Select a chord to play from there. Uncertain chords are marked with “?”. Following
				the current chord as the song plays, and fixing chords, come in the next phase.
			</p>
			<ol className="analysis-chords" aria-label="Chord changes">
				{events.map((event) => {
					const name = event.chord ? displayChord(event.chord) : 'No chord';
					const word = CONFIDENCE_WORDS[event.confidence.level];
					const alternatives =
						event.confidence.level !== 'high' && event.alternatives.length > 0
							? `, or ${event.alternatives.map(displayChord).join(' or ')}`
							: '';
					return (
						<li key={event.start}>
							<button
								type="button"
								className={`analysis-chord analysis-chord--${event.confidence.level}`}
								onClick={() => onSeek(event.start)}
								aria-label={`${describeTime(event.start)}: ${name}${event.chord ? `, ${word}${alternatives}` : ''}`}
							>
								<span className="analysis-chord-time">
									{formatTime(event.start)}
								</span>
								<span className="analysis-chord-name">
									{name}
									{event.chord && event.confidence.level === 'low' && (
										<span aria-hidden="true">?</span>
									)}
								</span>
							</button>
						</li>
					);
				})}
			</ol>
		</div>
	);
}
