# Nukalhed22 Studios — Standard Operating Procedure (SOP)

| | |
|---|---|
| **Project** | Song Analysis and Interactive Guitar Learning Application |
| **Document** | Standard Operating Procedure |
| **Version** | 1.0 |
| **Status** | Initial Development |
| **Owner** | Nukalhed22 Studios |
| **Primary Platforms** | Web application, with Windows desktop support planned |
| **Primary Objective** | Transform songs into practical, synchronized guitar-playing instructions. |

---

## 1. Purpose

This Standard Operating Procedure establishes the required process for planning, developing, testing, documenting, and maintaining the Nukalhed22 Studios guitar-learning application.

The application will allow users to upload supported audio files or locate songs through authorized integrations. It will analyze the music and convert the results into practical guitar guidance.

The application should help users identify:

- Musical key and tonal center.
- Tempo and beat positions.
- Chord progression and chord-change timings.
- Compatible scales and chord tones.
- Recommended guitar-neck positions.
- Exact starting frets and scale shapes.
- Connections between adjacent scale positions.
- Useful notes to target over individual chords.

The ultimate objective is to help guitarists understand what to play, where to play it, and why it works.

## 2. Operating Principles

All development must follow these principles.

### 2.1 Build incrementally

Develop the application one milestone at a time. Do not attempt to implement every feature in a single coding task.

### 2.2 Prioritize musical correctness

All note, fret, scale, and chord calculations must be mathematically correct. Automatic audio analysis must be evaluated separately because transcription results can be uncertain.

### 2.3 Preserve existing functionality

Inspect the existing codebase before modifying it. Avoid unnecessary rewrites and preserve working features unless a change is required.

### 2.4 Test every feature

A feature is not complete simply because its interface has been created. Its behavior must be implemented, tested, and verified.

### 2.5 Document important decisions

Maintain documentation covering architecture, dependencies, implementation decisions, testing results, and known limitations.

### 2.6 Keep the user workflow central

Every major feature must support the following workflow:

**Load song → Analyze music → Identify chords → Recommend scales → Find starting fret → Play along.**

## 3. Project Documentation

Maintain these documents in the project repository.

| File | Purpose |
|---|---|
| `PROJECT_GOAL.md` | Defines the product vision and intended outcome. |
| `PROJECT_INSTRUCTIONS.md` | Defines the AI coding assistant's role and development standards. |
| `SOP.md` | Defines the required development and testing procedures. |
| `ARCHITECTURE.md` | Documents the technical architecture and module boundaries. |
| `IMPLEMENTATION_PLAN.md` | Tracks milestones, tasks, dependencies, and progress. |
| `TESTING.md` | Documents testing procedures, expected results, and known failures. |
| `CHANGELOG.md` | Records significant changes and releases. |

Before creating a new document, check whether equivalent documentation already exists. Update existing files rather than creating unnecessary duplicates.

## 4. Phase One — Project Setup

### Objective

Establish a stable development environment and understand the existing codebase.

### Procedure

1. Inspect the project directory and existing files.
2. Read all project instructions and available documentation.
3. Identify the framework, dependencies, build tools, and current application entry points.
4. Determine whether the project already builds and runs.
5. Record existing features and known problems.
6. Establish version control and a safe checkpoint before substantial changes.
7. Confirm the development and testing commands.
8. Document the current architecture.
9. Create or update the implementation plan.
10. Identify the smallest useful first milestone.

### Completion criteria

- The development environment works.
- The application can be started and tested.
- Existing functionality is documented.
- The initial implementation plan is recorded.

Do not proceed with major feature development until the project can be built reliably.

## 5. Phase Two — Interactive Guitar Fretboard

### Objective

Build the core visual component that will power the scale, chord, and song-guidance features.

### Procedure

1. Create a responsive fretboard component.
2. Render strings, frets, and fret markers.
3. Implement standard guitar tuning.
4. Calculate note names from string tuning and fret number.
5. Display notes when the user selects a fret.
6. Highlight root notes.
7. Highlight scale notes.
8. Highlight chord tones.
9. Implement configurable fret ranges.
10. Add low, middle, and high register selection.
11. Implement the five connected minor-pentatonic positions.
12. Show shared notes between adjacent positions.
13. Add optional fingering and interval labels.
14. Support left-handed display without changing the underlying note calculations.

### Required tests

Verify that:

- Open strings produce the correct pitches.
- Moving up one fret advances one semitone.
- Octave boundaries are correct.
- Root notes appear at valid locations.
- Scale shapes contain the correct notes.
- Adjacent positions connect correctly.
- Alternate tunings update the fretboard correctly when implemented.
- Changing the displayed fret range does not change the underlying musical calculations.

### Completion criteria

A user can select a key and scale, view the corresponding fretboard positions, and navigate between connected shapes accurately.

## 6. Phase Three — Music-Theory Engine

### Objective

Create one reusable source of truth for music-theory calculations.

### Procedure

1. Define a consistent pitch-class representation.
2. Implement note naming and enharmonic handling.
3. Define scales using interval formulas.
4. Define chord formulas.
5. Generate scale notes from a root note.
6. Generate chord tones.
7. Map notes to guitar strings and frets.
8. Calculate scale positions.
9. Implement transposition.
10. Add tuning and capo support through the instrument model.
11. Write unit tests for all calculations.

### Development rules

- Do not hardcode separate scale diagrams for each key.
- Do not duplicate pitch calculations in UI components.
- Do not treat a fret number as a musical note without considering the string's tuning.
- Keep music-theory calculations independent of audio-analysis code.

### Completion criteria

The engine produces correct notes, scales, chord tones, and fretboard positions for the supported configurations.

## 7. Phase Four — Audio Upload and Playback

### Objective

Allow users to load and play supported songs inside the application.

### Procedure

1. Implement file selection and drag-and-drop.
2. Validate supported audio formats.
3. Set and document reasonable file-size limits.
4. Decode supported audio.
5. Implement play, pause, seeking, and volume controls.
6. Track the current playback position.
7. Add waveform visualization where appropriate.
8. Handle loading and playback errors.
9. Test different supported file formats.
10. Ensure playback time remains accurate after seeking.

### Initial supported formats

- MP3
- WAV
- M4A/AAC
- FLAC, where the selected decoder supports it

### Completion criteria

A user can load a supported audio file, play it, seek through it, and view its playback timeline.

Audio upload and playback must work before complex automatic song analysis becomes a release requirement.

## 8. Phase Five — Key, Tempo, and Chord Analysis

### Objective

Convert a recording into structured musical information.

### Procedure

1. Evaluate available audio-analysis libraries and services.
2. Select an approach appropriate for the target environment.
3. Build a replaceable analysis interface.
4. Implement audio preprocessing.
5. Estimate tempo and beat positions.
6. Estimate key and tonal center.
7. Detect chord identities and approximate timings.
8. Generate a chronological chord progression.
9. Attach confidence information to uncertain results.
10. Display analysis progress.
11. Provide a correction interface.
12. Save corrected results separately from automatic predictions.
13. Test against recordings with known musical information.
14. Document limitations and common failure cases.

### Required test cases

Include recordings representing:

- Major-key songs.
- Minor-key songs.
- Twelve-bar blues.
- Dominant seventh chords.
- Songs with changing tonal centers.
- Songs with ambiguous harmony.
- Recordings with prominent bass, distortion, or dense instrumentation.

Use audio that the project is permitted to process.

### Completion criteria

The application produces useful key, tempo, and chord estimates for its supported test cases. It clearly identifies uncertainty and permits manual correction.

Do not claim reliable full-song chord transcription until its accuracy has been evaluated against reference data.

## 9. Phase Six — Chord Progression Timeline

### Objective

Display chords in synchronization with the song.

### Procedure

1. Create a chronological chord-event data structure.
2. Store start and end timestamps for each chord.
3. Display chords along the song timeline.
4. Highlight the current chord during playback.
5. Display upcoming chord changes.
6. Update the current chord when the user seeks.
7. Allow chord labels to be corrected.
8. Allow chord-change timings to be adjusted.
9. Support looping selected sections.
10. Save user corrections.

### Completion criteria

The current chord and upcoming progression remain consistent with the song's playback position, including after seeking and looping.

## 10. Phase Seven — Scale Recommendation Engine

### Objective

Translate musical analysis into actionable lead-guitar guidance.

### Procedure

1. Read the estimated key and current chord.
2. Evaluate compatible scales and arpeggios.
3. Identify relevant chord tones and target notes.
4. Find valid scale positions on the configured fretboard.
5. Rank positions using musical compatibility and practical movement.
6. Respect the selected register and guitar tuning.
7. Display the recommended scale and starting fret.
8. Display exact string and fret locations.
9. Offer alternative positions where appropriate.
10. Highlight notes that work particularly well over the current chord.
11. Show transitions between neighboring shapes.
12. Explain recommendations in plain language.
13. Allow users to override recommendations.

### Important musical rule

The song's key alone does not determine the best scale for every chord.

Recommendations must consider the current harmony. In some situations, targeting chord tones or adjusting the scale to accommodate a particular chord will produce better results than applying one scale indiscriminately.

### Completion criteria

The application can recommend a suitable scale position, identify its starting fret, display its notes accurately, and explain how the guitarist can use it over the current chord.

## 11. Phase Eight — Synchronized Song Workspace

### Objective

Combine audio playback, chords, and fretboard guidance into one practical interface.

### Procedure

1. Display song metadata and playback controls.
2. Show key and tempo.
3. Display the current chord and upcoming progression.
4. Render the interactive fretboard.
5. Highlight the recommended scale.
6. Highlight useful chord tones.
7. Provide low, middle, and high position controls.
8. Update the guidance when chords change.
9. Update the interface when the user seeks.
10. Support looping and repeated practice.
11. Verify synchronization across all components.

### Completion criteria

The song, chord timeline, and fretboard guidance remain synchronized. No component displays stale information after a change in playback position.

## 12. Phase Nine — YouTube Integration

### Objective

Allow users to find songs through an authorized external source.

### Procedure

1. Review the available YouTube API and playback options.
2. Implement song search by title and artist.
3. Display available metadata and attribution.
4. Allow users to select the correct recording.
5. Implement permitted playback.
6. Determine whether the selected source can be analyzed under the integration's technical and legal constraints.
7. Provide alternative workflows when audio analysis is unavailable.
8. Handle inaccessible or removed videos.
9. Test playback, seeking, and synchronization.
10. Document the integration's limitations.

### Important restriction

Do not assume that access to a YouTube video permits downloading, extracting, or analyzing its audio through an unrestricted workflow.

Use authorized mechanisms and provide local-file upload or manual chord entry when necessary.

### Completion criteria

Users can search for and select available songs through the supported integration, and the application accurately explains what analysis is possible for each source.

## 13. Phase Ten — Practice and Learning Features

### Objective

Help users develop fretboard knowledge and practical improvisation skills.

### Procedure

1. Add Follow Along mode.
2. Add Explore the Neck mode.
3. Add Practice mode with section looping.
4. Add optional scale-degree and interval labels.
5. Explain scale and chord relationships in plain English.
6. Add connected-position exercises.
7. Allow users to save useful song configurations.
8. Add practice-history tracking where appropriate.

### Completion criteria

Users can repeat a section, explore the recommended scale, and practice moving between positions without restarting the entire workflow.

## 14. Phase Eleven — User Interface and Accessibility

### Objective

Ensure the application is understandable, usable, and accessible.

### Procedure

1. Verify responsive layouts.
2. Check fretboard readability at different screen sizes.
3. Ensure important information is not communicated through color alone.
4. Add keyboard navigation.
5. Provide visible focus indicators.
6. Add accessible labels to controls.
7. Check text and interface contrast.
8. Support reduced-motion preferences.
9. Run automated accessibility checks.
10. Manually test essential workflows with keyboard navigation.

### Completion criteria

The main song workflow is usable with a keyboard, the fretboard remains understandable, and no unresolved critical accessibility defects remain.

Target WCAG 2.2 AA.

## 15. Phase Twelve — Testing and Quality Assurance

### Objective

Verify that the application works as a complete product.

### Procedure

1. Run unit tests.
2. Run music-theory tests.
3. Run audio-analysis tests.
4. Run integration tests.
5. Run end-to-end tests.
6. Test supported audio formats.
7. Test chord synchronization and seeking.
8. Test scale recommendations across representative keys.
9. Test tuning and capo behavior where implemented.
10. Test error handling.
11. Test responsive layouts.
12. Run accessibility checks.
13. Build the production application.
14. Test the Windows build when included in the release.
15. Document outstanding issues.

### Release-blocking defects

Do not release a version with:

- Incorrect fretboard note calculations.
- Invalid scale shapes.
- Broken playback synchronization.
- Misleading handling of failed analysis.
- Unusable upload or playback controls.
- Critical security or privacy issues.
- A failing production build.

### Completion criteria

All release-blocking tests pass, known limitations are documented, and the release build has been verified.

## 16. Phase Thirteen — Windows Desktop Application

### Objective

Package the application for Windows when the core web experience is stable.

### Procedure

1. Confirm the web application builds reliably.
2. Evaluate Tauri 2 for desktop packaging.
3. Configure desktop-specific permissions and capabilities.
4. Verify file selection and local audio access.
5. Test supported audio playback and analysis.
6. Handle operating-system paths safely.
7. Test installation and startup.
8. Verify that external integrations continue to work.
9. Document desktop-specific limitations.
10. Produce and verify the release package.

### Completion criteria

The Windows application can be installed and launched, and its core functionality works as documented.

## 17. Standard Feature Development Procedure

Apply this procedure to every new feature, improvement, and bug fix.

1. **Identify the requirement.** Define the user problem and expected behavior.
2. **Inspect the existing implementation.** Read relevant files, documentation, types, and tests.
3. **Plan the change.** Identify affected modules, dependencies, edge cases, and risks.
4. **Implement the change.** Make the smallest coherent change that satisfies the requirement.
5. **Test the change.** Run relevant tests and verify the expected behavior.
6. **Run regression checks.** Check other functionality that might be affected by the change.
7. **Review the interface.** Verify that the user can understand and operate the feature.
8. **Update documentation.** Record important implementation details and changed behavior.
9. **Report the outcome.** State what changed, what passed, what failed, and what remains incomplete.

Never mark a feature complete without appropriate verification.

## 18. Bug Reporting and Fixes

Every reported defect should include:

- A clear description.
- Steps to reproduce.
- Expected behavior.
- Actual behavior.
- Relevant error messages or logs.
- Affected modules.
- A proposed resolution.
- Tests required to prevent recurrence.

Fix the underlying problem rather than merely hiding its visible symptoms.

After fixing a defect, add a regression test when practical.

## 19. Version Control and Change Management

Before making substantial changes:

1. Check the working tree.
2. Review uncommitted changes.
3. Establish a safe checkpoint.
4. Keep changes focused.
5. Review the final diff.
6. Run appropriate tests.
7. Commit changes when the project's workflow calls for it.
8. Update the changelog for significant changes.

Never overwrite unrelated user work or discard uncommitted changes without explicit authorization.

## 20. Standard Definition of Done

A feature is complete only when:

- Requirements have been satisfied.
- Implementation is functional.
- Relevant automated tests pass.
- User-facing behavior has been verified.
- Errors are handled appropriately.
- Existing functionality remains intact.
- Documentation has been updated where needed.
- Known limitations are disclosed.

A visual mockup or placeholder is not a completed feature.

## 21. Development Priorities

Follow this priority order unless a documented technical dependency requires a different sequence.

1. Stable project foundation.
2. Correct fretboard mathematics.
3. Music-theory engine.
4. Five connected pentatonic positions.
5. Audio upload and playback.
6. Key, tempo, and chord analysis.
7. Chord progression timeline.
8. Scale recommendation engine.
9. Synchronized song workspace.
10. Practice and learning features.
11. YouTube integration.
12. Windows packaging and advanced features.

Prioritize the accuracy and usability of the core experience over unnecessary complexity.

## 22. Final Operating Standard

Every development decision must support the purpose of Nukalhed22 Studios: helping guitarists understand music and apply that knowledge directly to the fretboard.

The application must go beyond identifying a song's key or displaying generic scale diagrams.

It must connect the music being played to the actual notes, frets, positions, and transitions a guitarist can use.

The final standard is simple: a guitarist should be able to load a supported song, understand its chords, find an appropriate scale, identify the correct starting fret, and follow practical fretboard guidance while the music plays.
