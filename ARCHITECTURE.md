# Architecture

Documents the technical architecture, module boundaries, and recorded decisions. The full requirements are in PROJECT_INSTRUCTIONS §3–§8. This file records how they're realized and why.

**Status (2026-10-29):** App scaffolded. The music theory module, fretboard engine (instrument model, positions), SVG fretboard component, audio service, audio file validation, song player and analysis service are implemented; other modules are planned.

## Platform

A browser-based app built with React + TypeScript + Vite. Audio is processed locally. A Windows desktop build (Tauri 2) comes later, once the web app is stable.

## Modules

| Module | Location | Responsibility | Depends on |
|---|---|---|---|
| Music theory | `src/services/music-theory` | Pitch classes, intervals, scales, chords, transposition | none |
| Fretboard engine | `src/services/fretboard` | Instrument model (tuning, capo, strings), note↔position mapping, scale positions, register selection | music theory |
| Audio service | `src/services/audio` | Load, play, pause, seek, loop, speed; exposes playback time | browser audio APIs |
| Timeline engine | `src/services/state` | Chord events, active-event lookup from playback time, corrections layer | audio service (time only) |
| Analysis service | `src/services/analysis` | Key, tempo, beat and chord estimates behind a replaceable interface | music theory, audio data |
| Practice / persistence | `src/services/state` | Saved sessions, preferences (local storage first) | timeline, fretboard |
| Validation | `src/services/validation` | Validation of files, saved sessions, and tunings | none |
| UI | `src/components`, `src/pages` | Display and interaction only; no theory math | all services |

## Key rules

- Theory and fretboard modules are pure and deterministic, with no UI or audio imports.
- The audio element's playback time is the single clock. Nothing keeps its own timer.
- Analysis results and user corrections are stored as separate layers.
- Pitch classes are numbers 0–11; note names are a display concern.

## Music theory module

`src/services/music-theory`, imported through `index.ts`. Pure functions, no dependencies.

- `PitchClass` (0–11) and `MidiNote` (E2 = 40, C4 = 60) carry the sound. `SpelledNote` (letter + accidental) carries the name.
- `Interval` is a scale degree plus a semitone count (`b3` = degree 3, 3 semitones). The degree fixes the letter, so spelling is always correct: E blues gives B♭, not A♯; F♯ major gives E♯.
- Scales (`SCALES`) and chord qualities (`CHORD_QUALITIES`) are formula tokens such as `['1', 'b3', '4', '5', 'b7']`, validated when the module loads.
- `spellScale`, `scalePitchClasses`, `scaleDegreeOf`, `chordTones`, `chordPitchClasses` and `parseChordSymbol` build everything from those formulas.
- `spellPitchClassInContext` names a bare pitch class using a spelled scale or chord, falling back to sharps or flats to match it.
- Invalid input (a bad note name, interval or chord symbol) throws `TheoryError` with a readable message. `isNoteName` and `isChordSymbol` check without throwing.

## Fretboard engine

`src/services/fretboard`, imported through `index.ts`. Pure functions; depends only on music theory.

- `Tuning` lists open strings as MIDI numbers, low to high (standard = 40 45 50 55 59 64). `TUNINGS` holds standard, half step down, drop D, DADGAD, open G and open D.
- `createInstrument({ tuning, capo, fretCount, handedness })` validates and returns `{ ok, instrument }` or `{ ok: false, errors }` with a code and a readable message per problem. It never throws, so saved or user-entered tunings can't crash the app. Limits: 4–12 strings, 12–36 frets, whole-fret capo below the last fret, every pitch within MIDI 0–127.
- **String numbering:** 1 = highest-pitched string (high E) to N = lowest (low E is 6), matching guitar convention and TESTING.md.
- **Frets are absolute neck frets.** With a capo on fret c, fret c is the lowest playable fret and sounds as the "open" string; frets below c are unplayable. Fret 5 sounds the same with or without a capo, so shapes and register logic don't need to know about the capo.
- `pitchAt(instrument, string, fret)` = open MIDI + fret. It's the only place pitch is derived from a position; everything else calls it via `positionAt` / `allPositions`.
- `findPositions(instrument, { pitchClass } | { midi }, range?)` returns every matching position; `markPositions(instrument, { root, scale, chordTones }, range?)` tags every position with independent `isRoot`, `isScaleNote` and `isChordTone` flags.
- `positions.ts` builds the five connected scale positions and Low/Middle/High register selection on top of these functions.

## Fretboard component

`src/components/fretboard`. Display and interaction only: it gets `MarkedPosition`s from the engine and a `noteName` function from the theory module, so it holds no pitch math.

- SVG, one column per fret in the range, string 1 at the top. Left-handed mirrors the columns. A nut is drawn when the range starts at fret 0, a capo bar when it starts at the capo fret.
- Roles never rely on color: square = root, circle = scale note, outer ring = chord tone, hollow ring = chord tone outside the scale, plus a text label on every marker and a `FretboardLegend` in words.
- The board is an ARIA `grid` (rows = strings, gridcells = frets) with one tab stop. Arrow keys move along the drawn neck (mirrored for left-handed), Home/End jump to the ends of a string, Enter/Space/click select. Each cell's accessible name reads like "String 6 (E), fret 5: A, root, chord tone, scale note".
- `FretboardExplorer` is the workspace control: key, scale, chord symbol, tuning, capo, handedness and "show all notes", with a live readout of the selected note's exact pitch (e.g. "D4"). For pentatonic scales it adds a shape picker (presets Just 1 / 1–2 / 1–3 / 1–4 / All 5 plus a checkbox per shape). The chosen shapes go to `markPositions`, which keeps roles only on notes inside them and records `shapeNumbers` per note, and to `Fretboard`, which labels each shape's fret span above the neck.

## Audio service and song player

`src/services/audio` and `src/services/validation` are plain TypeScript with no React; `src/hooks/useLocalSong.ts` wires them to one `<audio>` element, and `src/components/player` draws the controls.

- **Single clock.** `createPlaybackController(media)` mirrors the element's events into a `PlaybackState` (status `empty` / `loading` / `ready` / `error`, playing, currentTime, duration, volume, muted, error) for `useSyncExternalStore`. It never runs its own timer. `getCurrentTime()` reads the element directly; anything that tracks the music (the timeline and fretboard later) should call it. `usePlaybackTime` reads it every animation frame while playing and at once on any change, so a seek shows immediately.
- **Files.** `validateAudioFile(file, canPlayType)` checks size (1 byte to 200 MB), format (extension first, MIME type as fallback) and whether this browser can play it, and returns a readable error instead of throwing. Playback uses an object URL for the file, revoked when another song opens or the workspace unmounts. A refused file leaves the current song loaded.
- **Decoding for analysis.** After the element reports the duration, `decodeForAnalysis` decodes the file with an `OfflineAudioContext` at 44.1 kHz and averages the channels into one `Float32Array` (`DecodedAudio`). Songs over 20 minutes are played but not decoded, to keep memory bounded (20 minutes is about 212 MB of samples). A decode failure doesn't stop playback. A decode that finishes after another song was opened is dropped.
- `App` owns `useLocalSong()` so later phases (analysis, timeline, guidance) share the same song and clock. Phase 4 reads `analysisAudio` when its status is `ready`.
- Waveform: `computePeaks` + `normalizePeaks` give 240 bars. The SVG is pointer-only and hidden from assistive technology; the Position slider (with spoken `aria-valuetext`) is the accessible way to seek. Played bars are solid and unplayed bars faint, with a playhead line, so progress isn't shown by color alone.

## Analysis service

`src/services/analysis`, imported through `index.ts`. Plain TypeScript, no dependencies; uses the theory module for chord formulas and spelling. All results are estimates with a `Confidence` (`value` 0–1 and `level` high / medium / low at 0.7 and 0.4).

- **Interface.** The UI talks only to an `AnalysisEngine` (`analyze(input, onProgress) → { result, cancel }`). `createWorkerEngine` runs `analyzeAudio` in `analysis.worker.ts`; if the worker can't start, the same job runs on the page. `useSongAnalysis` starts a job when the song's decoded audio is ready and cancels it when another song opens, so a late result never shows for the wrong song.
- **Features** (`features.ts`, `fft.ts`): a chromagram from ~186 ms windows (G2–B6, each note's FFT bins weighted to sum to 1 so noise doesn't favour high pitch classes) and an onset envelope at 100 frames/s from spectral flux over 36 log-spaced bands (so cymbals don't drown out kick, bass and strums).
- **Tempo** (`tempo.ts`): autocorrelation with a preference around 120 BPM picks the beat period; dynamic programming (Ellis 2007) places beats; if offbeats are at least 60% as strong as beats, the tempo is doubled (kick on 1 and 3, snare on 2 and 4 otherwise reads as half speed). Moderately strong offbeats set `doubleTimeBpm` and cap the confidence at medium. BPM comes from a line fitted through the beat times.
- **Chords** (`chords.ts`): chroma averaged over half beats (or 0.5 s steps without a steady beat) is compared by cosine similarity with templates built from `chordPitchClasses` plus the first five harmonics, for major, minor, 7 and m7 on all 12 roots, then smoothed with a Viterbi pass (`viterbi.ts`). Quiet or unpitched segments are "no chord". Confidence is the chord's softmax share per segment.
- **Key** (`key.ts`): Krumhansl–Kessler profile correlation plus up to 0.5 for how well the recognized chords fit each key as diatonic chords (tonic 1, IV/V 0.7, others 0.4; major V allowed in minor). Chord fit separates keys that share six notes (E vs B major). Tonal sections come from 16-second windows smoothed with Viterbi; sections under 20 s are folded in. When the key changes, the single key's confidence is capped at low.
- **Separation of layers.** `ChordEvent.source` is always `'auto'` here. User corrections (Phase 5) go in their own layer and never overwrite these results.
- **Errors.** `AnalysisError` with codes `too-short` (< 5 s), `silent`, `failed` and `cancelled`; each message says what to do next. A result for noise says it's very uncertain instead of failing.
- **Limits.** Assumes A = 440 Hz; names only major, minor, 7 and m7 (others show as the nearest); no time signature, sections or slash chords; tested only on synthetic audio so far.

## Core data types (planned)

- `PitchClass` (0–11), `Note` (pitch class + octave + spelling)
- `Tuning`, `Instrument` (strings, tuning, capo, fret count, handedness)
- `ScaleDefinition` (name + interval formula), `ChordDefinition`
- `FretPosition` (string, fret, note), `ScalePosition` (fret range, positions, roots, neighbors)
- `ChordEvent` (chord, start, end, confidence?, source: `auto` | `user`)
- `AnalysisResult` (key, tempo, chord events, confidence, status, error)
- `PracticeSession` (audio reference, key/scale, progression, loop range, settings)

Timestamps are in seconds (floating point) everywhere.

## Decision log

| Date | Decision | Reason |
|---|---|---|
| 2026-10-29 | Browser-first, local processing | PROJECT_INSTRUCTIONS §3 and §6, privacy |
| 2026-10-29 | Own theory module instead of Tonal.js | The needed core is small (under 800 lines). Owning it keeps one tested source of truth with the exact types the fretboard and recommendation engines need, and adds no dependency. Revisit if we need a broad chord dictionary or chord detection from note sets. |
| 2026-10-29 | TypeScript 6.0, not 7 | typescript-eslint supports TypeScript below 6.1 only |
| 2026-10-29 | Strings numbered 1 (high) to N (low); frets absolute, capo fret = lowest playable | Matches guitar convention and TESTING.md; scale shapes and register selection stay capo-independent |
| 2026-10-29 | Instrument validation returns errors instead of throwing | Tunings can come from saved sessions or user input (PROJECT_INSTRUCTIONS §9) |
| 2026-10-29 | Fretboard as an SVG ARIA grid with a roving tab stop | One tab stop for 130+ cells; arrow keys match how players move on the neck; WCAG 2.2 AA |
| 2026-10-29 | Build order follows SOP §21: analysis before the chord timeline | Mark's decision; manual chord editing becomes the correction layer on top of analysis results |
| 2026-10-29 | Native `<audio>` element + Web Audio decode; no Tone.js or wavesurfer.js yet | The element gives play, pause, seek, volume and an accurate clock for every format the browser supports; `OfflineAudioContext` gives samples for analysis. A ~40-line SVG waveform covers the overview. Revisit Tone.js for speed change without pitch shift (Phase 6) and wavesurfer.js if we need zoom or regions |
| 2026-10-29 | 200 MB file limit; analysis decode limited to 20 minutes, mono 44.1 kHz | Keeps the in-browser decode within memory on ordinary laptops and phones; 44.1 kHz is what Essentia.js expects |
| 2026-10-29 | Own analysis DSP instead of Essentia.js | Essentia.js is AGPL-3.0 (would bind the app's licence), ~10 MB of WASM, and unpublished since 2022. Meyda (MIT) only extracts features. The classic methods needed (chroma, onset autocorrelation + DP beats, key profiles, chord templates + Viterbi) are ~900 lines, testable, and run in a worker on any browser. Revisit a model-based chord recognizer if real-recording accuracy is poor |
