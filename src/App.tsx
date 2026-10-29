import { FretboardExplorer } from './components/fretboard';
import { SongPlayer } from './components/player';
import { useLocalSong } from './hooks/useLocalSong';

/**
 * App shell. Regions whose phase hasn't landed yet are placeholders (see
 * IMPLEMENTATION_PLAN.md) and say so plainly instead of showing fake data.
 */
const PLACEHOLDER_REGIONS = [
	{ id: 'key', title: 'Key and tempo', status: 'Not available yet (Phase 4)' },
	{ id: 'chords', title: 'Current and upcoming chords', status: 'Not available yet (Phase 5)' },
	{
		id: 'scale',
		title: 'Recommended scale and starting fret',
		status: 'Not available yet (Phase 6)',
	},
] as const;

export function App() {
	// Owned here so later phases (analysis, timeline, guidance) share the same song and clock.
	const song = useLocalSong();

	return (
		<>
			<header className="app-header">
				<h1>Nukalhed22 Studios</h1>
				<p>Song → key → chords → scale → starting fret → fretboard → play along.</p>
			</header>
			<main className="workspace">
				<section
					className="workspace-region workspace-region--player"
					aria-labelledby="region-player"
				>
					<h2 id="region-player">Song and playback</h2>
					<SongPlayer song={song} />
				</section>
				{PLACEHOLDER_REGIONS.map((region) => (
					<section
						key={region.id}
						className={`workspace-region workspace-region--${region.id}`}
						aria-labelledby={`region-${region.id}`}
					>
						<h2 id={`region-${region.id}`}>{region.title}</h2>
						<p className="placeholder">{region.status}</p>
					</section>
				))}
				<section
					className="workspace-region workspace-region--fretboard"
					aria-labelledby="region-fretboard"
				>
					<h2 id="region-fretboard">Fretboard</h2>
					<FretboardExplorer />
				</section>
			</main>
		</>
	);
}
