import type { SongAnalysis } from '../../hooks/useSongAnalysis';
import { describeTime, formatTime } from '../../services/audio';
import { isChordSymbol, romanNumeral } from '../../services/music-theory';
import { CONFIDENCE_WORDS, chordColorSlots, chordShares, displayChord } from './describe';
import './analysis.css';

export interface ChordListProps {
	analysis: SongAnalysis;
	/** Moves playback to a time in seconds. */
	onSeek(seconds: number): void;
	/** Index of the chord playing now, from the playback clock; -1 for none. */
	currentIndex?: number;
}

const MAIN_CHORDS = 6;

/**
 * Detected chords in time order. Each change is a button that moves playback there;
 * the chord playing now is marked. The function (I, IV, V…) is shown only when the
 * key estimate is "likely", since it depends on the key.
 */
export function ChordList({ analysis, onSeek, currentIndex = -1 }: ChordListProps) {
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
	const { chords: events, key } = state.result;
	const shares = chordShares(events).slice(0, MAIN_CHORDS);
	if (shares.length === 0) {
		return <p className="analysis-muted">No chords were recognized in this song.</p>;
	}
	const slots = chordColorSlots(events);
	const tonic = key?.confidence.level === 'high' ? key.tonic : undefined;
	const functionOf = (chord: string) =>
		tonic !== undefined && isChordSymbol(chord) ? romanNumeral(chord, tonic) : '';

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
				Select a chord to play from there. Uncertain chords are marked “?”.
				{tonic === undefined && ' Chord functions show once the key is likely.'}
			</p>
			<ol className="analysis-chords" aria-label="Chord changes">
				{events.map((event, index) => {
					const name = event.chord ? displayChord(event.chord) : 'No chord';
					const word = CONFIDENCE_WORDS[event.confidence.level];
					const alternatives =
						event.confidence.level !== 'high' && event.alternatives.length > 0
							? `, or ${event.alternatives.map(displayChord).join(' or ')}`
							: '';
					const fn = event.chord ? functionOf(event.chord) : '';
					const isCurrent = index === currentIndex;
					return (
						<li key={event.start}>
							<button
								type="button"
								className={[
									'analysis-chord',
									`analysis-chord--${event.confidence.level}`,
									event.chord ? `chord-color-${slots.get(event.chord) ?? 0}` : '',
									isCurrent ? 'is-current' : '',
								].join(' ')}
								aria-current={isCurrent ? 'true' : undefined}
								onClick={() => onSeek(event.start)}
								aria-label={`${describeTime(event.start)}: ${name}${event.chord ? `, ${word}${alternatives}` : ''}${fn ? `, function ${fn}` : ''}${isCurrent ? ', playing now' : ''}`}
							>
								<span className="analysis-chord-marker" aria-hidden="true" />
								<span className="analysis-chord-time">
									{formatTime(event.start)}
								</span>
								<span className="analysis-chord-name">
									{name}
									{event.chord && event.confidence.level === 'low' && (
										<span aria-hidden="true">?</span>
									)}
								</span>
								<span className="analysis-chord-function">{fn}</span>
								{isCurrent && <span className="analysis-chord-now">Now</span>}
							</button>
						</li>
					);
				})}
			</ol>
		</div>
	);
}
