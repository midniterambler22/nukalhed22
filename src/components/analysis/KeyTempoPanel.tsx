import type { AnalysisAudioState } from '../../hooks/useLocalSong';
import type { SongAnalysis } from '../../hooks/useSongAnalysis';
import { formatTime } from '../../services/audio';
import type { AnalysisResult, Confidence } from '../../services/analysis';
import { CONFIDENCE_WORDS, keyHeadline, STAGE_WORDS } from './describe';
import './analysis.css';

export interface KeyTempoPanelProps {
	audio: AnalysisAudioState;
	analysis: SongAnalysis;
}

/** Key and tempo region: analysis progress, then the estimated key and tempo with confidence. */
export function KeyTempoPanel({ audio, analysis }: KeyTempoPanelProps) {
	const { state } = analysis;
	if (state.status === 'done') return <KeyTempoResult result={state.result} />;
	if (state.status === 'failed') {
		return (
			<div className="analysis">
				<p role="alert" className="analysis-error">
					{state.message}
				</p>
				<button type="button" className="analysis-button" onClick={analysis.retry}>
					Try again
				</button>
			</div>
		);
	}
	if (state.status === 'analyzing') {
		const percent = Math.round(state.progress.fraction * 100);
		return (
			<div className="analysis">
				<p role="status" className="analysis-muted">
					Analyzing on this device: {STAGE_WORDS[state.progress.stage]}… {percent}%
				</p>
				<progress
					className="analysis-progress"
					max={100}
					value={percent}
					aria-label="Analysis progress"
				>
					{percent}%
				</progress>
			</div>
		);
	}
	let text = 'Choose a song to estimate its key and tempo.';
	if (audio.status === 'waiting' || audio.status === 'decoding')
		text = 'Preparing the song for analysis…';
	if (audio.status === 'error')
		text = 'This song can’t be analyzed, so no key or tempo is shown.';
	return (
		<p role="status" className="analysis-muted">
			{text}
		</p>
	);
}

function ConfidenceTag({ confidence }: { confidence: Confidence }) {
	return (
		<span className={`analysis-tag analysis-tag--${confidence.level}`}>
			{CONFIDENCE_WORDS[confidence.level]}
		</span>
	);
}

function KeyTempoResult({ result }: { result: AnalysisResult }) {
	const { key, tempo, tonalSections } = result;
	return (
		<div className="analysis">
			<dl className="analysis-facts">
				<div>
					<dt>Key (estimated)</dt>
					{key ? (
						<dd>
							<span className="analysis-value">{keyHeadline(key)}</span>{' '}
							<ConfidenceTag confidence={key.confidence} />
							<span className="analysis-detail">
								Also possible: {key.alternatives.map((k) => k.name).join(', ')}
							</span>
						</dd>
					) : (
						<dd>
							<span className="analysis-value">Not found</span>
							<span className="analysis-detail">
								The audio has too little pitched sound to suggest a key.
							</span>
						</dd>
					)}
				</div>
				<div>
					<dt>Tempo (estimated)</dt>
					{tempo ? (
						<dd>
							<span className="analysis-value">{Math.round(tempo.bpm)} BPM</span>{' '}
							<ConfidenceTag confidence={tempo.confidence} />
							{tempo.doubleTimeBpm !== undefined && (
								<span className="analysis-detail">
									Could also be counted at {Math.round(tempo.doubleTimeBpm)} BPM.
								</span>
							)}
						</dd>
					) : (
						<dd>
							<span className="analysis-value">No steady beat</span>
							<span className="analysis-detail">
								No regular pulse was found, so chords are timed in half-second
								steps.
							</span>
						</dd>
					)}
				</div>
			</dl>
			{tonalSections.length > 0 && (
				<div>
					<h3 className="analysis-subheading">The key seems to change</h3>
					<ol className="analysis-sections">
						{tonalSections.map((section) => (
							<li key={section.start}>
								{formatTime(section.start)}–{formatTime(section.end)}:{' '}
								{section.key.name}
							</li>
						))}
					</ol>
				</div>
			)}
			<details className="analysis-notes">
				<summary>About these estimates</summary>
				<ul>
					{result.notes.map((note) => (
						<li key={note}>{note}</li>
					))}
				</ul>
			</details>
		</div>
	);
}
