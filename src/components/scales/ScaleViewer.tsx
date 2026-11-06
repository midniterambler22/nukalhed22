import { useId } from 'react';
import type { RegisterChoice, ScaleViewerState } from '../../hooks/useScaleViewer';
import { ALL_BOXES } from '../../hooks/useScaleViewer';
import {
	formatPitch,
	midiToPitch,
	SCALE_CATEGORIES,
	scalesInCategory,
	type ScaleId,
} from '../../services/music-theory';
import { Fretboard, FretboardLegend } from '../fretboard';
import { roleWords, shapeWords } from '../fretboard/describe';
import './scales.css';

const KEY_NAMES = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const KEY_LABELS: Readonly<Record<string, string>> = Object.fromEntries(
	KEY_NAMES.map((name) => [name, name.replace('#', '♯').replace('b', '♭')]),
);

const REGISTER_CHOICES: readonly { value: RegisterChoice; label: string }[] = [
	{ value: 'low', label: 'Low' },
	{ value: 'middle', label: 'Middle' },
	{ value: 'high', label: 'High' },
	{ value: 'all', label: 'All' },
];

export interface ScaleViewerProps {
	viewer: ScaleViewerState;
}

/** Scale Viewer: pick a key, scale, register and boxes, and see them on a large neck. */
export function ScaleViewer({ viewer }: ScaleViewerProps) {
	const id = useId();
	const { instrumentResult, hasBoxes, boxes, positions, selected, shownPositions, allPositions } =
		viewer;
	const singleBox = hasBoxes && boxes.length === 1;

	return (
		<div className="scale-viewer">
			<header className="scale-viewer-head">
				<h3 className="scale-viewer-title">
					{viewer.keyLabel} {viewer.scaleName}
				</h3>
				<dl className="scale-viewer-facts">
					<div>
						<dt>Formula</dt>
						<dd>{viewer.formula.join(' ')}</dd>
					</div>
					<div>
						<dt>Notes</dt>
						<dd>
							{viewer.scaleNotes.map((n) => viewer.noteName(n.pitchClass)).join(' ')}
						</dd>
					</div>
					<div>
						<dt>Positions</dt>
						<dd>
							{hasBoxes
								? `5 boxes, ${allPositions.length} places on this neck`
								: 'Every note (boxes for this scale come later)'}
						</dd>
					</div>
				</dl>
			</header>

			<div className="scale-viewer-controls">
				<label className="field">
					Key
					<select
						value={viewer.keyName}
						onChange={(e) => viewer.setKeyName(e.target.value)}
					>
						{KEY_NAMES.map((name) => (
							<option key={name} value={name}>
								{KEY_LABELS[name]}
							</option>
						))}
					</select>
				</label>
				<label className="field">
					Scale
					<select
						value={viewer.scaleId}
						onChange={(e) => viewer.setScaleId(e.target.value as ScaleId)}
					>
						{SCALE_CATEGORIES.map((category) => (
							<optgroup key={category.id} label={category.name}>
								{scalesInCategory(category.id).map((scale) => (
									<option key={scale.id} value={scale.id}>
										{scale.name}
									</option>
								))}
							</optgroup>
						))}
					</select>
				</label>
				<fieldset className="scale-viewer-group">
					<legend>Register</legend>
					<div className="segmented">
						{REGISTER_CHOICES.map((choice) => (
							<button
								key={choice.value}
								type="button"
								className="btn"
								aria-pressed={viewer.register === choice.value}
								onClick={() => viewer.setRegister(choice.value)}
							>
								{choice.label}
							</button>
						))}
					</div>
				</fieldset>
				{hasBoxes && (
					<fieldset className="scale-viewer-group">
						<legend>Boxes</legend>
						<div className="segmented">
							{ALL_BOXES.map((number) => (
								<button
									key={number}
									type="button"
									className="btn"
									aria-pressed={boxes.includes(number)}
									onClick={() => viewer.toggleBox(number)}
								>
									Box {number}
								</button>
							))}
							<button
								type="button"
								className="btn"
								aria-pressed={boxes.length === ALL_BOXES.length}
								onClick={() => viewer.setBoxes(ALL_BOXES)}
							>
								All boxes
							</button>
							<button
								type="button"
								className="btn"
								onClick={() => viewer.stepBox(-1)}
								aria-label={
									singleBox
										? `Previous box (box ${boxes[0] === 1 ? 5 : (boxes[0] ?? 1) - 1})`
										: 'Previous box'
								}
							>
								‹
							</button>
							<button
								type="button"
								className="btn"
								onClick={() => viewer.stepBox(1)}
								aria-label={
									singleBox
										? `Next box (box ${boxes[0] === 5 ? 1 : (boxes[0] ?? 0) + 1})`
										: 'Next box'
								}
							>
								›
							</button>
						</div>
					</fieldset>
				)}
				<fieldset className="scale-viewer-group">
					<legend>Show</legend>
					<div className="scale-viewer-checks">
						<label className="check">
							<input
								type="checkbox"
								checked={viewer.showRoots}
								onChange={(e) => viewer.setShowRoots(e.target.checked)}
							/>
							Roots
						</label>
						<label className="check">
							<input
								type="checkbox"
								checked={viewer.showChordTones}
								onChange={(e) => viewer.setShowChordTones(e.target.checked)}
							/>
							Chord tones
						</label>
						<label className="check">
							<input
								type="checkbox"
								checked={viewer.showAllNotes}
								onChange={(e) => viewer.setShowAllNotes(e.target.checked)}
							/>
							All note names
						</label>
					</div>
				</fieldset>
			</div>

			{hasBoxes && boxes.length === 0 && (
				<p className="muted" role="status">
					Pick at least one box to see its notes.
				</p>
			)}
			{hasBoxes && boxes.length > 0 && shownPositions?.length === 0 && (
				<p className="muted" role="status">
					None of the chosen boxes sit in this register. Try another box or register.
				</p>
			)}

			{instrumentResult.ok ? (
				<>
					<Fretboard
						instrument={instrumentResult.instrument}
						positions={positions}
						noteName={viewer.noteName}
						label={viewer.label}
						showAllNotes={viewer.showAllNotes}
						selected={selected}
						onSelect={viewer.setSelected}
						shapeLabel={viewer.boxLabel}
						{...(shownPositions ? { shapes: shownPositions } : {})}
					/>
					<FretboardLegend
						showChordTones={positions.some((p) => p.isChordTone)}
						showOutsideChordTones={positions.some(
							(p) => p.isChordTone && !p.isScaleNote,
						)}
						showBoxes={hasBoxes}
					/>
					<p id={`${id}-readout`} className="scale-viewer-readout" aria-live="polite">
						{selected
							? `String ${selected.string}, fret ${selected.fret}: ${formatPitch(
									midiToPitch(
										selected.midi,
										viewer.scaleNotes.map((n) => n.note),
									),
									'unicode',
								)}${
									roleWords(selected).length
										? ` (${[...roleWords(selected), shapeWords(selected.shapeNumbers)].filter(Boolean).join(', ')})`
										: ''
								}`
							: 'Select a note on the fretboard to see its exact pitch.'}
					</p>
				</>
			) : (
				<p className="error-text" role="alert">
					{instrumentResult.errors.map((e) => e.message).join(' ')}
				</p>
			)}
		</div>
	);
}
