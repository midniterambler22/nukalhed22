# Changelog

Significant changes and releases.

## Unreleased

### Changed

- Fretboard colours follow the spec legend: red roots, orange scale notes, blue chord tones. Shapes are now called boxes ("Box 1"). The fretboard explorer is replaced by the Scale Viewer.
- Build order now follows SOP §21: audio playback, then automated analysis, then the chord timeline and practice features.

### Added

- Chord timeline corrections (plan Phase 5): an Edit button on every chord opens an editor to rename it (or pick one of the analysis's alternatives), mark an estimate as right, move its start and end (typed as m:ss.s or taken from the playhead; neighbours grow or shrink), remove the change, undo your edits, play from it or loop it. "Add a chord at the playhead" adds a change, and lets you enter chords by hand when analysis fails or finds none. "Correct key or tempo" sets the key (any of 24) and tempo, with ×½, ×⅔ (shuffle) and ×2. Anything less than likely says "Needs review", with a "Review next" button. Corrections are a separate layer (`src/services/corrections`) laid over the analysis by time, saved in this browser per file, and kept when the analysis runs again; Song Info can remove them. The header, summary, chord list, timeline and Now/Next use the corrected values.
- Loops (`src/services/progression/loop.ts`, `useLoop`): loop the chord playing now from the playback bar, grow or shrink the loop a chord at a time, and see it shaded on the timeline. The loop seeks back on the audio clock; seeking out of the loop isn't fought.
- Time entry helpers `formatPreciseTime` and `parseTime`.

- Studio workspace (UI spec Phase 1): dark navy design tokens and shared controls; a header (logo and name, no tagline) with the song's key, tempo and time signature, Help and Settings; the song, waveform and chord timeline across the top (zoom, click to seek, current chord framed, "Now / Next" chord); song analysis on the left with a detected-chord list that marks the chord playing now and shows each chord's function (I, IV, V…) once the key is likely; workspace tabs (Jam Master, Riff Builder and Chord Viewer marked Planned; Scale Viewer; Song Info); and a playback bar that stays on screen with previous/next chord. Panels stack and collapse on tablets and phones.
- Scale Viewer: key, scale, Low / Middle / High / All register, Box 1–5 toggles with previous/next, and Roots / Chord tones / All note names layers. Each box has its own coloured outline labelled with its register ("Box 3 (Mid)"). Seven-note scales show every note within the chosen register.
- Chord & scale info panel: the chord's tones with intervals, which are in or outside the scale, the scale's notes with intervals, and a plain-language "chord tone focus".
- Settings dialog: tuning, capo, neck length (12, 15, 22 or 24 frets) and left-handed.
- Demo song: a 12-bar blues in A synthesized in the browser that goes through real playback and analysis.
- Theory and engine helpers: `romanNumeral`, `chordTonesInScale`, `positionsInRegister`, `registerOf`, and chord timing (`chordIndexAt`, `nextChangeIndex`, `previousChangeIndex`, `timeMarkers`).
- UI_SPEC.md (Mark's spec, verbatim) and its reference image.

- Automatic song analysis (`src/services/analysis`), on the device: estimated key (with alternatives and key changes), tempo and beats, and chords (major, minor, 7, m7) with times. Every estimate carries a confidence shown in words (likely, possible, uncertain). Runs in a Web Worker, falls back to the page if a worker can't start, and fails with a plain message for silence or audio under 5 seconds.
- Key and tempo panel and chord list (`src/components/analysis`): analysis progress, results with confidence, a "Try again" button after a failure, and chord buttons that move playback to that chord.
- Song player (`src/components/player`): choose or drop a local MP3, WAV, M4A, AAC or FLAC file (up to 200 MB), then play, pause, seek, skip 5 s, and set volume or mute, with a waveform overview and a note that the song never leaves the device. Unsupported, damaged and unplayable files get a message that says what to try next.
- Audio service (`src/services/audio`): playback controller that mirrors one audio element (the app's single clock), in-browser decoding to mono 44.1 kHz samples for analysis (songs up to 20 minutes), waveform peaks, and time formatting.
- Audio file validation (`src/services/validation`): format detection, size limit and browser support check.
- App scaffold: Vite + React + TypeScript (strict), ESLint, Prettier (tabs), Vitest.
- Main workspace shell with placeholder regions marked as not available yet.
- Fretboard engine (`src/services/fretboard`): validated instrument model (tuning, capo, fret count, handedness), six built-in tunings, string + fret → pitch, pitch → every position, and root / scale-note / chord-tone marking.
- Pentatonic shape picker: show just one of the five shapes, 1–2, 1–3, 1–4, all 5, or any custom mix, with labeled shape bands above the neck and each note naming its shape(s).
- Accessible SVG fretboard (`src/components/fretboard`) with shape-coded roles and a legend, keyboard grid navigation, selection, capo and left-handed display, and a workspace explorer for key, scale, chord, tuning and capo.
- Music theory module (`src/services/music-theory`): pitch classes, note names and enharmonic spelling, MIDI and scientific pitch, intervals, the seven starter scales, chord qualities and chord symbol parsing.
- Project documents: PROJECT_GOAL.md, PROJECT_INSTRUCTIONS.md, SOP.md (v1.0), TOOLSET.md (v1.0).
- Working documents: CLAUDE.md, IMPLEMENTATION_PLAN.md, ARCHITECTURE.md, TESTING.md, CHANGELOG.md.
