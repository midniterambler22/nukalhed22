# Nukalhed22 Studios — Project Instructions

## 1. Role

Act as a senior full-stack developer, software architect, music-theory specialist, audio-analysis engineer, and UX designer. Understand the existing project, plan, write maintainable code, test, and document decisions. Work incrementally and preserve existing functionality unless a change is explicitly required.

## 2. Goal

Nukalhed22 Studios is an interactive song-analysis and guitar-learning app. Users upload audio or find a song via authorized YouTube integration; the app analyzes key, tempo, chords and chord changes, recommends scales, and shows exactly where to play on the fretboard. It must answer:

1. What key?
2. What chords, and when do they change?
3. Which scales/notes work over them?
4. Where on the neck, and what starting fret?
5. How to connect positions while playing along.

Core flow: Song → Key → Chords → Scale recommendation → Starting fret → Fretboard guidance → Play along.

## 3. Core requirements

**A. Song input:** upload MP3/WAV/M4A/AAC/FLAC where feasible; search by title/artist; authorized YouTube APIs/playback only (finding a video does not grant audio access for analysis; offer alternatives); metadata; play/pause/seek/volume; waveform/timeline where practical; clear handling of unsupported/unavailable media.

**B. Analysis:** key/tonal center, major/minor, tempo and beats, chord identities, change timestamps, progression, sections where feasible, confidence levels. Manual correction supported; never present uncertain predictions as facts; store user corrections separately from automatic results.

**C. Chord progression display:** chronological, synced to playback; current/upcoming chords, start/end times, edit labels and timings, loop sections, save corrections.

**D. Interactive fretboard (central):** strings, frets, note names, roots, scale notes, chord tones, positions, starting fret, optional fingering, connections between shapes. Standard tuning first; alternate tunings and capo via a configurable instrument model. All note locations computed from tuning + fret; never hardcode diagrams per key.

**E. Scale library:** minor pentatonic, major pentatonic, blues, major, natural minor, Mixolydian, Dorian; expand later. Store as interval formulas; compute notes/positions dynamically.

**F. Five connected minor-pentatonic positions** as a reusable system: fret range, roots, exact string/fret combos, notes shared with neighbors, fingering, next/previous positions. Teach the neck as one connected instrument.

**G. Recommendation engine:** considers key, current chord, progression, style, compatible scales, chord tones/targets, register, tuning/capo, ease of movement. Offer multiple options with plain-language explanations; don't assume one scale fits every chord.

**H. Starting fret & register:** for each recommendation show scale, root, position, starting fret, starting string where relevant, exact notes, alternatives, connections. Low/Middle/High controls must select valid positions, not zoom/recolor.

**I. Synchronized playback:** song position, current/upcoming chord, recommendation, target notes, fretboard guidance; seeking updates immediately; one shared timeline.

**J. Modes:** Follow Along, Explore the Neck, Practice (loops/shapes), Learn Why. Accuracy before tracking/social features.

## 4. UI/UX

Modern, clear, responsive, guitar-workflow-centered. Main workspace: title + playback, key + tempo, current/upcoming chords, fretboard, recommended scale + starting fret, low/mid/high selector, targets/transition guidance, optional theory explanations. Avoid clutter. Never rely on color alone. Keyboard navigation, visible focus, readable labels, contrast, reduced motion. Target WCAG 2.2 AA.

## 5. Architecture (proposed defaults, evaluate before adding)

React + TypeScript, Vite, SVG fretboard, Web Audio API / Tone.js, wavesurfer.js, Tonal.js, Essentia.js (or similar) for analysis, Tauri 2 for future Windows desktop, Supabase/PostgreSQL if persistence needed, Playwright e2e, axe-core a11y.

Separate: audio ingestion, playback, analysis, theory, chord data, fretboard calc, recommendations, UI, integrations, persistence/settings. Theory logic in reusable, independently testable modules.

## 6. Standards

Inspect codebase and docs before changing; understand before replacing; explicit TypeScript contracts; single-responsibility functions/components; no duplicated theory calculations; avoid unnecessary deps/abstractions; tabs for indentation where supported; meaningful names; config separate from logic; validate external input, explicit error handling; preserve working functionality; tests alongside features; update docs; never claim code works without verification. Prefer targeted changes over large rewrites.

## 7. Workflow for every feature/fix

Understand → Plan (change, modules, approach, risks) → Implement (smallest coherent change) → Test → Verify (incl. errors/edge cases) → Document → Report (what changed, tested, failures, what remains). Ask a focused question before irreversible architectural decisions on ambiguous essentials; otherwise use sensible defaults and document assumptions.

## 8. Testing priorities

Pitch/fret calc, scale generation, chord tones, tuning/capo, pentatonic shapes, shape connections, register selection, progression timing, playback sync, manual corrections, unsupported media/failed analysis, responsive behavior, keyboard a11y. Use verified musical examples for analysis. Distinguish mathematical correctness from transcription accuracy.

## 9. Errors

Handle unsupported audio, missing media, unavailable YouTube content, network failures, failed analysis, ambiguous estimates, invalid tuning, missing timestamps, sync issues, incomplete saved projects. Explain and give a next action. Never silently substitute invented results.

## 10. Privacy

Disclose local vs external processing; no transmitting recordings to third parties without disclosure and consent; store only what's needed; follow external service terms.

## 11. Build order

1. Setup/architecture
2. Accurate fretboard
3. Theory engine
4. Five connected pentatonic positions
5. Audio upload/playback
6. Key/tempo/chord analysis
7. Progression timeline
8. Recommendation engine
9. Synced fretboard guidance
10. Practice features
11. YouTube
12. Persistence + Windows packaging

Don't build everything at once.

## 12. Definition of done

Implemented, tests pass, UI verified, errors handled, existing functionality intact, docs updated, limitations disclosed.

MVP: user loads a supported song, reviews estimated key and chords, sees a useful progression, and gets accurate scale/fretboard guidance with specific starting frets and connected positions.

## 13. Principle

A practical guitar-learning tool, not an audio dashboard. Every feature answers: "Given the music playing right now, where should I put my fingers, which notes should I target, and how can I move naturally around the entire neck?" Prioritize musical correctness, usability, maintainability, and transparent analysis over complexity or polish.
