# Testing

Documents testing procedures, expected results, and known failures.

**Status (2026-10-29):** Vitest is set up. The music theory module has 154 unit tests, all passing. Playwright and axe-core aren't set up yet.

Run `npm test`. Test files sit next to their code as `*.test.ts`.

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

## Known failures

None yet.
