# Testing

Documents testing procedures, expected results, and known failures.

**Status (2026-10-29):** Vitest is set up, with Testing Library + jsdom for component tests (opt in per file with `// @vitest-environment jsdom`). 271 tests pass: music theory, fretboard engine, scale positions, and the fretboard component. Playwright and axe-core aren't in the repo yet; the fretboard UI was checked with axe-core in Chromium by hand (see below).

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

## Fretboard verification (2026-10-29)

- Unit: every TESTING.md reference value, capo 2 → F♯2, frets below the capo unplayable, drop D, "open + fret" for every built-in tuning across 24 frets, fret-12 octaves, every A in frets 0–12, all positions of A3 and C4, bounds and validation errors.
- Component: gridcell names, shapes per role, single tab stop, arrow/Home/End navigation and edges, left-handed mirroring, Enter/Space/click selection, `aria-selected`, capo and nut drawing, key-aware spelling (B♭ in F major), invalid chord message.
- Manual in Chromium (production build): axe-core reports no violations in light or dark mode or with the chord error showing; Tab enters the grid on the first root; arrow keys and Enter select and the readout updates ("String 3, fret 7: D4"); at 390px wide the page has no horizontal scroll and the fretboard scrolls inside its panel.

## Known failures

None yet.
