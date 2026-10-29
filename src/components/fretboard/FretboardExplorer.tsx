import { useId, useMemo, useState } from 'react';
import {
	createInstrument,
	filterShapes,
	getScalePositions,
	markPositions,
	POSITION_COUNT,
	STANDARD_TUNING,
	TUNINGS,
	type MarkedPosition,
} from '../../services/fretboard';
import {
	chordPitchClasses,
	formatNote,
	formatPitch,
	getScale,
	isChordSymbol,
	midiToPitch,
	noteToPitchClass,
	parseNoteName,
	SCALE_IDS,
	SCALES,
	spellPitchClassInContext,
	spellScale,
	type PitchClass,
	type ScaleId,
} from '../../services/music-theory';
import { roleWords, shapeWords } from './describe';
import { Fretboard } from './Fretboard';
import { FretboardLegend } from './FretboardLegend';

const KEY_NAMES = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const CAPO_FRETS = Array.from({ length: 12 }, (_, i) => i);
const SHAPE_NUMBERS = Array.from({ length: POSITION_COUNT }, (_, i) => i + 1);
const SHAPE_PRESETS: readonly { label: string; numbers: number[] }[] = [
	{ label: 'Just 1', numbers: [1] },
	{ label: '1–2', numbers: [1, 2] },
	{ label: '1–3', numbers: [1, 2, 3] },
	{ label: '1–4', numbers: [1, 2, 3, 4] },
	{ label: 'All 5', numbers: SHAPE_NUMBERS },
];

/** Pick a key, scale and chord and see them on the neck. */
export function FretboardExplorer() {
	const id = useId();
	const [keyName, setKeyName] = useState('A');
	const [scaleId, setScaleId] = useState<ScaleId>('minor-pentatonic');
	const [chordText, setChordText] = useState('Am');
	const [tuningIndex, setTuningIndex] = useState(0);
	const [capo, setCapo] = useState(0);
	const [leftHanded, setLeftHanded] = useState(false);
	const [showAllNotes, setShowAllNotes] = useState(false);
	const [selected, setSelected] = useState<MarkedPosition | null>(null);
	const [shapeNumbers, setShapeNumbers] = useState<number[]>(SHAPE_NUMBERS);

	const instrumentResult = useMemo(
		() =>
			createInstrument({
				tuning: TUNINGS[tuningIndex] ?? STANDARD_TUNING,
				capo,
				handedness: leftHanded ? 'left' : 'right',
			}),
		[tuningIndex, capo, leftHanded],
	);

	const scaleNotes = useMemo(() => spellScale(keyName, scaleId), [keyName, scaleId]);
	const spelling = useMemo(() => scaleNotes.map((n) => n.note), [scaleNotes]);
	const noteName = useMemo(
		() => (pc: PitchClass) => formatNote(spellPitchClassInContext(pc, spelling), 'unicode'),
		[spelling],
	);

	const chordValid = chordText.trim() === '' || isChordSymbol(chordText);
	const chordTones = useMemo(
		() =>
			chordText.trim() !== '' && isChordSymbol(chordText) ? chordPitchClasses(chordText) : [],
		[chordText],
	);

	const rootPitchClass = noteToPitchClass(parseNoteName(keyName));
	// The five-shape system covers five-note (pentatonic) scales.
	const hasShapes = scaleNotes.length === POSITION_COUNT;
	const shapes = useMemo(() => {
		if (!instrumentResult.ok || !hasShapes) return undefined;
		const intervals = getScale(scaleId).intervals.map((i) => i.semitones % 12);
		return filterShapes(
			getScalePositions(instrumentResult.instrument, rootPitchClass, intervals),
			shapeNumbers,
		);
	}, [instrumentResult, hasShapes, scaleId, rootPitchClass, shapeNumbers]);

	const positions = useMemo(() => {
		if (!instrumentResult.ok) return [];
		return markPositions(
			instrumentResult.instrument,
			{ root: rootPitchClass, scale: scaleNotes.map((n) => n.pitchClass), chordTones },
			undefined,
			shapes,
		);
	}, [instrumentResult, rootPitchClass, scaleNotes, chordTones, shapes]);

	const toggleShape = (number: number, on: boolean) =>
		setShapeNumbers((current) =>
			on ? [...current, number].sort((a, b) => a - b) : current.filter((n) => n !== number),
		);
	const shapesLabel = hasShapes
		? shapeNumbers.length === POSITION_COUNT
			? ', all 5 shapes'
			: shapeNumbers.length > 0
				? `, ${shapeWords(shapeNumbers)}`
				: ', no shapes chosen'
		: '';

	const scaleName = SCALES[scaleId].name;
	const keyLabel = formatNote(parseNoteName(keyName), 'unicode');

	return (
		<div className="fretboard-explorer">
			<form className="fretboard-controls" onSubmit={(event) => event.preventDefault()}>
				<label>
					Key
					<select value={keyName} onChange={(event) => setKeyName(event.target.value)}>
						{KEY_NAMES.map((name) => (
							<option key={name} value={name}>
								{formatNote(parseNoteName(name), 'unicode')}
							</option>
						))}
					</select>
				</label>
				<label>
					Scale
					<select
						value={scaleId}
						onChange={(event) => setScaleId(event.target.value as ScaleId)}
					>
						{SCALE_IDS.map((sid) => (
							<option key={sid} value={sid}>
								{SCALES[sid].name}
							</option>
						))}
					</select>
				</label>
				<label>
					Chord
					<input
						type="text"
						value={chordText}
						size={6}
						aria-invalid={!chordValid}
						aria-describedby={chordValid ? undefined : `${id}-chord-error`}
						onChange={(event) => setChordText(event.target.value)}
					/>
				</label>
				<label>
					Tuning
					<select
						value={tuningIndex}
						onChange={(event) => setTuningIndex(Number(event.target.value))}
					>
						{TUNINGS.map((tuning, index) => (
							<option key={tuning.name} value={index}>
								{tuning.name}
							</option>
						))}
					</select>
				</label>
				<label>
					Capo
					<select value={capo} onChange={(event) => setCapo(Number(event.target.value))}>
						{CAPO_FRETS.map((fret) => (
							<option key={fret} value={fret}>
								{fret === 0 ? 'None' : `Fret ${fret}`}
							</option>
						))}
					</select>
				</label>
				<label className="fretboard-check">
					<input
						type="checkbox"
						checked={leftHanded}
						onChange={(event) => setLeftHanded(event.target.checked)}
					/>
					Left-handed
				</label>
				<label className="fretboard-check">
					<input
						type="checkbox"
						checked={showAllNotes}
						onChange={(event) => setShowAllNotes(event.target.checked)}
					/>
					Show all notes
				</label>
			</form>
			{hasShapes ? (
				<fieldset className="fretboard-shapes">
					<legend>Shapes</legend>
					<div className="fretboard-shape-presets">
						{SHAPE_PRESETS.map((preset) => (
							<button
								key={preset.label}
								type="button"
								aria-pressed={
									preset.numbers.length === shapeNumbers.length &&
									preset.numbers.every((n) => shapeNumbers.includes(n))
								}
								onClick={() => setShapeNumbers([...preset.numbers])}
							>
								{preset.label}
							</button>
						))}
					</div>
					<div className="fretboard-shape-toggles">
						{SHAPE_NUMBERS.map((number) => (
							<label key={number} className="fretboard-check">
								<input
									type="checkbox"
									checked={shapeNumbers.includes(number)}
									onChange={(event) => toggleShape(number, event.target.checked)}
								/>
								Shape {number}
							</label>
						))}
					</div>
				</fieldset>
			) : (
				<p className="fretboard-note">
					The five shapes are for pentatonic scales. {SCALES[scaleId].name} shows every
					note on the neck.
				</p>
			)}
			{hasShapes && shapeNumbers.length === 0 && (
				<p className="fretboard-note" role="status">
					Pick at least one shape to see its notes.
				</p>
			)}
			{!chordValid && (
				<p id={`${id}-chord-error`} className="fretboard-error" role="alert">
					“{chordText}” isn’t a chord symbol I recognize. Try one like Am, C7 or F♯m7.
					Chord tones are hidden until it’s fixed.
				</p>
			)}

			{instrumentResult.ok ? (
				<>
					<Fretboard
						instrument={instrumentResult.instrument}
						positions={positions}
						noteName={noteName}
						label={`${keyLabel} ${scaleName}${shapesLabel}${chordTones.length ? `, ${chordText.trim()} chord tones` : ''}`}
						showAllNotes={showAllNotes}
						selected={selected}
						onSelect={setSelected}
						{...(shapes ? { shapes } : {})}
					/>
					<FretboardLegend
						showChordTones={chordTones.length > 0}
						showOutsideChordTones={positions.some(
							(p) => p.isChordTone && !p.isScaleNote,
						)}
					/>
					<p className="fretboard-readout" aria-live="polite">
						{selected
							? `String ${selected.string}, fret ${selected.fret}: ${formatPitch(midiToPitch(selected.midi, spelling), 'unicode')}${roleWords(selected).length ? ` (${[...roleWords(selected), shapeWords(selected.shapeNumbers)].filter(Boolean).join(', ')})` : ''}`
							: 'Select a note on the fretboard to see its exact pitch.'}
					</p>
				</>
			) : (
				<p className="fretboard-error" role="alert">
					{instrumentResult.errors.map((e) => e.message).join(' ')}
				</p>
			)}
		</div>
	);
}
