# Implementation Plan

Tracks milestones, tasks, dependencies, and progress. Update this file as work completes.

**Status (2026-10-29):** Phase 1 is done except Playwright/axe-core in the repo. Phase 2 has started: the SVG fretboard shows any key, scale and chord with keyboard navigation, and the scale-position engine exists but isn't in the UI yet.

**Build order:** This plan follows SOP §21. Mark decided on 2026-10-29 that automated key, tempo and chord analysis comes before the chord timeline and practice features (instead of the manual-chords-first order in PROJECT_INSTRUCTIONS §15). Manual chord editing still exists, as the correction layer on top of analysis results.

Legend: `[x]` done · `[ ]` not started · `[~]` in progress

---

## Phase 0 — Project documents

- [x] PROJECT_GOAL.md, PROJECT_INSTRUCTIONS.md, SOP.md, TOOLSET.md
- [x] CLAUDE.md, IMPLEMENTATION_PLAN.md, ARCHITECTURE.md, TESTING.md, CHANGELOG.md
- [x] Settle the build order: SOP §21, analysis before the timeline (Mark, 2026-10-29)

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

## Phase 3 — Audio upload and playback

Goal: load and play a local song reliably. (SOP §7, SOP §21 step 5)

- [ ] Local file selection and drag-and-drop; format validation; documented size limit
- [ ] Play, pause, seek, volume; current time and duration
- [ ] Clear loading and error states; release object URLs
- [ ] Decode audio for analysis in the browser (no upload anywhere)

**Done when:** a user loads an MP3 or WAV and can play, pause and seek it, and unsupported or broken files get a clear message.

## Phase 4 — Automated analysis

Goal: estimate key, tempo, and chords from audio, with honest confidence. (SOP §8, SOP §21 step 6)

- [ ] Evaluate Essentia.js and alternatives against known test audio; record results
- [ ] Replaceable analysis interface; runs locally, off the main thread
- [ ] Tempo and beat estimation
- [ ] Key estimation
- [ ] Chord recognition with timestamps
- [ ] Confidence display; uncertain results labelled as estimates
- [ ] Clear states for analysis in progress, failed, and low confidence

**Done when:** a loaded song shows an estimated key, tempo and chord list with confidence, and failures say what happened and what to do next.

## Phase 5 — Chord progression timeline

Goal: a synchronized, correctable chord timeline. (SOP §9, SOP §21 step 7)

- [ ] Chord timeline display; current and upcoming chord
- [ ] Active chord driven by the audio element's playback time; correct after seeking
- [ ] Edit chord labels and timings; add and remove chords
- [ ] Corrections stored separately from automatic results
- [ ] Manual entry for songs where analysis fails

**Done when:** the current chord stays correct through play, pause and seek, and a user's corrections survive re-running analysis.

## Phase 6 — Recommendations and guided practice

Goal: practice over a song with chord-aware guidance. (SOP §10, §11 and §13; SOP §21 steps 8–10)

- [ ] Recommended scale, starting fret, and target notes, with plain-language reasons
- [ ] Highlight chord tones over the scale as the chord changes
- [ ] Synchronized workspace: one timeline drives chords, recommendation and fretboard
- [ ] Section looping and playback-speed control
- [ ] Contextual explanations ("Learn Why")
- [ ] Save and reload a practice session locally

**Done when:** the PROJECT_INSTRUCTIONS §12 MVP works end to end.

## Phase 7 — Expansion

- [ ] Authorized YouTube search and playback (SOP §12)
- [ ] More scales, arpeggios, and modes; alternate tunings
- [ ] Practice tracking
- [ ] Windows packaging with Tauri 2 (SOP §16)
