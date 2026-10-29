# Nukalhed22 Studios — Development Toolset and Technology Standards

| | |
|---|---|
| **Document** | TOOLSET.md |
| **Version** | 1.0 |
| **Purpose** | Define the approved development tools, software libraries, AI resources, and testing systems for Nukalhed22 Studios. |

---

## 1. Toolset Objective

The Nukalhed22 Studios toolset must support the complete development lifecycle, from initial project setup through music analysis, interactive guitar instruction, testing, and release.

The AI coding assistant must select tools based on the requirements of the current task. It must not introduce unnecessary dependencies or replace an existing working tool without a clear reason.

The toolset must cover:

1. Application development.
2. Audio processing and analysis.
3. Music theory and guitar fretboard calculations.
4. Interactive interface development.
5. Data storage and external integrations.
6. Automated testing and accessibility.
7. Version control and documentation.
8. Windows desktop packaging.

## 2. Core Development Toolset

### 2.1 Application framework

Preferred technologies:

- React for the user interface.
- TypeScript for application logic and data structures.
- Vite for development and production builds.
- SVG for the interactive guitar fretboard.
- CSS for responsive layouts and visual presentation.

#### Operating procedure

1. Inspect the existing application before selecting or replacing a framework.
2. Use the existing stack if it meets the project requirements.
3. Create reusable components for the fretboard, chord timeline, audio player, and scale selector.
4. Keep music calculations separate from presentation logic.
5. Use strict TypeScript settings where practical.
6. Build and verify the application after significant changes.

Do not introduce a second frontend framework into the same application without a documented architectural reason.

### 2.2 Development environment

Use the following tools where appropriate:

- Visual Studio Code or an equivalent code editor.
- Node.js and npm for JavaScript tooling.
- Git for version control.
- GitHub or another Git-compatible repository host.
- Browser developer tools for debugging.
- A terminal for builds, scripts, and automated tests.

The project must include documented setup, development, test, and build commands.

### 2.3 AI coding assistant

Use the project's selected AI coding assistant to:

- Read and understand the codebase.
- Follow `PROJECT_GOAL.md`, `PROJECT_INSTRUCTIONS.md`, `SOP.md`, and `TOOLSET.md`.
- Create an implementation plan before complex changes.
- Implement features incrementally.
- Diagnose errors and failing tests.
- Review code for maintainability and security.
- Update documentation.
- Report exactly what was implemented and verified.

The assistant must not claim that code works without appropriate testing.

## 3. Music Theory and Fretboard Toolset

### 3.1 Music-theory calculations

Preferred candidate: Tonal.js.

Use a music-theory library where it provides reliable functionality for:

- Notes and pitch classes.
- Intervals.
- Chord definitions.
- Scale definitions.
- Transposition.
- Musical key representations.

The application must maintain one authoritative music-theory module. If a library does not cover a requirement correctly, implement and test the missing functionality rather than duplicating calculations throughout the interface.

### 3.2 Guitar fretboard engine

Build a dedicated, project-owned fretboard calculation module.

It must support:

- Standard guitar tuning.
- Configurable string tunings.
- Fret-to-pitch calculations.
- Root-note identification.
- Scale-note mapping.
- Chord-tone mapping.
- The five connected minor-pentatonic positions.
- Major pentatonic and other scale positions.
- Starting-fret recommendations.
- Low, middle, and high register selection.
- Capo-aware note mapping.
- Left-handed visual orientation.

Use SVG to render the fretboard where practical.

The application must calculate notes from the instrument configuration rather than storing separate hardcoded diagrams for every key.

### 3.3 Music-theory testing

Create automated tests for:

- Every open string.
- Semitone movement between frets.
- Octave boundaries.
- Scale formulas.
- Chord formulas.
- Transposition.
- Alternate tunings.
- Capo behavior.
- Position connections.
- Starting-fret accuracy.

The fretboard engine must be reliable before it is used to display recommendations from automatic song analysis.

## 4. Audio Processing and Analysis Toolset

Audio analysis is a separate subsystem. No single library should be assumed to solve every part of the problem.

### 4.1 Audio playback

Preferred tools: Web Audio API and an appropriate audio playback implementation. Evaluate Tone.js where its musical timing or audio functionality is useful.

The playback system must support:

- Local audio files.
- Play and pause.
- Seeking.
- Playback-time tracking.
- Volume control.
- Error handling.
- Synchronization with chord changes.

Use a separate waveform library, such as wavesurfer.js, if waveform visualization is required.

### 4.2 Audio analysis

Evaluate Essentia.js or another suitable audio-analysis library for browser-based analysis.

Evaluate server-side analysis when browser processing is insufficient.

Potential analysis tasks include:

- Beat and tempo estimation.
- Chroma extraction.
- Key estimation.
- Harmonic analysis.
- Chord recognition.
- Section detection.

Before adopting an analysis engine, test it against known recordings and document its limitations.

Do not assume that detecting a song's key automatically identifies its chords or that identifying its chords guarantees accurate scale recommendations.

### 4.3 Analysis architecture

Keep audio analysis behind a replaceable interface.

The application should be able to change analysis libraries or services without requiring a complete rewrite of the user interface or fretboard engine.

The analysis system must return structured results containing, where available:

- Estimated key.
- Tempo.
- Chord labels.
- Chord timestamps.
- Confidence or uncertainty.
- Analysis status.
- Error information.

Keep automatic results separate from user corrections.

### 4.4 Audio source restrictions

Local uploads should be the first fully supported input workflow.

YouTube integration must use authorized search and playback mechanisms. Do not assume a video URL permits unrestricted audio downloading or extraction.

If a source cannot be analyzed through the permitted integration, provide an alternative such as local-file upload or manual chord entry.

## 5. User Interface and Visualization Toolset

### 5.1 Interface components

Develop reusable components for:

- Song search.
- Audio upload.
- Playback controls.
- Waveform.
- Chord progression timeline.
- Current chord display.
- Interactive guitar fretboard.
- Scale selection.
- Register selection.
- Target-note highlighting.
- Practice controls.

Use the same underlying data for all components that display musical information.

### 5.2 UI standards

The interface must be:

- Responsive.
- Keyboard accessible.
- Clear at different screen sizes.
- Consistent in its presentation of musical notes.
- Designed to distinguish root notes, scale notes, and chord tones.
- Capable of displaying uncertain analysis results.
- Usable without requiring advanced music-theory knowledge.

Do not use color as the only way to distinguish notes or states.

### 5.3 Design tools

Use Figma or an equivalent design tool if screen design and prototyping would improve the implementation.

Design tools are optional. Do not delay implementation of the core fretboard engine merely to produce elaborate mockups.

Keep visual design decisions documented when they materially affect the application architecture.

## 6. Data Storage and Backend Toolset

### 6.1 Initial approach

Keep the initial prototype as simple as possible.

Use local state and appropriate browser storage for temporary or local preferences when sufficient. Do not introduce a database merely because the project may need one in the future.

### 6.2 Persistent storage

Evaluate Supabase and PostgreSQL when the application requires:

- User accounts.
- Saved song projects.
- Persistent chord corrections.
- User settings across devices.
- Practice history.
- Cloud synchronization.

The backend must not become tightly coupled to the fretboard calculations or audio-analysis engine.

### 6.3 Data model

Use typed data structures for:

- Song metadata.
- Audio source information.
- Analysis results.
- Chord events.
- Beat events.
- Song sections.
- Guitar tunings.
- Scale definitions.
- Fretboard positions.
- Scale recommendations.
- User corrections.
- Practice sessions.

Use a consistent timestamp representation across the application.

### 6.4 Privacy

Document whether audio is processed locally or sent to an external service.

Do not transmit private recordings to external services without appropriate disclosure and consent.

Never store API secrets in client-side code.

## 7. YouTube Integration Toolset

Use the official YouTube Data API or another permitted integration for song search and available metadata.

The integration must:

1. Search by title and artist.
2. Display available song information.
3. Allow the user to select the intended recording.
4. Use permitted playback mechanisms.
5. Handle unavailable videos.
6. Respect applicable API terms and access restrictions.
7. Clearly distinguish search results from analyzable audio sources.

Do not build an unauthorized audio-extraction workflow.

## 8. Testing and Quality Assurance Toolset

### 8.1 Unit testing

Use Vitest or an equivalent test runner for:

- Music-theory calculations.
- Fretboard calculations.
- Scale generation.
- Chord-tone generation.
- Position transitions.
- Data transformations.

### 8.2 End-to-end testing

Use Playwright or an equivalent browser automation framework to test:

- Application startup.
- Audio upload.
- Playback controls.
- Seeking.
- Chord timeline interaction.
- Scale selection.
- Register switching.
- Error states.
- Saved settings where implemented.

### 8.3 Accessibility testing

Use axe-core or an equivalent accessibility testing tool.

Target WCAG 2.2 AA, combining automated checks with manual keyboard and interface testing.

### 8.4 Build verification

After meaningful changes:

1. Run the relevant unit tests.
2. Run affected integration tests.
3. Run end-to-end tests where appropriate.
4. Check TypeScript errors.
5. Run linting where configured.
6. Run a production build.
7. Inspect the actual interface.
8. Record failures and unresolved issues.

Do not disable or weaken tests simply to make a build pass.

## 9. Version Control and Change Management

Use Git for version control.

Before substantial changes:

1. Inspect the working tree.
2. Review existing uncommitted changes.
3. Establish a safe checkpoint.
4. Make a focused implementation change.
5. Review the resulting diff.
6. Run relevant tests.
7. Commit changes when appropriate.
8. Update documentation.

Never discard unrelated work or overwrite user changes without authorization.

## 10. Windows Desktop Toolset

When the web application is stable, evaluate Tauri 2 for packaging the application as a Windows desktop product.

Verify:

- Local file access.
- Audio playback.
- Supported analysis workflows.
- External integrations.
- Operating-system permissions.
- Installation and startup.
- Production packaging.

Desktop packaging must not be allowed to destabilize the working web application.

## 11. Optional Tools

The following tools may be introduced when a specific requirement justifies them:

- A backend analysis service for computationally intensive audio processing.
- Source separation for recordings where it measurably improves analysis.
- A database for persistent projects and accounts.
- Cloud storage for user-owned files where necessary.
- Additional visualization libraries for complex musical timelines.
- Performance monitoring and error reporting for production releases.

Every new dependency must have a clear purpose, documented benefits, and an acceptable maintenance cost.

## 12. Tool Selection Procedure

Before introducing a tool or dependency, the AI coding assistant must:

1. Identify the problem the tool will solve.
2. Check whether the existing project already solves that problem.
3. Evaluate compatibility with the current architecture.
4. Check maintenance status and licensing.
5. Consider browser and Windows support where applicable.
6. Consider performance and privacy implications.
7. Evaluate alternatives.
8. Add the tool only when its benefits justify the added complexity.
9. Document the decision.
10. Test the integration.

Do not install multiple libraries that perform substantially the same job without a clear technical reason.

## 13. Toolset Maintenance

Review the toolset when:

- A dependency becomes unsupported.
- An analysis approach fails to meet accuracy requirements.
- A browser or desktop limitation is discovered.
- A security issue is identified.
- A new requirement cannot be met by the existing stack.

Update this document when an important tool is added, replaced, or removed.

## 14. Final Standard

The toolset must serve the product, not the other way around.

Nukalhed22 Studios must use reliable music-theory calculations, practical audio-analysis tools, maintainable application architecture, and meaningful testing.

The most important requirement is that the application accurately connects the song to the guitar neck.

A user must be able to load a supported song, understand its chords, see a suitable scale, identify the starting fret, and follow connected fretboard positions with confidence.
