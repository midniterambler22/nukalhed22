# Implementation Plan

Tracks milestones, tasks, dependencies, and progress. Update this file as work completes.

**Status (2026-10-29):** Phase 1 is done except Playwright/axe-core in the repo. Phase 2 has started: the SVG fretboard shows any key, scale and chord with keyboard navigation, and pentatonic scales can be shown as any mix of the five shapes (just 1, 1–2, 1–2–3, all 5, or a custom set). Phase 3 is done: a local song can be chosen or dropped, played, paused, seeked and decoded in the browser for analysis. Phase 4 is done for synthetic reference songs: key, tempo, beats and chords are estimated on the device with confidence; accuracy on real recordings hasn't been measured yet.

**Phase 5 (2026-10-30):** the chord timeline can be corrected: chord names and timings, adding and removing changes, key and tempo, "Needs review" on anything less than likely, and looping a chord or a run of chords. Corrections are a separate layer, saved in the browser, and survive re-running analysis. **Scale library (2026-11-06):** the 20 scales of UI_SPEC §6 are in. **Next:** boxes for non-pentatonic scales and recommendations, then analysis accuracy on real recordings (Fool In The Rain baseline in TESTING.md).

**UI spec (2026-10-29):** Mark's [UI_SPEC.md](UI_SPEC.md) Phase 1 (UI foundation) is done: studio design tokens, header, responsive multi-panel workspace, waveform and chord timeline, and the Scale Viewer tab. The spec's phase list differs from this plan (it has 20 scales, YouTube in its Phase 4, Build My Solo in Phase 6); this plan hasn't been reordered until Mark decides.

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
- [x] Studio workspace from UI_SPEC Phase 1: tokens, header, tabs, multi-panel responsive layout, sticky playback bar, Help and Settings
- [x] Record the decision on using Tonal.js vs. our own module in ARCHITECTURE.md

**Done when:** the app builds and starts, type check and lint pass, and theory and fretboard unit tests pass.

## Phase 2 — Fretboard learning

Goal: a user can pick a key and scale and see accurate, connected positions. (SOP §5)

- [x] SVG fretboard: strings, frets, markers, note labels
- [x] Note selection and root-note highlighting
- [x] Scale-note and chord-tone highlighting, distinguished by shape/label, not color alone
- [x] Five connected minor-pentatonic positions (fret ranges, roots, exact string/fret pairs), shown one at a time or in any combination
- [x] Shared notes between adjacent positions; next/previous navigation (shared notes are named "boxes 1 and 2"; previous/next box buttons)
- [x] Low / Middle / High register selection that picks valid positions
- [x] Configurable neck length (12, 15, 22, 24 frets) that doesn't change the underlying calculations
- [x] Keyboard navigation and visible focus on the fretboard
- [ ] Optional fingering and interval labels
- [x] Left-handed display

**Done when:** a user selects a key and minor pentatonic and can move accurately between all five positions using the keyboard.

## Phase 3 — Audio upload and playback

Goal: load and play a local song reliably. (SOP §7, SOP §21 step 5)

- [x] Local file selection and drag-and-drop; format validation; documented size limit (200 MB; MP3, WAV, M4A, AAC, FLAC where the browser plays them)
- [x] Play, pause, seek, ±5 s, volume and mute; current time and duration
- [x] Waveform overview with playhead (click to seek)
- [x] Clear loading and error states; release object URLs
- [x] Decode audio for analysis in the browser (no upload anywhere): mono, 44.1 kHz, songs up to 20 minutes
- [ ] Check playback in Safari and Firefox (only Chromium checked so far)

**Done when:** a user loads an MP3 or WAV and can play, pause and seek it, and unsupported or broken files get a clear message.

## Phase 4 — Automated analysis

Goal: estimate key, tempo, and chords from audio, with honest confidence. (SOP §8, SOP §21 step 6)

- [x] Evaluate Essentia.js and alternatives; record the decision (ARCHITECTURE.md decision log: own DSP)
- [x] Replaceable analysis interface (`AnalysisEngine`); runs locally in a Web Worker
- [x] Tempo and beat estimation, with a half/double-time check
- [x] Key estimation, with alternatives and key-change sections
- [x] Chord recognition with timestamps (major, minor, 7, m7)
- [x] Confidence display; uncertain results labelled as estimates
- [x] Clear states for analysis in progress, failed, and low confidence
- [~] Measure accuracy on real recordings with known chords. First real song measured (Mark's copy of Fool In The Rain, 2026-10-30): key, tempo and chord changes all off; see TESTING.md. Follow-up: shuffle/triplet tempo, steadier chords, tuning detection
- [ ] Check analysis in Safari and Firefox (only Chromium checked so far)

**Done when:** a loaded song shows an estimated key, tempo and chord list with confidence, and failures say what happened and what to do next.

## Phase 5 — Chord progression timeline

Goal: a synchronized, correctable chord timeline. (SOP §9, SOP §21 step 7)

- [x] Chord timeline display; current and upcoming chord
- [x] Active chord driven by the audio element's playback time; correct after seeking
- [x] Edit chord labels and timings; add and remove chords
- [x] Corrections stored separately from automatic results (time-based spans over the estimate; saved in this browser per file)
- [x] Manual entry for songs where analysis fails
- [x] Correct the key and tempo (with ×½, ×⅔ for shuffles, ×2)
- [x] "Needs review" on chords, key and tempo that are less than likely, cleared by checking or correcting them
- [x] Loop a chord or a run of chords from the playback bar or the chord editor, driven by the audio clock
- [ ] Snap edited times to beats; drag chord boundaries on the timeline

**Done when:** the current chord stays correct through play, pause and seek, and a user's corrections survive re-running analysis.

## Next — Scale library (UI_SPEC §6)

- [x] All 20 scales in four groups (pentatonic and blues; major and modes; minor and harmonic variations; advanced and exotic), as interval formulas, on all 12 roots
- [x] Boxes for the two blues scales: the pentatonic's five boxes plus the blue note wherever it falls inside a box
- [ ] Boxes for the seven-note scales and the other six- and eight-note scales; today they show every note in the chosen register

## Phase 6 — Recommendations and guided practice

Goal: practice over a song with chord-aware guidance. (SOP §10, §11 and §13; SOP §21 steps 8–10)

- [ ] Recommended scale, starting fret, and target notes, with plain-language reasons
- [ ] Highlight chord tones over the scale as the chord changes
- [ ] Synchronized workspace: one timeline drives chords, recommendation and fretboard
- [ ] Section looping (chord loops done in Phase 5; song sections need section detection) and playback-speed control
- [ ] Contextual explanations ("Learn Why")
- [ ] Save and reload a practice session locally

**Done when:** the PROJECT_INSTRUCTIONS §12 MVP works end to end.

## Phase 7 — Expansion

- [ ] Authorized YouTube search and playback (SOP §12)
- [ ] More scales, arpeggios, and modes; alternate tunings
- [ ] Practice tracking
- [ ] Windows packaging with Tauri 2 (SOP §16)
