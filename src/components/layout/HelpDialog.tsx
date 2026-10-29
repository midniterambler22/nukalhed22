import { Dialog } from './Dialog';

export interface HelpDialogProps {
	open: boolean;
	onClose(): void;
}

/** How to use the workspace, what the fretboard symbols mean, and what is built so far. */
export function HelpDialog({ open, onClose }: HelpDialogProps) {
	return (
		<Dialog title="Help" open={open} onClose={onClose}>
			<div className="help">
				<section>
					<h3>Getting started</h3>
					<ol>
						<li>Choose a song (MP3, WAV, M4A, AAC or FLAC) or try the demo song.</li>
						<li>
							The app estimates the key, tempo and chords on this device. Uncertain
							results are labelled; they’re estimates, not facts.
						</li>
						<li>
							In Scale Viewer, pick a key, scale, register and boxes, and type the
							chord you’re playing over to see its chord tones.
						</li>
					</ol>
				</section>
				<section>
					<h3>Reading the fretboard</h3>
					<ul>
						<li>Red square: the root of the scale.</li>
						<li>Orange circle: a scale note.</li>
						<li>Blue ring: a chord tone of the chord you chose.</li>
						<li>Hollow blue ring: a chord tone that isn’t in the scale.</li>
						<li>Coloured outline: a box, named “Box 1” to “Box 5” above the neck.</li>
					</ul>
				</section>
				<section>
					<h3>Keyboard</h3>
					<ul>
						<li>Tab moves between controls; Shift+Tab moves back.</li>
						<li>Left and right arrows move between workspace tabs.</li>
						<li>
							On the fretboard, arrow keys move between notes; Enter or Space selects
							one.
						</li>
					</ul>
				</section>
				<section>
					<h3>Privacy</h3>
					<p>
						Your song never leaves this device. It plays and is analyzed in this browser
						and is never uploaded.
					</p>
				</section>
				<section>
					<h3>Not built yet</h3>
					<p>
						Jam Master, Riff Builder and Chord Viewer, scale and box recommendations,
						loops, a metronome, slower playback, chord corrections, time signature and
						song sections. Their tabs say what they’ll do.
					</p>
				</section>
			</div>
		</Dialog>
	);
}
