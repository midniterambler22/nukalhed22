# Nukalhed22 Studios — Development SOP

Standard operating procedure for building and maintaining Nukalhed22 Studios, the interactive song-analysis and guitar-learning app. Follow it for every feature, fix, redesign, integration, and release unless Mark says otherwise.

Every piece of work answers one question: **"Given the music playing right now, where should I put my fingers, which notes should I target, and how can I move naturally around the entire neck?"** Musical correctness, usability, maintainability, and transparent analysis come before complexity or polish.

---

## 1. Core principles

- **Correctness first.** A wrong note on the fretboard is a bug, not a cosmetic issue. Theory and fretboard math must be verifiably right before UI polish.
- **Compute, never hardcode.** Every note location comes from tuning + capo + fret. Scales are interval formulas. No per-key diagrams, no lookup tables of shapes by key.
- **Honest analysis.** Estimated key, tempo, and chords always carry a confidence level. Never present a guess as fact, never silently substitute invented results, and keep user corrections separate from automatic results.
- **Small vertical slices.** Each change delivers one complete, testable outcome and leaves the app working.
- **Preserve what works.** Inspect before editing, understand before replacing, prefer targeted changes over rewrites.
- **Accessibility and error handling are part of every slice**, not a final QA phase. Target WCAG 2.2 AA.
- **Local by default.** The app runs and processes audio locally. No public hosting, cloud accounts, or third-party audio processing unless Mark explicitly asks, and never without disclosure and user consent.
- **Verify before claiming.** Never say a test, build, or check passed unless it actually ran. If it can't run, state the blocker and do the closest meaningful check.
- **Ask only when it matters.** Use sensible defaults and document assumptions. Ask one focused question before an irreversible architectural decision on an ambiguous essential.
- **No secrets in code**, logs, screenshots, client bundles, or version control.

## 2. Per-change workflow

Every feature or fix goes through these seven steps.

| Step | What to do | Output |
|---|---|---|
| 1. Understand | Read the relevant code, docs, and this SOP. Identify the user outcome and which of the five core questions it serves (key, chords/changes, scales, where on the neck, connecting positions). | Short problem statement |
| 2. Plan | Name the change, the modules touched, the approach, and the risks. Check for an existing utility before writing a new one. | Plan in the PR description or issue |
| 3. Implement | Smallest coherent change. Explicit TypeScript contracts. Theory logic in pure, reusable modules. | Code + tests together |
| 4. Test | Unit tests for logic, component tests for UI, e2e for workflows. Use verified musical examples. | Passing test run |
| 5. Verify | Run the app and check the change in a browser, including error states, edge cases, keyboard use, and narrow screens. | Notes on what was checked |
| 6. Document | Update README, `docs/`, code comments where intent isn't obvious, and known limitations. | Updated docs |
| 7. Report | Use the handoff format in section 11. | PR description / reply |

## 3. Build order

Work through these phases in order. Don't start a phase until the previous one's core is correct and tested. Don't build everything at once.

1. **Project setup and architecture** — Vite + React + TypeScript, lint/format/type-check, Vitest, Playwright, axe-core, folder structure per section 5.
2. **Accurate fretboard** — SVG fretboard driven by a configurable instrument model (strings, tuning, capo, fret count).
3. **Theory engine** — notes, intervals, scale formulas, chord formulas, chord tones, key handling.
4. **Five connected minor-pentatonic positions** — fret ranges, roots, exact string/fret pairs, notes shared with neighbors, fingering, next/previous links.
5. **Audio upload and playback** — MP3/WAV/M4A/AAC/FLAC where the browser supports it; play/pause/seek/volume; waveform where practical.
6. **Key, tempo, and chord analysis** — with confidence levels and manual correction.
7. **Progression timeline** — chronological, editable, loopable, synced to playback.
8. **Recommendation engine** — multiple scale options per chord/section with plain-language reasons.
9. **Synced fretboard guidance** — one shared timeline drives current chord, recommendation, targets, and fretboard.
10. **Practice features** — loops, shape drills, Follow Along / Explore / Practice / Learn Why modes.
11. **YouTube integration** — authorized APIs and playback only.
12. **Persistence and Windows packaging** — saved projects, settings, Tauri 2 desktop build.

**MVP is reached** when a user can load a supported song, review the estimated key and chords, see a useful progression, and get accurate scale and fretboard guidance with specific starting frets and connected positions.

## 4. Technology defaults

These are starting defaults. Evaluate each before adding it, and record the decision (and any alternative chosen) in `docs/ARCHITECTURE.md`.

| Concern | Default |
|---|---|
| UI | React + TypeScript, Vite |
| Fretboard rendering | SVG |
| Audio playback | Web Audio API, Tone.js if needed |
| Waveform | wavesurfer.js |
| Music theory | Tonal.js (wrapped behind our own theory module) |
| Audio analysis | Essentia.js or similar, run locally |
| Unit/component tests | Vitest + Testing Library |
| End-to-end tests | Playwright |
| Accessibility checks | axe-core (via Playwright) + manual keyboard testing |
| Desktop (later) | Tauri 2 for Windows |
| Persistence (later, only if needed) | Local storage first; Supabase/PostgreSQL only if sync is required |

Avoid unnecessary dependencies and abstractions. A new dependency needs a reason in the PR description.

## 5. Architecture and module boundaries

Keep these concerns separate. UI components never do theory math directly; they call the theory and fretboard modules.

| Module | Responsibility |
|---|---|
| `audio/ingest` | File validation, decoding, unsupported-format errors |
| `audio/playback` | Transport (play/pause/seek/volume), the shared timeline clock |
| `analysis` | Key, tempo, beats, chords, sections, confidence values |
| `theory` | Notes, intervals, scale and chord formulas, chord tones. Pure functions, no UI or audio imports |
| `instrument` | Tuning, capo, string count, fret count, validation of invalid tunings |
| `fretboard` | Maps theory output onto string/fret positions; pentatonic position system and connections |
| `progression` | Chord timeline data, user corrections (stored separately from automatic results), loops |
| `recommend` | Scale/position recommendations with reasons, register (Low/Middle/High) selection |
| `ui` | Components and screens |
| `integrations` | YouTube and any other external service |
| `persistence` | Saved projects and settings |
| `config` | Constants and settings, kept out of logic |

Rules:

- **No duplicated theory calculations.** If two places need the notes of a scale, both call `theory`.
- **One shared timeline.** Playback position is the single source of truth for current chord, recommendation, targets, and fretboard highlight. Seeking updates everything immediately.
- **Automatic vs. user data.** Analysis results are never overwritten by corrections; corrections are a separate layer applied on top.
- **Register controls select positions.** Low/Middle/High choose valid scale positions in that part of the neck. They do not zoom or recolor.

## 6. Coding standards

- Inspect the codebase and docs before changing anything.
- Explicit TypeScript types at module boundaries; no `any` without a comment explaining why.
- Single-responsibility functions and components; meaningful names.
- Tabs for indentation where the tooling supports it.
- Config and constants separate from logic; no magic numbers in theory or fretboard code.
- Validate all external input (files, metadata, API responses, saved projects) and handle errors explicitly.
- Write tests alongside the feature, in the same PR.
- Keep the app working after every commit.

## 7. Testing

### Priorities

Test these areas first and most thoroughly:

1. Pitch and fret calculation (string + fret → note, including capo)
2. Scale generation from interval formulas
3. Chord tones
4. Tuning and capo changes, including invalid tunings
5. Pentatonic shapes and their exact positions
6. Shape connections (shared notes, next/previous)
7. Register selection (Low/Middle/High return valid positions)
8. Progression timing and change timestamps
9. Playback sync (seek, loop, current/upcoming chord)
10. Manual corrections stored separately and applied correctly
11. Unsupported media and failed analysis
12. Responsive layout
13. Keyboard accessibility

### Test types

- **Unit (Vitest):** all of `theory`, `instrument`, `fretboard`, `recommend`, and progression logic. These modules should have high coverage.
- **Component (Testing Library):** fretboard rendering, controls, timeline, correction UI.
- **End-to-end (Playwright):** load song → review analysis → see progression → get fretboard guidance; seek and loop; error flows.
- **Accessibility (axe-core + manual):** automated scan on every main screen, plus a keyboard-only pass for new interactive controls.

### Musical correctness vs. transcription accuracy

Keep these separate in tests and in reporting:

- **Mathematical correctness** (fret math, scales, chord tones, shapes) must be exact. Use verified reference values, for example A minor pentatonic position 1 starting at the 5th fret in standard tuning.
- **Transcription accuracy** (key, tempo, chord detection from audio) is statistical. Test against a small set of verified songs or synthesized clips with known answers, report accuracy as a measured rate, and never claim analysis is "correct", only how often it matched.

## 8. UI and accessibility standards

- Main workspace shows: song title and playback, key and tempo (with confidence), current and upcoming chords, the fretboard, recommended scale and starting fret, Low/Middle/High selector, target notes and transition guidance, and optional theory explanations.
- Avoid clutter. A guitar-workflow tool, not an audio dashboard.
- **Never rely on color alone.** Roots, chord tones, and scale notes also differ by shape, label, or pattern.
- Full keyboard navigation and visible focus on every control, including the fretboard.
- Readable labels and sufficient contrast (WCAG 2.2 AA).
- Respect `prefers-reduced-motion`.
- Responsive from phone to desktop; the fretboard stays usable on narrow screens (horizontal scroll inside the fretboard is acceptable; page-level horizontal scroll is not).

## 9. Error handling

Every error tells the user what happened and what to do next. Never silently substitute invented results.

| Situation | Expected behavior |
|---|---|
| Unsupported audio format | Name the format, list supported formats, suggest converting |
| Missing or unreadable media | Explain and offer to re-upload |
| YouTube video unavailable or not analyzable | Explain that finding a video doesn't grant audio access for analysis; offer upload or manual chord entry |
| Network failure | Explain, offer retry, keep local work intact |
| Analysis failed | Say so; offer retry or manual entry of key and chords |
| Low-confidence estimate | Show it with its confidence and invite correction |
| Invalid tuning or capo | Reject with a clear reason; keep the previous valid setting |
| Missing timestamps | Show the progression without sync and say why |
| Sync drift | Resync to the playback clock; never show a stale chord as current |
| Incomplete saved project | Load what's valid, flag what's missing |

## 10. Privacy

- Say clearly whether processing happens locally or externally.
- Never send recordings to a third party without disclosure and explicit consent.
- Store only what's needed.
- Follow the terms of every external service, especially YouTube.

## 11. Git, PRs, and reporting

- Work on a feature branch; one coherent change per PR.
- PR description covers the plan from step 2 and the report below.
- CI (once set up) must run type-check, lint, unit tests, and e2e/a11y tests; don't merge red.
- Never skip or disable a test to get green.

**Handoff / report format** for every substantial change:

1. **Outcome** — what the user can now do.
2. **What changed and why** — files and modules affected.
3. **Tested** — which tests ran and their results; what was checked by hand.
4. **Failures** — anything that failed or couldn't run, with the exact blocker.
5. **Assumptions** — defaults chosen where requirements were unclear.
6. **Limitations and what remains** — known gaps, accuracy limits, next steps.

## 12. Definition of done

A feature is done when:

- [ ] It's implemented and serves one of the five core questions
- [ ] Musical output is verified against known-correct examples
- [ ] Tests are written and pass
- [ ] The UI was checked in a browser, including keyboard and narrow screens
- [ ] Errors and edge cases are handled with a clear next action
- [ ] Existing functionality still works
- [ ] Docs are updated
- [ ] Limitations and confidence levels are disclosed
