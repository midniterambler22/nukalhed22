# Architecture

Documents the technical architecture, module boundaries, and recorded decisions. The full requirements are in PROJECT_INSTRUCTIONS §3–§8. This file records how they're realized and why.

**Status (2026-10-29):** Planned only. No application code yet.

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
| — | Tonal.js vs. own theory module | To decide in Phase 1 (TOOLSET §3.1, §12) |
| — | Analysis engine | To decide in Phase 5 after testing against known audio |
