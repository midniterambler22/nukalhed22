# Testing

Documents testing procedures, expected results, and known failures.

**Status (2026-10-29):** Vitest is set up, with Testing Library + jsdom for component tests (opt in per file with `// @vitest-environment jsdom`). 438 tests pass: music theory, fretboard engine, scale positions, the fretboard component, audio file validation, playback, decoding, the song player, the analysis engine and the analysis panels. Playwright and axe-core aren't in the repo yet; the fretboard and player UIs were checked with axe-core in Chromium by hand (see below).

Run `npm test`. Test files sit next to their code as `*.test.ts` / `*.test.tsx`.

## Test layers

| Layer | Tool | Covers |
|---|---|---|
| Unit | Vitest | Theory, fretboard, positions, timeline lookup, data transforms |
| Component | Vitest + Testing Library | Fretboard rendering, controls, timeline |
| End-to-end | Playwright | Load audio, select scale, switch positions, enter chords, seek, loop, save/restore, error states |
| Accessibility | axe-core (in Playwright) + manual keyboard pass | Every main screen; every new interactive control |

## Verification after every meaningful change

From TOOLSET §8.4: relevant unit tests → affected integration tests → e2e where appropriate → type check → lint → production build → inspect the actual interface → record failures here.

## Correctness vs. accuracy

- **Mathematical correctness** (fret math, scales, chords, shapes) must be exact. A failure blocks release.
- **Transcription accuracy** (key, tempo, chords from audio) is measured as a rate against reference recordings. Report the rate; never call analysis "correct".

## Reference values (standard tuning, no capo)

Use these verified values in fretboard tests.

Open strings, low to high: E2, A2, D3, G3, B3, E4.

| String | Fret | Note |
|---|---|---|
| 6 (low E) | 5 | A2 |
| 5 (A) | 5 | D3 |
| 4 (D) | 7 | A3 |
| 3 (G) | 2 | A3 |
| 2 (B) | 1 | C4 |
| 1 (high E) | 12 | E5 |

Capo at fret 2: open string 6 sounds F♯2.

### A minor pentatonic, position 1 (frets 5–8)

Notes: A C D E G.

| String | Frets | Notes |
|---|---|---|
| 6 (low E) | 5, 8 | A, C |
| 5 (A) | 5, 7 | D, E |
| 4 (D) | 5, 7 | G, A |
| 3 (G) | 5, 7 | C, D |
| 2 (B) | 5, 8 | E, G |
| 1 (high E) | 5, 8 | A, C |

Roots (A) inside the box: string 6 fret 5, string 4 fret 7, string 1 fret 5.

### A minor pentatonic, all five positions

Two notes per string. Frets are listed for strings 6 → 1. Each position shares one note per string with the next one. Position 5 continues into position 1 an octave higher (frets 17–20).

| Position | Frets | 6 | 5 | 4 | 3 | 2 | 1 |
|---|---|---|---|---|---|---|---|
| 4 (open) | 0–3 | 0, 3 | 0, 3 | 0, 2 | 0, 2 | 1, 3 | 0, 3 |
| 5 | 2–5 | 3, 5 | 3, 5 | 2, 5 | 2, 5 | 3, 5 | 3, 5 |
| 1 | 5–8 | 5, 8 | 5, 7 | 5, 7 | 5, 7 | 5, 8 | 5, 8 |
| 2 | 7–10 | 8, 10 | 7, 10 | 7, 10 | 7, 9 | 8, 10 | 8, 10 |
| 3 | 9–13 | 10, 12 | 10, 12 | 10, 12 | 9, 12 | 10, 13 | 10, 12 |
| 4 | 12–15 | 12, 15 | 12, 15 | 12, 14 | 12, 14 | 13, 15 | 12, 15 |

Positions 1 and 2 share string 6 fret 8, string 5 fret 7, string 4 fret 7, string 3 fret 7, string 2 fret 8 and string 1 fret 8. Positions two steps apart (1 and 3) share no notes.

Register selection on a 22-fret neck with no capo splits the frets into thirds (0–7⅓, 7⅓–14⅔, 14⅔–22). It picks a position by the middle fret of its range, and lists the best match first:
- Low: positions 5, 4 (open), 1.
- Middle: positions 3, 2, 4.
- High: positions 1, 2, 5, all an octave up.

## Fretboard verification (2026-10-29)

- Unit: every TESTING.md reference value, capo 2 → F♯2, frets below the capo unplayable, drop D, "open + fret" for every built-in tuning across 24 frets, fret-12 octaves, every A in frets 0–12, all positions of A3 and C4, bounds and validation errors.
- Component: gridcell names, shapes per role, single tab stop, arrow/Home/End navigation and edges, left-handed mirroring, Enter/Space/click selection, `aria-selected`, capo and nut drawing, key-aware spelling (B♭ in F major), invalid chord message.
- Manual in Chromium (production build): axe-core reports no violations in light or dark mode or with the chord error showing; Tab enters the grid on the first root; arrow keys and Enter select and the readout updates ("String 3, fret 7: D4"); at 390px wide the page has no horizontal scroll and the fretboard scrolls inside its panel.

- Shapes (unit + component): just shape 1 marks exactly its notes in both octaves; 1–2 adds shape 2 and names overlap notes under both; all 5 covers every scale note between the outer shapes; none marks nothing; a chord tone outside the scale stays marked inside a shown shape's frets; preset buttons and checkboxes; picker hidden for non-pentatonic scales. Manual: axe clean with all 5 and just 1 in light and dark; at 390px the neck scrolls to the first chosen shape.

- Positions (unit, `positions.test.ts`): the five boxes above, exact frets; open E minor; capo 2 F♯ minor position 1 on the capo fret, with nothing below the capo; drop D; every built-in tuning gives ascending, in-scale shapes at most 5 frets wide; all 12 keys have all five positions; shared notes and next/previous along the neck; register thirds, including the fallback with a high capo; major pentatonic; non-pentatonic formulas are rejected.

## Audio upload and playback verification (2026-10-29)

- Unit (`audio-file.test.ts`): format detection by extension (any case) with a MIME fallback, extension trusted over `application/octet-stream`; OGG, MP4 video and text refused; empty file, exactly-200 MB accepted, 200 MB + 1 byte refused; a format the browser can't play (FLAC with `canPlayType` = '') refused with a next step.
- Unit (`playback.test.ts`, fake media element): loading → ready with duration; play/pause/toggle; no play or seek before ready; time follows `timeupdate`/`seeked`; seek is clamped and shows at once; skip ±; ended; volume clamp and unmute; damaged (code 3) and unsupported (code 4) messages; blocked `play()` keeps the song; a new load resets; unloading doesn't report an error; subscribers only hear real changes.
- Unit (`decode.test.ts`, `peaks.test.ts`, `time.test.ts`): stereo averaged to mono, mono copied, decoder failure, empty decode and the 20-minute limit; waveform peaks per bucket and normalization; time formatting and spoken times.
- Component (`SongPlayer.test.tsx`): privacy note and limits shown; unsupported and unplayable files refused; load → play → pause → seek → ±5 s; drag and drop; volume and mute; damaged file disables the controls; a decode failure keeps playback; a 21-minute song is never decoded; the previous object URL is revoked and a refused file keeps the current song; a stale decode is ignored; a seek while playing shows at once, before the next animation frame.
- Manual in Chromium (production build, generated 30-second test tones): MP3, WAV, M4A (AAC), raw AAC (ADTS) and FLAC each load, report 0:30 and decode at 44.1 kHz. Playback advances; seeking with the slider while playing and while paused lands where set and keeps playing from there; arrow keys move 1 s; clicking the waveform seeks; playback stops at the end and the button returns to Play. Random bytes named `.mp3` give the "can't play this file" message; a `.txt` file is refused before loading. axe-core: no violations in light or dark mode. At 375px wide there is no horizontal scroll. No console errors.
- Not yet tested: Safari and Firefox (codec support differs: Firefox can't play some M4A/ALAC files, older Safari can't play FLAC), real recordings over 10 minutes, and files near the 200 MB limit.

## Analysis verification (2026-10-29)

Reference songs are rendered by `src/services/demo/synth.ts` from a score (strummed chords with harmonics, bass, kick on 1 and 3, snare on 2 and 4, eighth-note hi-hat), so the right answers are exact. These prove the maths and catch regressions. **They are not a measure of accuracy on real recordings, which hasn't been measured yet.**

| Reference song (SOP §8 case) | Key | Tempo | Beats within 50 ms | Chord time correct |
|---|---|---|---|---|
| C G Am F, 120 BPM (major key) | C major ✓ | 120 ✓ | ≥ 95% | ≥ 95% (100% measured) |
| Am Dm E7 Am, 96 BPM (minor key, dominant 7th) | A minor ✓ | 96 ✓ | ≥ 95% | ≥ 95% |
| 12-bar blues in A, 100 BPM (blues, dominant 7ths) | A major ✓ | 100 ✓ | ≥ 95% | ≥ 95% |
| B♭ Gm E♭ F, 85 BPM, no drums (flat spelling) | B♭ major ✓ | 85 ✓ | ≥ 95% | ≥ 95% |
| G Em C D, 70 BPM | G major ✓ | 70 ✓ | ≥ 95% | ≥ 95% |
| D A Bm G, 160 BPM (kick/snare half-time trap) | D major ✓ | 160 ✓ | ≥ 95% | ≥ 95% |
| E A B E, 140 BPM, distortion + noise (dense) | E major ✓ | 140 ✓ | ≥ 95% | ≥ 95% |
| C F G C → D G A D (changing tonal centre) | sections C major, D major ✓; overall key confidence low | 120 ✓ | | ≥ 95% |
| Am C (ambiguous relative keys) | A minor / C major as top two, not "likely" ✓ | | | |
| All 12 major chords in turn (no key) | low confidence ✓ | | | |
| White noise | key and tempo low, "very uncertain" note ✓ | | | |

Also: silence and audio under 5 s fail with a message; a 4 s silent lead-in is "no chord" with no beats; 44.1 kHz input works. Unit tests cover the FFT (bin placement, Parseval), chroma (A440 → A, C triad → C E G), onsets, tempo on pulse trains (60–150 BPM, double-time and ambiguous offbeats), every key from its own profile, key spelling (B♭ major, F♯ minor, E♭ minor), chord-fit weights, tonal sections, chord templates from theory formulas, smoothing, and the worker engine (progress, errors, crash, cancel, fallback when the worker can't load).

Component tests (`analysis.test.tsx`): idle and decoding text; progress status and progress bar; key, tempo, alternatives and notes; confidence words (likely, possible, uncertain) and "?" on uncertain chords; chord buttons' spoken names include alternatives and seek on click; changing key, double time, no key, no beat, no chords; failure alert with Try again; a new song cancels the old job and ignores its late result; unexpected errors.

Manual in Chromium (production build, 390 px wide, light and dark): a 58 s 12-bar blues WAV decodes and analyzes in the worker in about 1.3 s (A major, 100 BPM, A7/D7/E7 at the right bar lines); tapping a chord seeks playback; axe-core reports no violations; no horizontal scroll; no console errors. The single-file preview build falls back to on-page analysis if its worker can't load.

Not yet tested: real recordings, Safari and Firefox, songs near the 20-minute limit (expect about 25 s of analysis for 20 minutes in Chromium), tunings other than A = 440 Hz.

## Studio workspace verification (2026-10-29)

Unit and component tests: progression timing (current chord at boundaries and gaps, next and previous change, time markers); `romanNumeral` (12-bar blues = I, IV, V; case and ° in C major; borrowed ♭VI, ♭VII); `chordTonesInScale` (A7 over A minor pentatonic: C♯ outside; E7: E and D inside); `positionsInRegister` and `registerOf` for A minor pentatonic; WAV encoding and the demo song's length. `ScaleViewer.test.tsx`: formula, notes and positions; box labels with registers; key spelling; invalid chord; capo; 12-fret neck; Low / Middle / High show exactly the boxes in that third; box toggles, none, all, previous/next; roots and chord-tone layers; seven-note scales in a register; chord-tone focus text. `App.test.tsx`: empty states, tab keyboard navigation keeping Scale Viewer state, planned tabs, Settings changes the tuning, Help. Player tests now cover the import panel and the playback bar together, plus the demo song.

Manual in Chromium (dev server) at 1440, 900 and 390 px: the demo song loads, analyzes (A major, 100 BPM, A7/D7/E7) and plays; the timeline and chord list follow playback; no console errors; axe-core (WCAG 2.2 AA and best practice) reports no violations on Scale Viewer, Song Info and a planned tab at desktop and phone widths.

Not yet tested: Safari, Firefox, a real phone (the preview is for that), screen readers.

## Known failures

None yet.
