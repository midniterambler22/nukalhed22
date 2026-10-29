# CLAUDE.md

Nukalhed22 Studios is an interactive guitar-learning app. It turns a song into practical fretboard guidance: key, chords and chord changes, which scale to use, the starting fret, and how to connect positions while playing along.

## Read these first

Before any substantial work, read the project documents in this order:

1. [PROJECT_GOAL.md](PROJECT_GOAL.md): what the product is and who it's for.
2. [PROJECT_INSTRUCTIONS.md](PROJECT_INSTRUCTIONS.md): your role, architecture, rules, and build priorities.
3. [SOP.md](SOP.md): the required procedure for every phase and feature.
4. [TOOLSET.md](TOOLSET.md): approved tools and how to add a new one.

Then check the working documents:

- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md): current milestone, tasks, and progress. Update it as work completes.
- [UI_SPEC.md](UI_SPEC.md): Mark's UI/UX design spec (verbatim) and its reference image, [docs/ui-reference.jpg](docs/ui-reference.jpg). Don't edit its wording.
- [ARCHITECTURE.md](ARCHITECTURE.md): module boundaries and recorded decisions.
- [TESTING.md](TESTING.md): how to test, reference values, and known failures.
- [CHANGELOG.md](CHANGELOG.md): significant changes.

The four project documents are Mark's own wording. Don't edit them unless he asks. Record decisions and progress in the working documents instead.

## Rules that matter most

- **Musical correctness first.** Every note location is computed from tuning + capo + fret. Scales and chords are interval formulas. Never hardcode diagrams per key.
- **One theory module.** No pitch or scale math inside React components.
- **Estimates are not facts.** Analysis results carry confidence; user corrections are stored separately from automatic results.
- **Audio playback time is the single clock** for the timeline, current chord, and fretboard.
- **Local first.** Don't send user audio anywhere without disclosure and consent. No secrets in client code or Git.
- **Never color alone.** Target WCAG 2.2 AA.
- **Small, verified steps.** Don't claim something works unless tests ran and you checked it. Never disable or weaken a test to get green.
- **Report** what changed, what was tested, what failed, and what remains.

## Repository layout

The app is scaffolded with Vite + React + TypeScript. The music theory engine lives in `src/services/music-theory` (import from its `index.ts`). The planned layout (see PROJECT_INSTRUCTIONS §4) is:

```
src/
	components/   fretboard, player, chords, scales, timeline, practice
	pages/
	hooks/
	services/     audio, analysis, music-theory, fretboard, state, validation
	types/
	utils/
	styles/
	tests/
```

Only create folders when something goes in them.

## Commands

Requires Node.js 22 or later.

| Task | Command |
|---|---|
| Install | `npm install` |
| Dev server | `npm run dev` |
| Unit tests | `npm test` (watch mode: `npm run test:watch`) |
| Type check | `npm run typecheck` |
| Lint | `npm run lint` |
| Format | `npm run format` (check only: `npm run format:check`) |
| Production build | `npm run build` |
| End-to-end tests | `npm run test:e2e` (not set up yet; Playwright and axe-core come with the first interactive UI) |

Unit tests sit next to the code they test as `*.test.ts`. Prettier skips Markdown so the project documents keep their wording and layout.

## Conventions

- TypeScript in strict mode.
- Tabs for indentation where the tooling supports it.
- Work on a feature branch; keep each PR to one coherent change.
- Update IMPLEMENTATION_PLAN.md and CHANGELOG.md with each meaningful change.
