# Architecture

Documents the technical architecture, module boundaries, and recorded decisions. The full requirements are in PROJECT_INSTRUCTIONS §3–§8. This file records how they're realized and why.

**Status (2026-10-29):** App scaffolded. The music theory module, fretboard engine (instrument model, positions) and SVG fretboard component are implemented; other modules are planned.

## Platform

A browser-based app built with React + TypeScript + Vite. Audio is processed locally. A Windows desktop build (Tauri 2) comes later, once the web app is stable.

## Modules

| Module | Location | Responsibility | Depends on |
|---|---|---|---|
| Music theory | `src/services/music-theory` | Pitch classes, intervals, scales, chords, transposition | none |
| Fretboard engine | `src/services/fretboard` | Instrument model (tuning, capo, strings), note↔position mapping, scale positions, register selection | music theory |
| Audio service | `src/services/audio` | Load, play, pause, seek, loop, speed; exposes playback time | browser audio APIs |
| Timeline engine | `src/services/state` | Chord events, active-event lookup from playback time, corrections layer | audio service (time only) |
| Analysis service | `src/services/analysis` | Key, tempo, chord estimates behind a replaceable interface | audio data |
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
| — | Analysis engine | To decide in Phase 4 after testing against known audio |
