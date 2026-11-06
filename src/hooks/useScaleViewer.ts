import { useCallback, useMemo, useState } from 'react';
import {
	createInstrument,
	filterShapes,
	getScalePositions,
	markPositions,
	POSITION_COUNT,
	positionsInRegister,
	registerOf,
	registerRange,
	STANDARD_TUNING,
	TUNINGS,
	type InstrumentResult,
	type MarkedPosition,
	type Register,
	type ScalePosition,
} from '../services/fretboard';
import {
	chordPitchClasses,
	chordTonesInScale,
	formatInterval,
	formatNote,
	getScale,
	isChordSymbol,
	noteToPitchClass,
	parseNoteName,
	SCALES,
	scaleBoxPlan,
	spellPitchClassInContext,
	spellScale,
	type ChordToneInScale,
	type FormulaNote,
	type PitchClass,
	type ScaleId,
} from '../services/music-theory';

/** Instrument settings, chosen in Settings and shared by every view of the neck. */
export interface InstrumentSettings {
	tuningIndex: number;
	capo: number;
	leftHanded: boolean;
	fretCount: number;
}

export const DEFAULT_INSTRUMENT_SETTINGS: InstrumentSettings = {
	tuningIndex: 0,
	capo: 0,
	leftHanded: false,
	fretCount: 22,
};

/** Where on the neck to look: one third of the playable neck, or all of it. */
export type RegisterChoice = Register | 'all';

export const ALL_BOXES: readonly number[] = Array.from({ length: POSITION_COUNT }, (_, i) => i + 1);

const REGISTER_WORDS: Readonly<Record<Register, string>> = {
	low: 'Low',
	middle: 'Mid',
	high: 'High',
};

export interface ScaleViewerState {
	keyName: string;
	setKeyName(name: string): void;
	scaleId: ScaleId;
	setScaleId(id: ScaleId): void;
	chordText: string;
	setChordText(text: string): void;
	register: RegisterChoice;
	setRegister(register: RegisterChoice): void;
	/** Box numbers (1–5) to show, ascending. */
	boxes: readonly number[];
	setBoxes(numbers: readonly number[]): void;
	toggleBox(number: number): void;
	/** Moves a single shown box one step up or down the five-box cycle. */
	stepBox(direction: 1 | -1): void;
	showRoots: boolean;
	setShowRoots(on: boolean): void;
	showChordTones: boolean;
	setShowChordTones(on: boolean): void;
	showAllNotes: boolean;
	setShowAllNotes(on: boolean): void;
	selected: MarkedPosition | null;
	setSelected(position: MarkedPosition | null): void;

	// Derived, all from the theory and fretboard engines.
	instrumentResult: InstrumentResult;
	scaleName: string;
	keyLabel: string;
	/** Formula for display, e.g. ["1", "♭3", "4", "5", "♭7"]. */
	formula: string[];
	scaleNotes: FormulaNote[];
	noteName(pitchClass: PitchClass): string;
	chordValid: boolean;
	/** The chord as typed, trimmed; empty when none. */
	chord: string;
	chordTones: ChordToneInScale[];
	/** True for five-note scales, which use the five-box system. */
	hasBoxes: boolean;
	/** Every place a box fits on this neck, before any filter. */
	allPositions: readonly ScalePosition[];
	/** The boxes drawn on the neck after the register and box filters. */
	shownPositions: readonly ScalePosition[] | undefined;
	positions: MarkedPosition[];
	boxLabel(position: ScalePosition): string;
	/** Accessible name for the neck. */
	label: string;
}

/**
 * Everything the Scale Viewer shows and edits. The view components only render this;
 * notes, positions and registers all come from the theory and fretboard services.
 */
export function useScaleViewer(settings: InstrumentSettings): ScaleViewerState {
	const [keyName, setKeyName] = useState('A');
	const [scaleId, setScaleId] = useState<ScaleId>('minor-pentatonic');
	const [chordText, setChordText] = useState('A7');
	const [register, setRegister] = useState<RegisterChoice>('all');
	const [boxes, setBoxesState] = useState<readonly number[]>(ALL_BOXES);
	const [showRoots, setShowRoots] = useState(true);
	const [showChordTones, setShowChordTones] = useState(true);
	const [showAllNotes, setShowAllNotes] = useState(false);
	const [selected, setSelected] = useState<MarkedPosition | null>(null);

	const setBoxes = useCallback(
		(numbers: readonly number[]) => setBoxesState([...new Set(numbers)].sort((a, b) => a - b)),
		[],
	);
	const toggleBox = useCallback(
		(number: number) =>
			setBoxesState((current) =>
				current.includes(number)
					? current.filter((n) => n !== number)
					: [...current, number].sort((a, b) => a - b),
			),
		[],
	);
	const stepBox = useCallback(
		(direction: 1 | -1) =>
			setBoxesState((current) => {
				const from = current.length === 1 ? (current[0] ?? 1) : 1 - direction;
				const next = ((from - 1 + direction + POSITION_COUNT) % POSITION_COUNT) + 1;
				return [next];
			}),
		[],
	);

	const instrumentResult = useMemo(
		() =>
			createInstrument({
				tuning: TUNINGS[settings.tuningIndex] ?? STANDARD_TUNING,
				capo: settings.capo,
				fretCount: settings.fretCount,
				handedness: settings.leftHanded ? 'left' : 'right',
			}),
		[settings.tuningIndex, settings.capo, settings.fretCount, settings.leftHanded],
	);

	const scaleNotes = useMemo(() => spellScale(keyName, scaleId), [keyName, scaleId]);
	const spelling = useMemo(() => scaleNotes.map((n) => n.note), [scaleNotes]);
	const noteName = useCallback(
		(pc: PitchClass) => formatNote(spellPitchClassInContext(pc, spelling), 'unicode'),
		[spelling],
	);
	const rootPitchClass = noteToPitchClass(parseNoteName(keyName));
	const formula = useMemo(
		() =>
			getScale(scaleId).intervals.map((i) =>
				formatInterval(i).replace(/b/g, '♭').replace(/#/g, '♯'),
			),
		[scaleId],
	);

	const chord = chordText.trim();
	const chordValid = chord === '' || isChordSymbol(chord);
	const chordTones = useMemo(
		() =>
			chord !== '' && isChordSymbol(chord)
				? chordTonesInScale(chord, rootPitchClass, scaleId)
				: [],
		[chord, rootPitchClass, scaleId],
	);
	const chordPitches = useMemo(
		() => (chord !== '' && isChordSymbol(chord) ? chordPitchClasses(chord) : []),
		[chord],
	);

	const boxPlan = useMemo(() => scaleBoxPlan(scaleId), [scaleId]);
	const hasBoxes = boxPlan !== undefined;
	const allPositions = useMemo(() => {
		if (!instrumentResult.ok || !boxPlan) return [];
		return getScalePositions(
			instrumentResult.instrument,
			rootPitchClass,
			boxPlan.core,
			boxPlan.added,
		);
	}, [instrumentResult, boxPlan, rootPitchClass]);

	const shownPositions = useMemo(() => {
		if (!instrumentResult.ok || !hasBoxes) return undefined;
		const inRegister =
			register === 'all'
				? allPositions
				: positionsInRegister(instrumentResult.instrument, allPositions, register);
		return filterShapes(inRegister, boxes);
	}, [instrumentResult, hasBoxes, allPositions, register, boxes]);

	// Scales without boxes show every note, limited to the register's third of the neck.
	const range = useMemo(() => {
		if (!instrumentResult.ok || hasBoxes || register === 'all') return undefined;
		const { min, max } = registerRange(instrumentResult.instrument, register);
		return { min: Math.floor(min), max: Math.ceil(max) };
	}, [instrumentResult, hasBoxes, register]);

	const positions = useMemo(() => {
		if (!instrumentResult.ok) return [];
		return markPositions(
			instrumentResult.instrument,
			{
				...(showRoots ? { root: rootPitchClass } : {}),
				scale: scaleNotes.map((n) => n.pitchClass),
				chordTones: showChordTones ? chordPitches : [],
			},
			range,
			shownPositions,
		);
	}, [
		instrumentResult,
		showRoots,
		rootPitchClass,
		scaleNotes,
		showChordTones,
		chordPitches,
		range,
		shownPositions,
	]);

	const boxLabel = useCallback(
		(position: ScalePosition) =>
			instrumentResult.ok
				? `Box ${position.number} (${REGISTER_WORDS[registerOf(instrumentResult.instrument, position)]})`
				: `Box ${position.number}`,
		[instrumentResult],
	);

	const scaleName = SCALES[scaleId].name;
	const keyLabel = formatNote(parseNoteName(keyName), 'unicode');
	const boxesWords = !hasBoxes
		? ''
		: boxes.length === POSITION_COUNT
			? ', all 5 boxes'
			: boxes.length === 0
				? ', no boxes chosen'
				: `, ${boxes.length === 1 ? 'box' : 'boxes'} ${boxes.join(', ')}`;
	const registerWords = register === 'all' ? '' : `, ${register} register`;
	const chordWords = showChordTones && chordPitches.length > 0 ? `, ${chord} chord tones` : '';
	const label = `${keyLabel} ${scaleName}${boxesWords}${registerWords}${chordWords}`;

	return {
		keyName,
		setKeyName,
		scaleId,
		setScaleId,
		chordText,
		setChordText,
		register,
		setRegister,
		boxes,
		setBoxes,
		toggleBox,
		stepBox,
		showRoots,
		setShowRoots,
		showChordTones,
		setShowChordTones,
		showAllNotes,
		setShowAllNotes,
		selected,
		setSelected,
		instrumentResult,
		scaleName,
		keyLabel,
		formula,
		scaleNotes,
		noteName,
		chordValid,
		chord,
		chordTones,
		hasBoxes,
		allPositions,
		shownPositions,
		positions,
		boxLabel,
		label,
	};
}
