import './fretboard.css';

export interface FretboardLegendProps {
	showChordTones?: boolean;
	/** Show the entry for chord tones that aren't in the scale. */
	showOutsideChordTones?: boolean;
}

/** Explains marker shapes in words, so roles never depend on color alone. */
export function FretboardLegend({
	showChordTones = true,
	showOutsideChordTones = false,
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
				Square: root
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
				Circle: scale note
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
					Outer ring: chord tone
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
					Hollow ring: chord tone outside the scale
				</li>
			)}
		</ul>
	);
}
