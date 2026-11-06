import { useId, useState, type FormEvent } from 'react';
import type { SongTimeline } from '../../hooks/useSongCorrections';
import { allKeys, parseBpm } from '../../services/corrections';
import { keyHeadline } from '../analysis';
import { Dialog } from '../layout';
import './chords.css';

export interface KeyTempoEditorProps {
	open: boolean;
	onClose(): void;
	timeline: SongTimeline;
}

const KEYS = allKeys();

/**
 * Corrects the song's key and tempo. The estimate stays visible next to each, and
 * "Use the estimate" removes the correction.
 */
export function KeyTempoEditor({ open, onClose, timeline }: KeyTempoEditorProps) {
	return (
		<Dialog title="Correct key and tempo" open={open} onClose={onClose}>
			<KeyTempoForm timeline={timeline} />
		</Dialog>
	);
}

function KeyTempoForm({ timeline }: { timeline: SongTimeline }) {
	const id = useId();
	const { key, tempo } = timeline;
	const [bpmText, setBpmText] = useState(tempo ? String(Math.round(tempo.bpm * 10) / 10) : '');
	const [tempoMessage, setTempoMessage] = useState<{ text: string; error: boolean } | null>(null);
	const keyValue = key ? `${key.tonic}:${key.mode}` : '';
	const keyEstimate = key?.estimate ?? null;
	const tempoEstimate = tempo?.estimate ?? null;

	const saveTempo = (bpmTextValue: string) => {
		const check = parseBpm(bpmTextValue);
		if (!check.ok) {
			setTempoMessage({ text: check.message, error: true });
			return;
		}
		timeline.setBpm(check.bpm);
		setBpmText(String(check.bpm));
		setTempoMessage({ text: `Tempo set to ${check.bpm} BPM.`, error: false });
	};

	return (
		<div className="chord-editor">
			<section className="chord-editor-section">
				<label className="field" htmlFor={`${id}-key-select`}>
					Key
				</label>
				<select
					id={`${id}-key-select`}
					className="chord-editor-input"
					value={keyValue}
					onChange={(e) => {
						const [tonic, mode] = e.target.value.split(':');
						const match = KEYS.find(
							(k) => `${k.tonic}:${k.mode}` === `${tonic}:${mode}`,
						);
						if (match) timeline.setKey({ tonic: match.tonic, mode: match.mode });
					}}
				>
					{!key && <option value="">Choose a key</option>}
					{KEYS.map((k) => (
						<option key={`${k.tonic}:${k.mode}`} value={`${k.tonic}:${k.mode}`}>
							{k.name}
						</option>
					))}
				</select>
				<p className="muted" role="status">
					{key?.source === 'user'
						? `You set the key${keyEstimate ? `; the estimate was ${keyHeadline(keyEstimate)}` : ''}.`
						: keyEstimate
							? `Estimate: ${keyHeadline(keyEstimate)}. Also possible: ${keyEstimate.alternatives.map((k) => k.name).join(', ')}.`
							: 'The analysis didn’t find a key.'}
				</p>
				{key?.source === 'auto' && keyEstimate && (
					<div className="chord-editor-row">
						<button
							type="button"
							className="btn"
							onClick={() =>
								timeline.setKey({
									tonic: keyEstimate.tonic,
									mode: keyEstimate.mode,
								})
							}
						>
							{keyEstimate.name} is right
						</button>
						{keyEstimate.alternatives.slice(0, 2).map((alt) => (
							<button
								key={alt.name}
								type="button"
								className="btn"
								onClick={() =>
									timeline.setKey({ tonic: alt.tonic, mode: alt.mode })
								}
							>
								Use {alt.name}
							</button>
						))}
					</div>
				)}
				{key?.source === 'user' && (
					<div className="chord-editor-row">
						<button type="button" className="btn" onClick={() => timeline.setKey(null)}>
							Use the estimate
						</button>
					</div>
				)}
			</section>

			<form
				className="chord-editor-section"
				onSubmit={(e: FormEvent) => {
					e.preventDefault();
					saveTempo(bpmText);
				}}
			>
				<label className="field" htmlFor={`${id}-bpm`}>
					Tempo (beats per minute)
				</label>
				<div className="chord-editor-row">
					<input
						id={`${id}-bpm`}
						type="text"
						inputMode="decimal"
						className="chord-editor-input chord-editor-input--time"
						value={bpmText}
						autoComplete="off"
						aria-invalid={bpmText.trim() !== '' && !parseBpm(bpmText).ok}
						onChange={(e) => setBpmText(e.target.value)}
					/>
					<button type="submit" className="btn btn--primary">
						Save tempo
					</button>
					{tempo && (
						<>
							<button
								type="button"
								className="btn"
								onClick={() => saveTempo(String(tempo.bpm / 2))}
							>
								Half
							</button>
							<button
								type="button"
								className="btn"
								onClick={() => saveTempo(String((tempo.bpm * 2) / 3))}
							>
								×⅔ (shuffle)
							</button>
							<button
								type="button"
								className="btn"
								onClick={() => saveTempo(String(tempo.bpm * 2))}
							>
								Double
							</button>
						</>
					)}
				</div>
				<p className="muted">
					{tempoEstimate
						? `Estimate: ${Math.round(tempoEstimate.bpm)} BPM. In a shuffle, the analysis may count the triplets; ×⅔ fixes that.`
						: 'The analysis didn’t find a steady beat.'}
				</p>
				{tempo?.source === 'user' && (
					<div className="chord-editor-row">
						<button
							type="button"
							className="btn"
							onClick={() => {
								timeline.setBpm(null);
								setBpmText(tempoEstimate ? String(tempoEstimate.bpm) : '');
								setTempoMessage(null);
							}}
						>
							Use the estimate
						</button>
					</div>
				)}
				{tempoMessage && (
					<p
						role={tempoMessage.error ? 'alert' : 'status'}
						className={tempoMessage.error ? 'error-text' : 'muted'}
					>
						{tempoMessage.text}
					</p>
				)}
			</form>
		</div>
	);
}
