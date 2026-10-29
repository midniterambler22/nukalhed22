# Implementation Plan

Tracks milestones, tasks, dependencies, and progress. Update this file as work completes.

**Status (2026-10-29):** Phase 1 is done except Playwright/axe-core in the repo. Phase 2 has started: the SVG fretboard shows any key, scale and chord with keyboard navigation, and the scale-position engine exists but isn't in the UI yet.

**Build order:** This plan follows PROJECT_INSTRUCTIONS §15 and the PROJECT_GOAL §6 initial release scope. Manual chord entry, the timeline, and practice sessions come before automated analysis. SOP §21 lists analysis earlier; Mark hasn't decided between the two yet, so this order may change.

Legend: `[x]` done · `[ ]` not started · `[~]` in progress

---

## Phase 0 — Project documents

- [x] PROJECT_GOAL.md, PROJECT_INSTRUCTIONS.md, SOP.md, TOOLSET.md
- [x] CLAUDE.md, IMPLEMENTATION_PLAN.md, ARCHITECTURE.md, TESTING.md, CHANGELOG.md
- [ ] Settle the build order between SOP §21 and PROJECT_INSTRUCTIONS §15

## Phase 1 — Foundation

Goal: a working, testable app shell with a correct theory and fretboard engine. (SOP §4 and §6)

- [x] Scaffold Vite + React + TypeScript (strict mode)
- [x] Add ESLint, Prettier (tabs), Vitest
- [ ] Add Playwright and axe-core (with the first interactive UI)
- [x] Add npm scripts: dev, build, test, typecheck, lint, format
- [ ] Add npm script: test:e2e
- [x] Fill in commands in CLAUDE.md and README.md
- [x] Music theory module: pitch classes (0–11), note naming/enharmonics, intervals, scale formulas, chord formulas, transposition
- [x] Instrument model: string count, tuning, capo, fret count, validation
- [x] Fretboard engine: string + fret → pitch; note → all positions
- [x] Unit tests against the reference values in TESTING.md
- [x] Main workspace layout shell (placeholder regions clearly marked unavailable)
- [x] Record the decision on using Tonal.js vs. our own module in ARCHITECTURE.md

**Done when:** the app builds and starts, type check and lint pass, and theory and fretboard unit tests pass.

## Phase 2 — Fretboard learning

Goal: a user can pick a key and scale and see accurate, connected positions. (SOP §5)

- [x] SVG fretboard: strings, frets, markers, note labels
- [x] Note selection and root-note highlighting
- [x] Scale-note and chord-tone highlighting, distinguished by shape/label, not color alone
- [~] Five connected minor-pentatonic positions (fret ranges, roots, exact string/fret pairs) (engine in `positions.ts`; UI not yet)
- [~] Shared notes between adjacent positions; next/previous navigation (engine in `positions.ts`; UI not yet)
- [~] Low / Middle / High register selection that picks valid positions (engine in `positions.ts`; UI not yet)
- [ ] Configurable fret range that doesn't change the underlying calculations
- [x] Keyboard navigation and visible focus on the fretboard
- [ ] Optional fingering and interval labels
- [x] Left-handed display

**Done when:** a user selects a key and minor pentatonic and can move accurately between all five positions using the keyboard.

## Phase 3 — Audio and chords

Goal: play a local song with a manually entered, synchronized chord timeline. (SOP §7 and §9)

- [ ] Local file selection and drag-and-drop; format validation; documented size limit
- [ ] Play, pause, seek, volume; current time and duration
- [ ] Clear loading and error states; release object URLs
- [ ] Manual chord entry and editing (label, start, end)
- [ ] Chord timeline display; current and upcoming chord
- [ ] Active chord driven by the audio element's playback time; correct after seeking

**Done when:** a user loads an MP3 or WAV, enters a progression, and the current chord stays correct through play, pause, and seek.

## Phase 4 — Guided practice

Goal: practice over a song with chord-aware guidance. (SOP §10, §11, and §13)

- [ ] Highlight chord tones over the scale as the chord changes
- [ ] Recommended scale, starting fret, and target notes, with plain-language reasons
- [ ] Section looping and playback-speed control
- [ ] Contextual explanations ("Learn Why")
- [ ] Save and reload a practice session locally

**Done when:** the PROJECT_GOAL §6 initial release scope works end to end.

## Phase 5 — Automated analysis

Goal: estimate key, tempo, and chords from audio, with honest confidence. (SOP §8)

- [ ] Evaluate Essentia.js and alternatives against known test audio; record results
- [ ] Replaceable analysis interface
- [ ] Tempo and beat estimation
- [ ] Key estimation
- [ ] Chord recognition with timestamps
- [ ] Confidence display; corrections stored separately from automatic results

## Phase 6 — Expansion

- [ ] Authorized YouTube search and playback (SOP §12)
- [ ] More scales, arpeggios, and modes; alternate tunings
- [ ] Practice tracking
- [ ] Windows packaging with Tauri 2 (SOP §16)
