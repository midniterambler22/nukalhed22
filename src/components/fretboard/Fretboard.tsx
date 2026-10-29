import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import {
	lowestPlayableFret,
	openMidiForString,
	stringCount,
	type FretPosition,
	type Instrument,
	type MarkedPosition,
} from '../../services/fretboard';
import { midiToPitchClass, type PitchClass } from '../../services/music-theory';
import { describePosition } from './describe';
import { computeLayout, inlayDots } from './layout';
import './fretboard.css';

export interface FretboardProps {
	instrument: Instrument;
	/** Every cell to draw, from `markPositions`. Their frets set the displayed range. */
	positions: readonly MarkedPosition[];
	/** Display name for a pitch class. Spelling comes from the theory module. */
	noteName: (pitchClass: PitchClass) => string;
	/** Accessible name for the whole fretboard, e.g. "A minor pentatonic, frets 5–8". */
	label: string;
	/** Also label notes that have no highlight role. */
	showAllNotes?: boolean;
	selected?: Pick<FretPosition, 'string' | 'fret'> | null;
	onSelect?: (position: MarkedPosition) => void;
}

type Cell = Pick<FretPosition, 'string' | 'fret'>;

const key = (cell: Cell) => `${cell.string}:${cell.fret}`;

export function Fretboard({
	instrument,
	positions,
	noteName,
	label,
	showAllNotes = false,
	selected = null,
	onSelect,
}: FretboardProps) {
	const strings = stringCount(instrument);
	const lowest = lowestPlayableFret(instrument);
	const left = instrument.handedness === 'left';

	const byCell = useMemo(() => new Map(positions.map((p) => [key(p), p])), [positions]);
	const range = useMemo(() => {
		const frets = positions.map((p) => p.fret);
		return { min: Math.min(...frets), max: Math.max(...frets) };
	}, [positions]);
	const layout = useMemo(
		() => computeLayout(range, strings, lowest, instrument.handedness),
		[range, strings, lowest, instrument.handedness],
	);
	const stringNames = useMemo(() => {
		const names: string[] = [];
		for (let s = 1; s <= strings; s++)
			names.push(noteName(midiToPitchClass(openMidiForString(instrument, s))));
		return names;
	}, [instrument, strings, noteName]);

	const initialFocus =
		(selected && byCell.get(key(selected))) ?? positions.find((p) => p.isRoot) ?? positions[0];
	const [focusCell, setFocusCell] = useState<Cell | undefined>(initialFocus);
	const [hasFocus, setHasFocus] = useState(false);
	const active = focusCell && byCell.has(key(focusCell)) ? focusCell : initialFocus;
	const idPrefix = useId();
	const cellId = (cell: Cell) => `${idPrefix}cell-${cell.string}-${cell.fret}`;

	if (positions.length === 0) {
		return <p className="fretboard-empty">No frets to show.</p>;
	}

	const moveFocus = (cell: Cell) => {
		if (!byCell.has(key(cell))) return;
		setFocusCell(cell);
		const element = document.getElementById(cellId(cell));
		element?.focus();
	};

	const onKeyDown = (event: KeyboardEvent<SVGGElement>, cell: Cell) => {
		// Arrow keys follow the picture: right/left move along the drawn neck.
		const toward = left ? -1 : 1;
		const moves: Record<string, Cell> = {
			ArrowRight: { string: cell.string, fret: cell.fret + toward },
			ArrowLeft: { string: cell.string, fret: cell.fret - toward },
			ArrowUp: { string: cell.string - 1, fret: cell.fret },
			ArrowDown: { string: cell.string + 1, fret: cell.fret },
			Home: { string: cell.string, fret: range.min },
			End: { string: cell.string, fret: range.max },
		};
		const next = moves[event.key];
		if (next) {
			event.preventDefault();
			moveFocus(next);
			return;
		}
		if ((event.key === 'Enter' || event.key === ' ') && onSelect) {
			event.preventDefault();
			const position = byCell.get(key(cell));
			if (position) onSelect(position);
		}
	};

	const topY = layout.stringY(1);
	const bottomY = layout.stringY(strings);
	const markerR = 13;

	return (
		<div className="fretboard-scroll">
			<svg
				className="fretboard"
				role="grid"
				aria-label={label}
				aria-rowcount={strings}
				aria-colcount={layout.columns.length}
				viewBox={`0 0 ${layout.width} ${layout.height}`}
				width={layout.width}
				height={layout.height}
				onFocus={() => setHasFocus(true)}
				onBlur={() => setHasFocus(false)}
			>
				<g aria-hidden="true">
					{layout.columns.map((fret) => {
						const dots = inlayDots(fret);
						const x = layout.cellX(fret);
						const midY = (topY + bottomY) / 2;
						if (dots === 0 || fret === lowest) return null;
						return dots === 1 ? (
							<circle
								key={`inlay-${fret}`}
								className="fretboard-inlay"
								cx={x}
								cy={midY}
								r={6}
							/>
						) : (
							<g key={`inlay-${fret}`}>
								<circle
									className="fretboard-inlay"
									cx={x}
									cy={midY - layout.stringGap}
									r={6}
								/>
								<circle
									className="fretboard-inlay"
									cx={x}
									cy={midY + layout.stringGap}
									r={6}
								/>
							</g>
						);
					})}
					{layout.columns.map((fret) => {
						const isNutSide = layout.hasOpenColumn && fret === lowest;
						const className = isNutSide
							? lowest === 0
								? 'fretboard-nut'
								: 'fretboard-capo'
							: 'fretboard-wire';
						return (
							<line
								key={`wire-${fret}`}
								className={className}
								x1={layout.wireX(fret)}
								x2={layout.wireX(fret)}
								y1={topY - 8}
								y2={bottomY + 8}
							/>
						);
					})}
					{Array.from({ length: strings }, (_, i) => i + 1).map((string) => (
						<line
							key={`string-${string}`}
							className="fretboard-string"
							style={{
								strokeWidth: 1 + (string - 1) * (2 / Math.max(1, strings - 1)),
							}}
							x1={layout.startX}
							x2={layout.endX}
							y1={layout.stringY(string)}
							y2={layout.stringY(string)}
						/>
					))}
					{layout.columns.map((fret) => (
						<text
							key={`num-${fret}`}
							className="fretboard-fret-number"
							x={layout.cellX(fret)}
							y={bottomY + 30}
							textAnchor="middle"
						>
							{fret === lowest && lowest > 0 ? `${fret} capo` : fret}
						</text>
					))}
				</g>

				{Array.from({ length: strings }, (_, i) => i + 1).map((string) => (
					<g role="row" key={`row-${string}`} aria-rowindex={string}>
						{layout.columns.map((fret, columnIndex) => {
							const position = byCell.get(key({ string, fret }));
							if (!position) return null;
							const isActive = active?.string === string && active.fret === fret;
							const isSelected =
								selected?.string === string && selected.fret === fret;
							const marked =
								position.isRoot || position.isChordTone || position.isScaleNote;
							const x = layout.cellX(fret);
							const y = layout.stringY(string);
							const name = noteName(position.pitchClass);
							const role = position.isRoot
								? 'root'
								: position.isChordTone
									? 'chord'
									: 'scale';
							return (
								<g
									key={`cell-${fret}`}
									id={cellId(position)}
									role="gridcell"
									aria-colindex={columnIndex + 1}
									aria-label={describePosition(
										position,
										name,
										stringNames[string - 1] ?? '',
										lowest,
									)}
									aria-selected={onSelect ? isSelected : undefined}
									tabIndex={isActive ? 0 : -1}
									className="fretboard-cell"
									onClick={() => {
										setFocusCell(position);
										onSelect?.(position);
									}}
									onKeyDown={(event) => onKeyDown(event, position)}
									onFocus={() => setFocusCell(position)}
								>
									<rect
										className="fretboard-hit"
										x={x - layout.cellWidth / 2}
										y={y - layout.stringGap / 2}
										width={layout.cellWidth}
										height={layout.stringGap}
									/>
									{marked &&
										position.isChordTone &&
										(position.isRoot ? (
											<rect
												className="fretboard-ring"
												x={x - markerR - 4}
												y={y - markerR - 4}
												width={(markerR + 4) * 2}
												height={(markerR + 4) * 2}
												rx={5}
											/>
										) : (
											<circle
												className="fretboard-ring"
												cx={x}
												cy={y}
												r={markerR + 4}
											/>
										))}
									{marked &&
										(position.isRoot ? (
											<rect
												className={`fretboard-marker fretboard-marker--${role}`}
												x={x - markerR}
												y={y - markerR}
												width={markerR * 2}
												height={markerR * 2}
												rx={3}
											/>
										) : (
											<circle
												className={`fretboard-marker fretboard-marker--${role}`}
												cx={x}
												cy={y}
												r={markerR}
											/>
										))}
									{(marked || showAllNotes) && (
										<text
											className={
												marked
													? 'fretboard-label'
													: 'fretboard-label fretboard-label--plain'
											}
											x={x}
											y={y}
											textAnchor="middle"
											dominantBaseline="central"
											aria-hidden="true"
										>
											{name}
										</text>
									)}
									{isSelected && (
										<rect
											className="fretboard-selected"
											x={x - layout.cellWidth / 2 + 3}
											y={y - layout.stringGap / 2 + 1}
											width={layout.cellWidth - 6}
											height={layout.stringGap - 2}
											rx={6}
										/>
									)}
									{isActive && hasFocus && (
										<rect
											className="fretboard-focus"
											x={x - layout.cellWidth / 2 + 1}
											y={y - layout.stringGap / 2 - 1}
											width={layout.cellWidth - 2}
											height={layout.stringGap + 2}
											rx={7}
										/>
									)}
								</g>
							);
						})}
					</g>
				))}
			</svg>
		</div>
	);
}
