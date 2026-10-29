import { useId, useState } from 'react';
import { AnalysisSummary, ChordList, SongInfo } from './components/analysis';
import {
	AppHeader,
	HelpDialog,
	Panel,
	PlannedWorkspace,
	SettingsDialog,
	WorkspaceTabs,
	type WorkspaceTab,
} from './components/layout';
import { PlaybackControls, SongImport } from './components/player';
import { ChordScaleInfo, ScaleViewer } from './components/scales';
import { NowPlaying, WaveformTimeline } from './components/timeline';
import { useLocalSong, type LocalSong } from './hooks/useLocalSong';
import { usePlaybackChord } from './hooks/usePlaybackChord';
import {
	DEFAULT_INSTRUMENT_SETTINGS,
	useScaleViewer,
	type InstrumentSettings,
} from './hooks/useScaleViewer';
import { useSongAnalysis, type SongAnalysis } from './hooks/useSongAnalysis';
import type { ChordEvent } from './services/analysis';
import { DEMO_SONG } from './services/demo';

type WorkspaceId = 'jam-master' | 'riff-builder' | 'chord-viewer' | 'scale-viewer' | 'song-info';

/** Workspace tabs, as in the UI spec's reference image. Planned ones say so. */
const WORKSPACES: readonly WorkspaceTab<WorkspaceId>[] = [
	{ id: 'jam-master', label: 'Jam Master', planned: true },
	{ id: 'riff-builder', label: 'Riff Builder', planned: true },
	{ id: 'chord-viewer', label: 'Chord Viewer', planned: true },
	{ id: 'scale-viewer', label: 'Scale Viewer' },
	{ id: 'song-info', label: 'Song Info' },
];

const PLANNED: Readonly<
	Partial<Record<WorkspaceId, { title: string; description: string; when: string }>>
> = {
	'jam-master': {
		title: 'Jam Master',
		description:
			'Practice over the song: loop a section or a few bars, slow it down, and play with a metronome while the fretboard follows the chords.',
		when: 'UI spec Phases 5–6 (implementation plan Phase 6)',
	},
	'riff-builder': {
		title: 'Riff Builder',
		description:
			'Build My Solo: original licks and solos that follow the song’s chords, shown on the fretboard and as tablature, for your level and register.',
		when: 'UI spec Phase 6',
	},
	'chord-viewer': {
		title: 'Chord Viewer',
		description:
			'Chord shapes on the neck with their formulas and tones, and how each chord sits inside the scale you’re using.',
		when: 'UI spec Phase 3',
	},
};

const NO_CHORDS: readonly ChordEvent[] = [];

/**
 * The studio workspace (UI_SPEC.md §4): header, song and timeline across the top,
 * song analysis on the left, the selected workspace in the center, its tools on the
 * right, and the playback bar along the bottom. The song, its analysis and the
 * Scale Viewer state live here so every panel shares them and the audio element
 * stays the one clock; switching tabs or settings never touches playback.
 */
export function App() {
	const song = useLocalSong();
	const analysis = useSongAnalysis(song.analysisAudio);
	const [settings, setSettings] = useState<InstrumentSettings>(DEFAULT_INSTRUMENT_SETTINGS);
	const viewer = useScaleViewer(settings);
	const [workspace, setWorkspace] = useState<WorkspaceId>('scale-viewer');
	const [dialog, setDialog] = useState<'help' | 'settings' | null>(null);
	const tabsId = useId();
	const panelId = `${tabsId}-panel`;

	const chords = analysis.state.status === 'done' ? analysis.state.result.chords : NO_CHORDS;
	const songTitle = song.song
		? song.song.name === DEMO_SONG.fileName
			? DEMO_SONG.title
			: song.song.name
		: null;
	const planned = PLANNED[workspace];
	const hasTools = workspace === 'scale-viewer';

	return (
		<div className="studio">
			<AppHeader
				songTitle={songTitle}
				analysis={analysis}
				onOpenHelp={() => setDialog('help')}
				onOpenSettings={() => setDialog('settings')}
			/>

			<main className="studio-main">
				<Panel title="Song" area="song" hideTitle>
					<div className="song-strip">
						<SongImport song={song} />
						<WaveformTimeline song={song} chords={chords} />
						<NowPlaying song={song} analysis={analysis} />
					</div>
				</Panel>

				<div className={hasTools ? 'studio-grid has-tools' : 'studio-grid'}>
					<Panel title="Song analysis" area="analysis" collapsible>
						<AnalysisSummary analysis={analysis} hasSong={song.song !== null} />
						<h3 className="panel-subtitle">Detected chords</h3>
						<DetectedChords song={song} analysis={analysis} chords={chords} />
					</Panel>

					<div className="studio-center">
						<WorkspaceTabs<WorkspaceId>
							tabs={WORKSPACES}
							active={workspace}
							onChange={setWorkspace}
							panelId={panelId}
							idPrefix={tabsId}
						/>
						<section
							id={panelId}
							role="tabpanel"
							className="panel panel--workspace"
							aria-labelledby={`${tabsId}-${workspace}`}
						>
							{workspace === 'scale-viewer' && <ScaleViewer viewer={viewer} />}
							{workspace === 'song-info' && (
								<SongInfo song={song} analysis={analysis} />
							)}
							{planned && (
								<PlannedWorkspace
									{...planned}
									onOpenScaleViewer={() => setWorkspace('scale-viewer')}
								/>
							)}
						</section>
					</div>

					{hasTools && (
						<Panel title="Chord & scale info" area="tools" collapsible>
							<ChordScaleInfo viewer={viewer} />
						</Panel>
					)}
				</div>
			</main>

			<footer className="studio-playback">
				<PlaybackControls song={song} chords={chords} />
			</footer>

			<HelpDialog open={dialog === 'help'} onClose={() => setDialog(null)} />
			<SettingsDialog
				open={dialog === 'settings'}
				onClose={() => setDialog(null)}
				settings={settings}
				onChange={setSettings}
			/>
		</div>
	);
}

/** The chord list, marking the chord playing now from the audio clock. */
function DetectedChords({
	song,
	analysis,
	chords,
}: {
	song: LocalSong;
	analysis: SongAnalysis;
	chords: readonly ChordEvent[];
}) {
	const { current } = usePlaybackChord(song.controller, chords);
	return (
		<ChordList
			analysis={analysis}
			onSeek={(t) => song.controller.seek(t)}
			currentIndex={current}
		/>
	);
}
