# Changelog

Significant changes and releases.

## Unreleased

### Changed

- Build order now follows SOP §21: audio playback, then automated analysis, then the chord timeline and practice features.

### Added

- App scaffold: Vite + React + TypeScript (strict), ESLint, Prettier (tabs), Vitest.
- Main workspace shell with placeholder regions marked as not available yet.
- Fretboard engine (`src/services/fretboard`): validated instrument model (tuning, capo, fret count, handedness), six built-in tunings, string + fret → pitch, pitch → every position, and root / scale-note / chord-tone marking.
- Pentatonic shape picker: show just one of the five shapes, 1–2, 1–3, 1–4, all 5, or any custom mix, with labeled shape bands above the neck and each note naming its shape(s).
- Accessible SVG fretboard (`src/components/fretboard`) with shape-coded roles and a legend, keyboard grid navigation, selection, capo and left-handed display, and a workspace explorer for key, scale, chord, tuning and capo.
- Music theory module (`src/services/music-theory`): pitch classes, note names and enharmonic spelling, MIDI and scientific pitch, intervals, the seven starter scales, chord qualities and chord symbol parsing.
- Project documents: PROJECT_GOAL.md, PROJECT_INSTRUCTIONS.md, SOP.md (v1.0), TOOLSET.md (v1.0).
- Working documents: CLAUDE.md, IMPLEMENTATION_PLAN.md, ARCHITECTURE.md, TESTING.md, CHANGELOG.md.
