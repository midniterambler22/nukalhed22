import { useEffect, useMemo, useRef, useState } from 'react';
import type { LocalSong } from '../../hooks/useLocalSong';
import { usePlaybackTime } from '../../hooks/usePlaybackTime';
import type { ChordEvent } from '../../services/analysis';
import { computePeaks, formatTime, normalizePeaks } from '../../services/audio';
import { chordIndexAt, timeMarkers } from '../../services/progression';
import { chordColorSlots, displayChord } from '../analysis';
import { Waveform } from '../player';
import './timeline.css';

const WAVEFORM_BARS = 400;
const ZOOMS = [1, 2, 4, 8] as const;

export interface WaveformTimelineProps {
	song: LocalSong;
	/** Estimated chords, empty until the analysis finishes. */
	chords: readonly ChordEvent[];
}

/**
 * The song across the top of the workspace: waveform, chord timeline and time
 * markers, all positioned by the audio element's time. Clicking the waveform or a
 * chord moves playback there; the chord list and the Position slider are the
 * keyboard and screen-reader routes to the same thing.
 */
export function WaveformTimeline({ song, chords }: WaveformTimelineProps) {
	const { controller, playback, analysisAudio } = song;
	const time = usePlaybackTime(controller);
	const [zoom, setZoom] = useState<(typeof ZOOMS)[number]>(1);
	const scrollRef = useRef<HTMLDivElement>(null);
	const duration = playback.duration;
	const progress = duration > 0 ? Math.min(time / duration, 1) : 0;

	const peaks = useMemo(
		() =>
			analysisAudio.status === 'ready'
				? normalizePeaks(computePeaks(analysisAudio.audio.samples, WAVEFORM_BARS * 2))
				: [],
		[analysisAudio],
	);
	const slots = useMemo(() => chordColorSlots(chords), [chords]);
	const current = chordIndexAt(chords, time);
	const markers = useMemo(() => timeMarkers(duration, 6 * zoom), [duration, zoom]);

	// Keep the playhead in view when zoomed in.
	useEffect(() => {
		const box = scrollRef.current;
		if (!box || zoom === 1) return;
		const x = progress * box.scrollWidth;
		if (x < box.scrollLeft + 24 || x > box.scrollLeft + box.clientWidth - 24) {
			box.scrollLeft = Math.max(0, x - box.clientWidth / 3);
		}
	}, [progress, zoom]);

	if (!song.song) return null;
	const zoomIndex = ZOOMS.indexOf(zoom);
	const percent = (seconds: number) => `${(seconds / duration) * 100}%`;

	return (
		<div className="timeline">
			<div className="timeline-scroll" ref={scrollRef}>
				<div className="timeline-inner" style={{ width: `${zoom * 100}%` }}>
					{peaks.length > 0 ? (
						<Waveform
							peaks={peaks}
							progress={progress}
							onSeek={(fraction) => controller.seek(fraction * duration)}
						/>
					) : (
						<div className="timeline-waveform-empty" aria-hidden="true" />
					)}
					{duration > 0 && chords.length > 0 && (
						<div className="timeline-chords" aria-hidden="true">
							{chords.map((event, index) =>
								event.chord ? (
									<div
										key={event.start}
										className={[
											'timeline-chord',
											`chord-color-${slots.get(event.chord) ?? 0}`,
											index === current ? 'is-current' : '',
											event.confidence.level === 'low' ? 'is-uncertain' : '',
										].join(' ')}
										style={{
											left: percent(event.start),
											width: percent(event.end - event.start),
										}}
										onClick={() => controller.seek(event.start)}
									>
										{displayChord(event.chord)}
										{event.confidence.level === 'low' && '?'}
									</div>
								) : null,
							)}
							<div className="timeline-head" style={{ left: `${progress * 100}%` }} />
						</div>
					)}
					{duration > 0 && (
						<div className="timeline-markers" aria-hidden="true">
							{markers.map((t) => (
								<span key={t} style={{ left: percent(t) }}>
									{formatTime(t)}
								</span>
							))}
						</div>
					)}
				</div>
			</div>
			<div className="timeline-zoom" role="group" aria-label="Timeline zoom">
				<button
					type="button"
					className="btn btn--ghost"
					disabled={zoomIndex === 0}
					onClick={() => setZoom(ZOOMS[zoomIndex - 1] ?? 1)}
					aria-label="Zoom out"
				>
					−
				</button>
				<span className="timeline-zoom-level" aria-live="polite">
					{zoom}×
				</span>
				<button
					type="button"
					className="btn btn--ghost"
					disabled={zoomIndex === ZOOMS.length - 1}
					onClick={() => setZoom(ZOOMS[zoomIndex + 1] ?? 8)}
					aria-label="Zoom in"
				>
					+
				</button>
			</div>
		</div>
	);
}
