import { useId } from 'react';
import type { ScaleViewerState } from '../../hooks/useScaleViewer';
import { formatInterval } from '../../services/music-theory';
import './scales.css';

const pretty = (text: string) => text.replace(/b/g, '♭').replace(/#/g, '♯');

export interface ChordScaleInfoProps {
	viewer: ScaleViewerState;
}

/**
 * Right-hand tools for Scale Viewer: the chord to play over, its tones and how each
 * relates to the selected scale (UI_SPEC.md §10).
 */
export function ChordScaleInfo({ viewer }: ChordScaleInfoProps) {
	const id = useId();
	const { chordTones, chordValid, chord } = viewer;
	const inside = chordTones.filter((t) => t.scaleInterval);
	const outside = chordTones.filter((t) => !t.scaleInterval);
	const scaleTitle = `${viewer.keyLabel} ${viewer.scaleName.toLowerCase()}`;
	const names = (tones: typeof chordTones) =>
		tones.map((t) => viewer.noteName(t.pitchClass)).join(', ');

	return (
		<div className="chord-info">
			<section aria-labelledby={`${id}-chord`}>
				<h3 id={`${id}-chord`} className="chord-info-heading">
					Current chord
				</h3>
				<label className="field">
					Chord to play over
					<input
						type="text"
						value={viewer.chordText}
						size={6}
						aria-invalid={!chordValid}
						aria-describedby={chordValid ? undefined : `${id}-chord-error`}
						onChange={(e) => viewer.setChordText(e.target.value)}
					/>
				</label>
				{!chordValid && (
					<p id={`${id}-chord-error`} className="error-text" role="alert">
						“{chord}” isn’t a chord symbol I recognize. Try one like Am, C7 or F♯m7.
						Chord tones are hidden until it’s fixed.
					</p>
				)}
				{chordTones.length > 0 && (
					<ul className="note-chips" aria-label={`${chord} chord tones`}>
						{chordTones.map((tone) => (
							<li
								key={tone.pitchClass}
								className={
									tone.scaleInterval
										? 'note-chip note-chip--chord'
										: 'note-chip note-chip--outside'
								}
							>
								<span className="note-chip-name">
									{viewer.noteName(tone.pitchClass)}
								</span>
								<span className="note-chip-interval">
									{pretty(formatInterval(tone.interval))}
								</span>
								{!tone.scaleInterval && (
									<span className="note-chip-flag">not in scale</span>
								)}
							</li>
						))}
					</ul>
				)}
			</section>

			<section aria-labelledby={`${id}-scale`}>
				<h3 id={`${id}-scale`} className="chord-info-heading">
					Scale notes ({scaleTitle})
				</h3>
				<ul className="note-chips" aria-label={`${scaleTitle} notes`}>
					{viewer.scaleNotes.map((note, index) => (
						<li
							key={note.pitchClass}
							className={
								index === 0
									? 'note-chip note-chip--root'
									: 'note-chip note-chip--scale'
							}
						>
							<span className="note-chip-name">
								{viewer.noteName(note.pitchClass)}
							</span>
							<span className="note-chip-interval">{viewer.formula[index]}</span>
						</li>
					))}
				</ul>
			</section>

			{chordTones.length > 0 && (
				<section className="chord-info-focus" aria-labelledby={`${id}-focus`}>
					<h3 id={`${id}-focus`} className="chord-info-heading">
						Chord tone focus
					</h3>
					<p>
						{chord} is {names(chordTones)}.{' '}
						{inside.length > 0 && (
							<>
								{names(inside)} {inside.length === 1 ? 'is' : 'are'} in {scaleTitle}
								, so {inside.length === 1 ? 'it makes a' : 'they make'} strong{' '}
								{inside.length === 1 ? 'note' : 'notes'} to land on.{' '}
							</>
						)}
						{outside.length > 0 && (
							<>
								{names(outside)} {outside.length === 1 ? 'isn’t' : 'aren’t'} in the
								scale. That isn’t wrong: {outside.length === 1 ? 'it' : 'they'} can
								be a passing tone or a deliberate colour, or a reason to try another
								scale over this chord.
							</>
						)}
					</p>
					<p className="muted">
						A scale note is any note of the scale. A chord tone is a note of the chord
						playing now; those are the safest to target.
					</p>
				</section>
			)}
		</div>
	);
}
