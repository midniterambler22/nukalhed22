import type { InstrumentSettings } from '../../hooks/useScaleViewer';
import { TUNINGS } from '../../services/fretboard';
import { Dialog } from './Dialog';

export const FRET_COUNTS = [12, 15, 22, 24] as const;

export interface SettingsDialogProps {
	open: boolean;
	onClose(): void;
	settings: InstrumentSettings;
	onChange(settings: InstrumentSettings): void;
}

/** Instrument settings: tuning, capo, neck length and handedness. */
export function SettingsDialog({ open, onClose, settings, onChange }: SettingsDialogProps) {
	const capoFrets = Array.from({ length: Math.min(12, settings.fretCount - 1) }, (_, i) => i);
	const update = (patch: Partial<InstrumentSettings>) => onChange({ ...settings, ...patch });

	return (
		<Dialog title="Settings" open={open} onClose={onClose}>
			<form className="settings-form" onSubmit={(event) => event.preventDefault()}>
				<label className="field">
					Tuning
					<select
						value={settings.tuningIndex}
						onChange={(e) => update({ tuningIndex: Number(e.target.value) })}
					>
						{TUNINGS.map((tuning, index) => (
							<option key={tuning.name} value={index}>
								{tuning.name}
							</option>
						))}
					</select>
				</label>
				<label className="field">
					Capo
					<select
						value={settings.capo}
						onChange={(e) => update({ capo: Number(e.target.value) })}
					>
						{capoFrets.map((fret) => (
							<option key={fret} value={fret}>
								{fret === 0 ? 'None' : `Fret ${fret}`}
							</option>
						))}
					</select>
				</label>
				<label className="field">
					Neck length
					<select
						value={settings.fretCount}
						onChange={(e) => {
							const fretCount = Number(e.target.value);
							update({ fretCount, capo: Math.min(settings.capo, fretCount - 1) });
						}}
					>
						{FRET_COUNTS.map((count) => (
							<option key={count} value={count}>
								{count} frets
							</option>
						))}
					</select>
				</label>
				<label className="check">
					<input
						type="checkbox"
						checked={settings.leftHanded}
						onChange={(e) => update({ leftHanded: e.target.checked })}
					/>
					Left-handed neck
				</label>
				<p className="muted">
					Changes apply at once and never interrupt the song. Notes are always worked out
					from the tuning, capo and fret.
				</p>
			</form>
		</Dialog>
	);
}
