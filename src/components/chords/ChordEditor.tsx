import { useId, useState, type FormEvent } from 'react';
import type { SongTimeline } from '../../hooks/useSongCorrections';
import { formatPreciseTime, parseTime, type PlaybackController } from '../../services/audio';
import {
	addChordChange,
	confirmChord,
	normalizeChord,
	removeChord,
	revertChord,
	setChordLabel,
	setChordTiming,
	type EditResult,
	type TimelineChord,
} from '../../services/corrections';
import { chordIndexAt, loopForChords, type LoopRange } from '../../services/progression';
import { displayChord, sourceWords } from '../analysis';
import { Dialog } from '../layout';
import './chords.css';

/** What the editor is open for: a chord on the timeline (found by a time inside it), or a new change. */
export type ChordEditorTarget = { kind: 'edit'; anchor: number } | { kind: 'add'; time: number };

export interface ChordEditorProps {
	target: ChordEditorTarget | null;
	onTargetChange(target: ChordEditorTarget | null): void;
	timeline: SongTimeline;
	controller: PlaybackController;
	duration: number;
	onLoop(loop: LoopRange): void;
}

const CHORD_HINT = 'Like A, Am, A7, Am7, Cmaj7, Dsus4 or F#m7b5. Leave it empty for “no chord”.';

/** Reads the chord box: a chord symbol, empty for no chord, or an error. */
function readChord(text: string): { ok: true; chord: string | null } | { ok: false } {
	if (text.trim() === '') return { ok: true, chord: null };
	const chord = normalizeChord(text);
	return chord ? { ok: true, chord } : { ok: false };
}

/** The middle of a chord: a time that stays inside it when its neighbours change. */
function middle(event: { start: number; end: number }): number {
	return (event.start + event.end) / 2;
}

/**
 * Corrects one chord, or adds a chord change: its name, its start and end, checking
 * an estimate, removing a change, undoing the user's edits, and looping it. Every
 * edit goes to the correction layer; the analysis result is never changed.
 */
export function ChordEditor({
	target,
	onTargetChange,
	timeline,
	controller,
	duration,
	onLoop,
}: ChordEditorProps) {
	const chords = timeline.chords;
	const index = target?.kind === 'edit' ? chordIndexAt(chords, target.anchor) : -1;
	const event = chords[index];
	const title = target?.kind === 'add' ? 'Add a chord change' : 'Edit chord';
	// Kept here, not in the form, so it survives the form being rebuilt after an edit.
	const [message, setMessage] = useState<Message | null>(null);
	const close = () => {
		setMessage(null);
		onTargetChange(null);
	};
	const nextToReview = chords.findIndex((e, i) => i > index && e.needsReview);

	/** Applies an edit; returns its error message, or null once it's applied. */
	const apply = (result: EditResult, anchor?: number): string | null => {
		if (!result.ok) return result.message;
		timeline.setChords(result.chords);
		if (anchor !== undefined) onTargetChange({ kind: 'edit', anchor });
		return null;
	};

	return (
		<Dialog title={title} open={target !== null} onClose={close}>
			{target?.kind === 'add' && (
				<AddChange
					time={target.time}
					onAdd={(time, chord) =>
						apply(
							addChordChange(
								chords,
								timeline.corrections.chords,
								time,
								chord,
								duration,
							),
							time + 0.01,
						)
					}
				/>
			)}
			{target?.kind === 'edit' &&
				(event ? (
					<EditChord
						// A fresh form whenever the chord itself changes, so the boxes show its new values.
						key={`${event.start}:${event.end}:${event.chord ?? ''}`}
						event={event}
						index={index}
						count={chords.length}
						controller={controller}
						onLabel={(chord) =>
							apply(setChordLabel(chords, timeline.corrections.chords, index, chord))
						}
						onConfirm={() =>
							apply(confirmChord(chords, timeline.corrections.chords, index))
						}
						onTiming={(start, end) =>
							apply(
								setChordTiming(
									chords,
									timeline.corrections.chords,
									index,
									start,
									end,
									duration,
								),
								(start + end) / 2,
							)
						}
						onRemove={() => {
							const previous = chords[index - 1];
							const anchor = previous ? middle(previous) : middle(event);
							return apply(
								removeChord(chords, timeline.corrections.chords, index),
								anchor,
							);
						}}
						onRevert={() =>
							apply(revertChord(chords, timeline.corrections.chords, index))
						}
						onLoop={() => {
							const loop = loopForChords(chords, index, index, duration);
							if (loop) {
								onLoop(loop);
								controller.seek(loop.start);
							}
						}}
						onPlay={() => controller.seek(event.start)}
						onNextReview={
							nextToReview === -1
								? undefined
								: () => {
										const next = chords[nextToReview];
										if (!next) return;
										setMessage(null);
										controller.seek(next.start);
										onTargetChange({ kind: 'edit', anchor: middle(next) });
									}
						}
						message={message}
						onMessage={setMessage}
					/>
				) : (
					<p className="muted">This chord isn’t on the timeline any more.</p>
				))}
		</Dialog>
	);
}

interface Message {
	text: string;
	error: boolean;
}

interface EditChordProps {
	event: TimelineChord;
	index: number;
	count: number;
	controller: PlaybackController;
	onLabel(chord: string | null): string | null;
	onConfirm(): string | null;
	onTiming(start: number, end: number): string | null;
	onRemove(): string | null;
	onRevert(): string | null;
	onLoop(): void;
	onPlay(): void;
	/** Opens the next chord that needs review; absent when there is none. */
	onNextReview: (() => void) | undefined;
	message: Message | null;
	onMessage(message: Message | null): void;
}

function EditChord({
	event,
	index,
	count,
	controller,
	onLabel,
	onConfirm,
	onTiming,
	onRemove,
	onRevert,
	onLoop,
	onPlay,
	onNextReview,
	message,
	onMessage: setMessage,
}: EditChordProps) {
	const id = useId();
	const [chordText, setChordText] = useState(event.chord ? displayChord(event.chord) : '');
	const [startText, setStartText] = useState(formatPreciseTime(event.start));
	const [endText, setEndText] = useState(formatPreciseTime(event.end));
	const chordCheck = readChord(chordText);
	const name = event.chord ? displayChord(event.chord) : 'No chord';

	const report = (error: string | null, done: string) =>
		setMessage(error ? { text: error, error: true } : { text: done, error: false });

	const saveChord = (e: FormEvent) => {
		e.preventDefault();
		if (!chordCheck.ok) {
			setMessage({
				text: `That isn’t a chord name this app knows. ${CHORD_HINT}`,
				error: true,
			});
			return;
		}
		report(onLabel(chordCheck.chord), 'Chord saved.');
	};

	const saveTiming = (e: FormEvent) => {
		e.preventDefault();
		const start = parseTime(startText);
		const end = parseTime(endText);
		if (start === null || end === null) {
			setMessage({
				text: 'Enter the times as seconds or minutes:seconds, like 1:05.5.',
				error: true,
			});
			return;
		}
		report(onTiming(start, end), 'Timing saved.');
	};

	const playhead = () => formatPreciseTime(controller.getCurrentTime());

	return (
		<div className="chord-editor">
			<p className="chord-editor-summary">
				<strong className="chord-editor-name">{name}</strong>{' '}
				<span>
					{formatPreciseTime(event.start)} to {formatPreciseTime(event.end)}
				</span>{' '}
				<span className="muted">
					(chord {index + 1} of {count})
				</span>
			</p>
			<p className="muted">
				{event.confidence === null
					? 'You set this chord.'
					: `Estimate: ${sourceWords(event)}${event.edited ? ', partly corrected by you' : ''}.`}
				{event.needsReview && (
					<strong className="chord-editor-review"> Needs review.</strong>
				)}
			</p>

			<form className="chord-editor-section" onSubmit={saveChord}>
				<label className="field" htmlFor={`${id}-chord`}>
					Chord
				</label>
				<div className="chord-editor-row">
					<input
						id={`${id}-chord`}
						type="text"
						className="chord-editor-input"
						value={chordText}
						autoComplete="off"
						spellCheck={false}
						aria-invalid={!chordCheck.ok}
						aria-describedby={`${id}-chord-hint`}
						onChange={(e) => setChordText(e.target.value)}
					/>
					<button type="submit" className="btn btn--primary">
						Save chord
					</button>
				</div>
				<p id={`${id}-chord-hint`} className="muted chord-editor-hint">
					{CHORD_HINT}
				</p>
				{event.alternatives.length > 0 && (
					<div
						className="chord-editor-row"
						role="group"
						aria-label="Other chords the analysis heard"
					>
						<span className="muted">The analysis also heard:</span>
						{event.alternatives.map((alt) => (
							<button
								key={alt}
								type="button"
								className="btn"
								onClick={() => {
									setChordText(displayChord(alt));
									report(onLabel(alt), `Changed to ${displayChord(alt)}.`);
								}}
							>
								Use {displayChord(alt)}
							</button>
						))}
					</div>
				)}
				{event.needsReview && (
					<button
						type="button"
						className="btn"
						onClick={() => report(onConfirm(), 'Marked as checked.')}
					>
						{name} is right
					</button>
				)}
			</form>

			<form className="chord-editor-section" onSubmit={saveTiming}>
				<fieldset className="chord-editor-times">
					<legend>Timing (minutes:seconds)</legend>
					<TimeField
						label="Starts at"
						value={startText}
						onChange={setStartText}
						onPlayhead={() => setStartText(playhead())}
					/>
					<TimeField
						label="Ends at"
						value={endText}
						onChange={setEndText}
						onPlayhead={() => setEndText(playhead())}
					/>
				</fieldset>
				<p className="muted chord-editor-hint">
					The chords next to it grow or shrink to fill the gap.
				</p>
				<div className="chord-editor-row">
					<button type="submit" className="btn btn--primary">
						Save timing
					</button>
				</div>
			</form>

			<div className="chord-editor-section chord-editor-row" role="group" aria-label="More">
				<button type="button" className="btn" onClick={onPlay}>
					Play from here
				</button>
				<button type="button" className="btn" onClick={onLoop}>
					Loop this chord
				</button>
				<button
					type="button"
					className="btn"
					onClick={() => report(onRemove(), 'Chord change removed.')}
				>
					Remove this change
				</button>
				{event.edited && (
					<button
						type="button"
						className="btn"
						onClick={() => report(onRevert(), 'Back to the estimate.')}
					>
						Undo my edits here
					</button>
				)}
				{onNextReview && (
					<button type="button" className="btn" onClick={onNextReview}>
						Next chord to review
					</button>
				)}
			</div>

			{message && (
				<p
					role={message.error ? 'alert' : 'status'}
					className={message.error ? 'error-text' : 'muted'}
				>
					{message.text}
				</p>
			)}
		</div>
	);
}

function TimeField({
	label,
	value,
	onChange,
	onPlayhead,
}: {
	label: string;
	value: string;
	onChange(value: string): void;
	onPlayhead(): void;
}) {
	const id = useId();
	const invalid = parseTime(value) === null;
	return (
		<div className="chord-editor-time">
			<label className="field" htmlFor={id}>
				{label}
			</label>
			<div className="chord-editor-row">
				<input
					id={id}
					type="text"
					inputMode="decimal"
					className="chord-editor-input chord-editor-input--time"
					value={value}
					autoComplete="off"
					aria-invalid={invalid}
					onChange={(e) => onChange(e.target.value)}
				/>
				<button
					type="button"
					className="btn btn--ghost"
					onClick={onPlayhead}
					aria-label={`${label}: use the playhead`}
				>
					Use playhead
				</button>
			</div>
		</div>
	);
}

function AddChange({
	time,
	onAdd,
}: {
	time: number;
	onAdd(time: number, chord: string | null): string | null;
}) {
	const id = useId();
	const [timeText, setTimeText] = useState(formatPreciseTime(time));
	const [chordText, setChordText] = useState('');
	const [error, setError] = useState<string | null>(null);
	const chordCheck = readChord(chordText);

	const submit = (e: FormEvent) => {
		e.preventDefault();
		const at = parseTime(timeText);
		if (at === null) {
			setError('Enter the time as seconds or minutes:seconds, like 1:05.5.');
			return;
		}
		if (!chordCheck.ok || chordText.trim() === '') {
			setError(`Enter a chord name. ${CHORD_HINT.split('.')[0]}.`);
			return;
		}
		setError(onAdd(at, chordCheck.chord));
	};

	return (
		<form className="chord-editor" onSubmit={submit}>
			<p className="muted">The new chord plays from this time until the next chord change.</p>
			<label className="field" htmlFor={`${id}-time`}>
				Starts at (minutes:seconds)
			</label>
			<input
				id={`${id}-time`}
				type="text"
				inputMode="decimal"
				className="chord-editor-input chord-editor-input--time"
				value={timeText}
				autoComplete="off"
				aria-invalid={parseTime(timeText) === null}
				onChange={(e) => setTimeText(e.target.value)}
			/>
			<label className="field" htmlFor={`${id}-chord`}>
				Chord
			</label>
			<input
				id={`${id}-chord`}
				type="text"
				className="chord-editor-input"
				value={chordText}
				autoComplete="off"
				spellCheck={false}
				aria-invalid={chordText.trim() !== '' && !chordCheck.ok}
				onChange={(e) => setChordText(e.target.value)}
			/>
			<div className="chord-editor-row">
				<button type="submit" className="btn btn--primary">
					Add chord
				</button>
			</div>
			{error && (
				<p role="alert" className="error-text">
					{error}
				</p>
			)}
		</form>
	);
}
