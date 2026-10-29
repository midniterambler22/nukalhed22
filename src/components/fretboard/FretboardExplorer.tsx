import { useId, useMemo, useState } from 'react';
import {
	createInstrument,
	markPositions,
	STANDARD_TUNING,
	TUNINGS,
	type MarkedPosition,
} from '../../services/fretboard';
import {
	chordPitchClasses,
	formatNote,
	formatPitch,
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
import { roleWords } from './describe';
import { Fretboard } from './Fretboard';
import { FretboardLegend } from './FretboardLegend';

const KEY_NAMES = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const CAPO_FRETS = Array.from({ length: 12 }, (_, i) => i);

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

	const positions = useMemo(() => {
		if (!instrumentResult.ok) return [];
		return markPositions(instrumentResult.instrument, {
			root: noteToPitchClass(parseNoteName(keyName)),
			scale: scaleNotes.map((n) => n.pitchClass),
			chordTones,
		});
	}, [instrumentResult, keyName, scaleNotes, chordTones]);

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
						label={`${keyLabel} ${scaleName}${chordTones.length ? `, ${chordText.trim()} chord tones` : ''}`}
						showAllNotes={showAllNotes}
						selected={selected}
						onSelect={setSelected}
					/>
					<FretboardLegend
						showChordTones={chordTones.length > 0}
						showOutsideChordTones={positions.some(
							(p) => p.isChordTone && !p.isScaleNote,
						)}
					/>
					<p className="fretboard-readout" aria-live="polite">
						{selected
							? `String ${selected.string}, fret ${selected.fret}: ${formatPitch(midiToPitch(selected.midi, spelling), 'unicode')}${roleWords(selected).length ? ` (${roleWords(selected).join(', ')})` : ''}`
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
