import type { SongAnalysis } from '../../hooks/useSongAnalysis';
import type { SongTimeline } from '../../hooks/useSongCorrections';
import { describeTime, formatTime } from '../../services/audio';
import { isChordSymbol, romanNumeral } from '../../services/music-theory';
import { chordColorSlots, chordShares, displayChord, sourceWords } from './describe';
import './analysis.css';

export interface ChordListProps {
	analysis: SongAnalysis;
	/** The chords with the user's corrections laid over the estimate. */
	timeline: SongTimeline;
	/** Moves playback to a time in seconds. */
	onSeek(seconds: number): void;
	/** Index of the chord playing now, from the playback clock; -1 for none. */
	currentIndex?: number;
	/** Opens the editor for a chord. Without it the list is read-only. */
	onEdit?: ((index: number) => void) | undefined;
	/** Opens the editor to add a chord change at the playhead. */
	onAdd?: (() => void) | undefined;
}

const MAIN_CHORDS = 6;

/**
 * Chords in time order, with the user's corrections. Each change is a button that
 * moves playback there, with an Edit button beside it; the chord playing now is
 * marked, and estimates the user should check say "Needs review". The function
 * (I, IV, V…) is shown only once the key is likely or set by the user.
 */
export function ChordList({
	analysis,
	timeline,
	onSeek,
	currentIndex = -1,
	onEdit,
	onAdd,
}: ChordListProps) {
	const { state } = analysis;
	const events = timeline.chords;
	const addButton = onAdd && (
		<button type="button" className="btn" onClick={onAdd}>
			Add a chord at the playhead
		</button>
	);

	if (events.length === 0) {
		let text = 'Choose a song to estimate its chords.';
		if (state.status === 'analyzing') text = 'Chords appear when the analysis finishes.';
		if (state.status === 'failed')
			text = 'No chords: the analysis didn’t finish. You can enter them by hand.';
		if (state.status === 'done')
			text = 'No chords were recognized in this song. You can enter them by hand.';
		return (
			<div className="analysis">
				<p className="analysis-muted">{text}</p>
				{(state.status === 'failed' || state.status === 'done') && addButton}
			</div>
		);
	}

	const shares = chordShares(events).slice(0, MAIN_CHORDS);
	const slots = chordColorSlots(events);
	const { key } = timeline;
	const tonic =
		key && (key.source === 'user' || key.confidence?.level === 'high') ? key.tonic : undefined;
	const functionOf = (chord: string) =>
		tonic !== undefined && isChordSymbol(chord) ? romanNumeral(chord, tonic) : '';
	const toReview = events.filter((e) => e.needsReview).length;
	const reviewNext = () => {
		const after = events.findIndex((e, i) => i > currentIndex && e.needsReview);
		const index = after !== -1 ? after : events.findIndex((e) => e.needsReview);
		if (index === -1 || !onEdit) return;
		const event = events[index];
		if (event) onSeek(event.start);
		onEdit(index);
	};

	return (
		<div className="analysis">
			{shares.length > 0 && (
				<p>
					<span className="analysis-label">Main chords: </span>
					{shares.map((s, i) => (
						<span key={s.chord}>
							{i > 0 && ', '}
							<strong>{displayChord(s.chord)}</strong> {Math.round(s.share * 100)}%
						</span>
					))}
				</p>
			)}
			<p className="analysis-muted">
				Select a chord to play from there, or Edit to correct it.
				{tonic === undefined && ' Chord functions show once the key is likely.'}
			</p>
			{toReview > 0 ? (
				<div className="chord-review">
					<p role="status">
						<strong>
							{toReview} {toReview === 1 ? 'chord needs' : 'chords need'} review
						</strong>
						: the analysis wasn’t sure.
					</p>
					{onEdit && (
						<button type="button" className="btn" onClick={reviewNext}>
							Review next
						</button>
					)}
				</div>
			) : (
				state.status === 'done' && (
					<p className="analysis-muted" role="status">
						Every chord is likely or checked by you.
					</p>
				)
			)}
			<ol className="analysis-chords" aria-label="Chord changes">
				{events.map((event, index) => {
					const name = event.chord ? displayChord(event.chord) : 'No chord';
					const level = event.confidence?.level ?? 'high';
					const words = event.chord ? `, ${sourceWords(event)}` : '';
					const alternatives =
						event.needsReview && event.alternatives.length > 0
							? `, or ${event.alternatives.map(displayChord).join(' or ')}`
							: '';
					const fn = event.chord ? functionOf(event.chord) : '';
					const isCurrent = index === currentIndex;
					const status = event.needsReview
						? 'Needs review'
						: event.edited
							? 'Edited'
							: '';
					return (
						<li key={event.start} className="analysis-chord-row">
							<button
								type="button"
								className={[
									'analysis-chord',
									`analysis-chord--${level}`,
									event.chord ? `chord-color-${slots.get(event.chord) ?? 0}` : '',
									isCurrent ? 'is-current' : '',
								].join(' ')}
								aria-current={isCurrent ? 'true' : undefined}
								onClick={() => onSeek(event.start)}
								aria-label={`${describeTime(event.start)}: ${name}${words}${alternatives}${fn ? `, function ${fn}` : ''}${status ? `, ${status.toLowerCase()}` : ''}${isCurrent ? ', playing now' : ''}`}
							>
								<span className="analysis-chord-marker" aria-hidden="true" />
								<span className="analysis-chord-time">
									{formatTime(event.start)}
								</span>
								<span className="analysis-chord-name">
									{name}
									{event.needsReview && <span aria-hidden="true">?</span>}
								</span>
								<span className="analysis-chord-function">{fn}</span>
								<span className="analysis-chord-flags" aria-hidden="true">
									{isCurrent && <span className="analysis-chord-now">Now</span>}
									{status && (
										<span
											className={
												event.needsReview
													? 'analysis-flag analysis-flag--review'
													: 'analysis-flag'
											}
										>
											{status}
										</span>
									)}
								</span>
							</button>
							{onEdit && (
								<button
									type="button"
									className="btn btn--ghost analysis-chord-edit"
									onClick={() => onEdit(index)}
									aria-label={`Edit ${name} at ${describeTime(event.start)}`}
								>
									Edit
								</button>
							)}
						</li>
					);
				})}
			</ol>
			{addButton}
		</div>
	);
}
