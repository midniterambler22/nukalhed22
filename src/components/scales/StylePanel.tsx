import { useId } from 'react';
import { KEY_NAMES, type ScaleViewerState } from '../../hooks/useScaleViewer';
import { STYLE_IDS, STYLE_PROFILES, isStyleId } from '../../services/recommendation';
import './scales.css';

const KEY_LABELS: Readonly<Record<string, string>> = Object.fromEntries(
	KEY_NAMES.map((name) => [name, name.replace('#', '♯').replace('b', '♭')]),
);

const REGISTER_WORDS = {
	low: 'low on the neck',
	middle: 'in the middle',
	high: 'high on the neck',
};

export interface StylePanelProps {
	viewer: ScaleViewerState;
}

/**
 * Blues style picker: what a player in each style tends to reach for over the current chord,
 * with a plain-language reason and a button that puts the choice on the neck.
 */
export function StylePanel({ viewer }: StylePanelProps) {
	const id = useId();
	const { styleId, recommendation } = viewer;
	const profile = styleId ? STYLE_PROFILES[styleId] : null;

	return (
		<section className="style-panel" aria-labelledby={`${id}-title`}>
			<h3 id={`${id}-title`} className="chord-info-heading">
				Play it in a style
			</h3>
			<div className="scale-viewer-controls">
				<label className="field">
					Style
					<select
						value={styleId ?? ''}
						onChange={(e) =>
							viewer.setStyleId(isStyleId(e.target.value) ? e.target.value : null)
						}
					>
						<option value="">None</option>
						{STYLE_IDS.map((sid) => (
							<option key={sid} value={sid}>
								{STYLE_PROFILES[sid].name}
							</option>
						))}
					</select>
				</label>
				{profile && (
					<label className="field">
						Song key
						<select
							value={viewer.songKey}
							onChange={(e) => viewer.setSongKey(e.target.value)}
						>
							{KEY_NAMES.map((name) => (
								<option key={name} value={name}>
									{KEY_LABELS[name]}
								</option>
							))}
						</select>
					</label>
				)}
			</div>
			{profile && (
				<p className="muted">
					{profile.summary} These are playing tendencies to try, not copies of anyone’s
					licks.
				</p>
			)}
			{profile && !recommendation && (
				<p className="muted" role="status">
					Enter a valid chord to play over to see choices.
				</p>
			)}
			{recommendation && (
				<>
					<p>
						Over <strong>{recommendation.chord}</strong> (
						{recommendation.numeral === 'other'
							? 'not the I, IV or V'
							: `the ${recommendation.numeral} chord`}{' '}
						in {KEY_LABELS[viewer.songKey]}):
					</p>
					<ol className="style-options" aria-label={`${profile?.name} choices`}>
						{recommendation.options.map((option) => (
							<li key={`${option.over}-${option.scale}`}>
								<p>
									<strong>
										{option.root} {option.scaleName.toLowerCase()}
									</strong>
									, {REGISTER_WORDS[option.register]}. {option.sound}
								</p>
								<p className="muted">{option.why}</p>
								<button
									type="button"
									className="btn"
									onClick={() => viewer.applyOption(option)}
								>
									Show {option.root} {option.scaleName.toLowerCase()}
								</button>
							</li>
						))}
					</ol>
					<p>
						<strong>Notes to land on:</strong>{' '}
						{recommendation.targets.map((t) => `${t.name} (${t.interval})`).join(', ')}.{' '}
						{recommendation.targets[0]?.reason}
					</p>
				</>
			)}
		</section>
	);
}
