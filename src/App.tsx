/**
 * App shell. Each region of the main workspace is a placeholder until its phase lands
 * (see IMPLEMENTATION_PLAN.md). Placeholders say so plainly instead of showing fake data.
 */
const WORKSPACE_REGIONS = [
	{ id: 'player', title: 'Song and playback', status: 'Not available yet (Phase 3)' },
	{ id: 'key', title: 'Key and tempo', status: 'Not available yet (Phase 5)' },
	{ id: 'chords', title: 'Current and upcoming chords', status: 'Not available yet (Phase 3)' },
	{ id: 'fretboard', title: 'Fretboard', status: 'Not available yet (Phase 2)' },
	{
		id: 'scale',
		title: 'Recommended scale and starting fret',
		status: 'Not available yet (Phase 4)',
	},
] as const;

export function App() {
	return (
		<>
			<header className="app-header">
				<h1>Nukalhed22 Studios</h1>
				<p>Song → key → chords → scale → starting fret → fretboard → play along.</p>
			</header>
			<main className="workspace">
				{WORKSPACE_REGIONS.map((region) => (
					<section
						key={region.id}
						className={`workspace-region workspace-region--${region.id}`}
						aria-labelledby={`region-${region.id}`}
					>
						<h2 id={`region-${region.id}`}>{region.title}</h2>
						<p className="placeholder">{region.status}</p>
					</section>
				))}
			</main>
		</>
	);
}
