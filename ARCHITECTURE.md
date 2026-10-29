# Architecture

Documents the technical architecture, module boundaries, and recorded decisions. The full requirements are in PROJECT_INSTRUCTIONS §3–§8. This file records how they're realized and why.

**Status (2026-10-29):** App scaffolded. The music theory module is implemented; other modules are planned.

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
| — | Analysis engine | To decide in Phase 5 after testing against known audio |
