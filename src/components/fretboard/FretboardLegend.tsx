import './fretboard.css';

export interface FretboardLegendProps {
	showChordTones?: boolean;
	/** Show the entry for chord tones that aren't in the scale. */
	showOutsideChordTones?: boolean;
	/** Show the entry for box outlines. */
	showBoxes?: boolean;
}

/** Explains marker shapes in words, so roles never depend on color alone. */
export function FretboardLegend({
	showChordTones = true,
	showOutsideChordTones = false,
	showBoxes = false,
}: FretboardLegendProps) {
	return (
		<ul className="fretboard-legend" aria-label="Fretboard legend">
			<li>
				<svg width="22" height="22" aria-hidden="true">
					<rect
						className="fretboard-marker fretboard-marker--root"
						x="3"
						y="3"
						width="16"
						height="16"
						rx="3"
					/>
				</svg>
				Red square: root
			</li>
			<li>
				<svg width="22" height="22" aria-hidden="true">
					<circle
						className="fretboard-marker fretboard-marker--scale"
						cx="11"
						cy="11"
						r="8"
					/>
				</svg>
				Orange circle: scale note
			</li>
			{showChordTones && (
				<li>
					<svg width="26" height="26" aria-hidden="true">
						<circle className="fretboard-ring" cx="13" cy="13" r="11" />
						<circle
							className="fretboard-marker fretboard-marker--chord"
							cx="13"
							cy="13"
							r="7"
						/>
					</svg>
					Blue ring: chord tone
				</li>
			)}
			{showOutsideChordTones && (
				<li>
					<svg width="26" height="26" aria-hidden="true">
						<circle className="fretboard-ring" cx="13" cy="13" r="11" />
						<circle
							className="fretboard-marker fretboard-marker--outside"
							cx="13"
							cy="13"
							r="7"
						/>
					</svg>
					Hollow blue ring: chord tone outside the scale
				</li>
			)}
			{showBoxes && (
				<li>
					<svg width="26" height="22" aria-hidden="true">
						<rect
							className="fretboard-box-outline fretboard-box--5"
							x="2"
							y="2"
							width="22"
							height="18"
							rx="4"
						/>
					</svg>
					Coloured outline: box, named above the neck
				</li>
			)}
		</ul>
	);
}
