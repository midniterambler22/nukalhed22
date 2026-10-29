import type { SongAnalysis } from '../../hooks/useSongAnalysis';
import { CONFIDENCE_WORDS } from '../analysis';
import './layout.css';

export interface AppHeaderProps {
	/** Title of the loaded song, or null. */
	songTitle: string | null;
	analysis: SongAnalysis;
	onOpenHelp(): void;
	onOpenSettings(): void;
}

/** Persistent header: brand, the loaded song with its key, tempo and time signature, Help and Settings. */
export function AppHeader({ songTitle, analysis, onOpenHelp, onOpenSettings }: AppHeaderProps) {
	const result = analysis.state.status === 'done' ? analysis.state.result : null;
	const pending = songTitle !== null && analysis.state.status === 'analyzing';
	const key = result?.key;
	const tempo = result?.tempo;

	return (
		<header className="app-header">
			<div className="app-brand">
				<Logo />
				<h1 className="app-name">Nukalhed22 Studios</h1>
			</div>

			<section className="app-song" aria-label="Current song">
				<p className="app-song-title">{songTitle ?? 'No song loaded'}</p>
				<dl className="app-song-facts">
					<div>
						<dt>Key</dt>
						<dd>
							{key ? key.name : pending ? '…' : '—'}
							{key && key.confidence.level !== 'high' && (
								<span className="visually-hidden">
									, {CONFIDENCE_WORDS[key.confidence.level]}
								</span>
							)}
							{key && key.confidence.level !== 'high' && (
								<span aria-hidden="true">?</span>
							)}
						</dd>
					</div>
					<div>
						<dt>Tempo</dt>
						<dd>{tempo ? `${Math.round(tempo.bpm)} BPM` : pending ? '…' : '—'}</dd>
					</div>
					<div>
						<dt>Time signature</dt>
						<dd>
							<span aria-hidden="true">—</span>
							<span className="visually-hidden">not estimated yet</span>
						</dd>
					</div>
				</dl>
				{result && <p className="app-song-note">Estimated on this device</p>}
			</section>

			<nav className="app-actions" aria-label="Application">
				<button type="button" className="btn btn--ghost" onClick={onOpenHelp}>
					<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
						<circle
							cx="12"
							cy="12"
							r="9.5"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						/>
						<path
							d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
						/>
					</svg>
					<span className="app-action-label">Help</span>
				</button>
				<button type="button" className="btn btn--ghost" onClick={onOpenSettings}>
					<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
						<circle
							cx="12"
							cy="12"
							r="3"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						/>
						<path
							d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
						/>
					</svg>
					<span className="app-action-label">Settings</span>
				</button>
			</nav>
		</header>
	);
}

function Logo() {
	return (
		<svg className="app-logo" width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
			<defs>
				<linearGradient id="n22-logo" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="#8f6bff" />
					<stop offset="1" stopColor="#4f9dff" />
				</linearGradient>
			</defs>
			<path
				d="M20 2c9 0 16 4 16 11 0 9-9 19-16 25C13 32 4 22 4 13 4 6 11 2 20 2z"
				fill="url(#n22-logo)"
			/>
			<path
				d="M13 26V12l14 14V12"
				fill="none"
				stroke="#fff"
				strokeWidth="3"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
