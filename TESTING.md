# Testing

Documents testing procedures, expected results, and known failures.

**Status (2026-10-29):** Vitest is set up, with Testing Library + jsdom for component tests (opt in per file with `// @vitest-environment jsdom`). 366 tests pass: music theory, fretboard engine, scale positions, the fretboard component, audio file validation, playback, decoding and the song player. Playwright and axe-core aren't in the repo yet; the fretboard and player UIs were checked with axe-core in Chromium by hand (see below).

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

## Known failures

None yet.
