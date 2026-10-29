import type { SongAnalysis } from '../../hooks/useSongAnalysis';
import { CONFIDENCE_WORDS, keyHeadline, STAGE_WORDS } from './describe';
import './analysis.css';

export interface AnalysisSummaryProps {
	analysis: SongAnalysis;
	hasSong: boolean;
}

/**
 * The analysis at a glance: key, tempo, time signature, tuning and structure. Items
 * the engine can't estimate yet say so instead of showing a guess.
 */
export function AnalysisSummary({ analysis, hasSong }: AnalysisSummaryProps) {
	const { state } = analysis;
	if (state.status === 'analyzing') {
		const percent = Math.round(state.progress.fraction * 100);
		return (
			<p role="status" className="analysis-muted">
				Analyzing on this device: {STAGE_WORDS[state.progress.stage]}… {percent}%
			</p>
		);
	}
	if (state.status === 'failed') {
		return (
			<div className="analysis">
				<p role="alert" className="analysis-error">
					{state.message}
				</p>
				<button type="button" className="btn" onClick={analysis.retry}>
					Try again
				</button>
			</div>
		);
	}
	if (state.status !== 'done') {
		return (
			<p className="analysis-muted">
				{hasSong
					? 'The analysis starts once the song is ready.'
					: 'Choose a song or try the demo to see its key, tempo and chords.'}
			</p>
		);
	}
	const { key, tempo } = state.result;
	return (
		<dl className="analysis-summary">
			<div>
				<dt>Key</dt>
				<dd>
					{key ? keyHeadline(key) : 'Not found'}
					{key && <span className="tag">{CONFIDENCE_WORDS[key.confidence.level]}</span>}
				</dd>
			</div>
			<div>
				<dt>Tempo</dt>
				<dd>
					{tempo ? `${Math.round(tempo.bpm)} BPM` : 'No steady beat'}
					{tempo && (
						<span className="tag">{CONFIDENCE_WORDS[tempo.confidence.level]}</span>
					)}
				</dd>
			</div>
			<div>
				<dt>Time signature</dt>
				<dd className="analysis-muted">Not estimated yet</dd>
			</div>
			<div>
				<dt>Tuning</dt>
				<dd className="analysis-muted">Not detected</dd>
			</div>
			<div>
				<dt>Structure</dt>
				<dd className="analysis-muted">Sections not detected yet</dd>
			</div>
		</dl>
	);
}
