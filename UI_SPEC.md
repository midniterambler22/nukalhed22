# Nukalhed22 Studios UI/UX Design and Implementation Specification

Claude Project Reference Version 1.0

> Mark's own specification, posted 2026-10-29. The text is verbatim; only the layout is converted to Markdown. Progress against it is tracked in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

---

## 1. Product purpose

Build Nukalhed22 Studios as a song-driven guitar learning application.

A guitarist should be able to upload an audio file or provide a supported YouTube link, analyze a song, and receive a practical visual guide explaining:

- The song’s key, tempo, time signature, and tuning when detectable.
- The chords and chord progression.
- When each chord changes.
- Which scales are suitable for the song and its individual chords.
- Which guitar scale boxes or fretboard positions to play.
- Whether to play in a low, middle, or high register.
- Which chord tones and target notes to emphasize.
- How to practice phrases and build a lead solo.

The central product question is:

“I’m listening to this song. What can I play over it, and where do I play it on my guitar?”

The application must teach the user while helping them play. Do not assume the user already understands music theory.

There are two primary user experiences:

**SHOW ME** Automatically analyze the song and present its key, chords, progression, scale recommendations, scale boxes, register, and target notes.

**TEACH ME** Explain why the recommendations work, how scale positions connect, how chord tones relate to the progression, and how to improvise independently.

## 2. Design direction

Use the supplied Nukalhed22 Studios Scale Viewer reference image as the visual direction for the main song-analysis workspace.

The desired look is a professional music-production and guitar-learning workstation.

Visual style:

- Deep navy, charcoal, and near-black backgrounds.
- Subtle panel borders and separators.
- Bright blue for active navigation, playback, and timeline indicators.
- Orange for scale notes and musical emphasis.
- Red for root notes.
- Blue for chord tones.
- Green for recommended target notes.
- Purple or other clearly distinguishable outlines for scale positions.
- High-contrast, readable typography.
- Compact but well-organized information panels.
- Rounded rectangular controls.
- Subtle glow for selected controls, used sparingly.

Keep the interface visually rich without making it cluttered. Every panel must have a clear purpose. Use consistent spacing, alignment, typography, iconography, and control behavior throughout the application.

Do not copy another product’s branding or exact interface. Use the reference image as inspiration for layout and visual hierarchy while creating a distinct Nukalhed22 Studios identity.

## 3. Global application navigation

Create a persistent application header containing:

- Nukalhed22 Studios logo and name.
- Learn.
- Explore.
- Play.
- Current song information when a song is loaded.
- Key.
- Tempo.
- Time signature.
- Settings.
- Help.
- User/profile access.

The primary work areas should include:

1. Song Analysis
2. Jam Master
3. Riff Builder
4. Chord Viewer
5. Scale Viewer
6. Song Info

Use clear active states so the user always knows which workspace is open.

Do not make every feature a separate top-level destination. Keep related tools grouped logically.

## 4. Main song-analysis workspace

Use a multi-panel desktop layout inspired by the reference image.

### Top area: song player and timeline

Place the audio waveform and chord timeline across the top of the workspace.

Include:

- Song title and artist, when known.
- Waveform visualization.
- Current playback time and total duration.
- Play/pause.
- Seek and scrubbing.
- Volume.
- Zoom controls.
- Loop selection.
- Chord timeline synchronized to playback.
- Bar or time markers.
- Current chord highlighted.
- Next chord visible.
- Song section markers such as Intro, Verse, Chorus, Bridge, Solo, and Outro when identified.

The user should be able to click a chord or timeline location to jump to that part of the song.

### Left panel: song analysis

Show the analysis results in a compact, readable panel.

Include:

- Key.
- Tempo in BPM.
- Time signature.
- Detected tuning, if available.
- Song structure.
- Detected chord list.
- Bar or timestamp for each chord.
- Chord function where confidently identified.

Use color markers to distinguish chord categories or functions. Do not rely on color alone; include text labels.

### Center panel: primary work area

The center panel is the most important area of the application.

It should contain the selected workspace and, in Scale Viewer, a large interactive guitar fretboard.

The fretboard must be large enough to read note labels and identify positions without zooming excessively.

### Right panel: contextual tools

Show tools relevant to the selected workspace, such as:

- Chord Finder.
- Scale Selector.
- Key selector.
- Register selector.
- Display settings.
- Current chord information.
- Scale recommendations.

### Bottom area: playback and practice controls

Include:

- Play, pause, previous, and next.
- Loop.
- Metronome.
- Tempo adjustment.
- Volume.
- Fretboard length options.
- Practice.
- Build My Solo.
- Compare Scales.

Keep playback controls accessible while the user changes views.

## 5. Scale Viewer — core feature

Scale Viewer is a primary feature, not a secondary diagram page.

When a song is analyzed, the application should recommend useful scales and show the guitar scale patterns directly on the fretboard.

The user must be able to select:

- Scale.
- Musical key.
- Scale position or box.
- Low, middle, high, or entire-neck register.
- Connected-box view or individual-box view.
- Note labels and interval display.
- Root-note visibility.
- Chord-tone visibility.
- Target-note visibility.

The Scale Viewer should show:

- The selected scale name.
- Its key.
- Its interval formula.
- Its notes.
- The number of playable positions available.
- The current chord.
- The recommended box for the current song section.
- A short explanation of why the scale or position is recommended.

## 6. Scale library

Include these 20 scales in the Scale Library, grouped into four categories.

**Pentatonic and blues**

1. Minor Pentatonic
2. Major Pentatonic
3. Minor Blues
4. Major Blues

**Major scale and modes**

5. Major Scale (Ionian)
6. Natural Minor (Aeolian)
7. Dorian
8. Phrygian
9. Lydian
10. Mixolydian
11. Locrian

**Minor and harmonic variations**

12. Harmonic Minor
13. Melodic Minor
14. Phrygian Dominant
15. Hungarian Minor

**Advanced and exotic**

16. Whole Tone
17. Diminished (Half-Whole)
18. Diminished (Whole-Half)
19. Altered
20. Lydian Dominant

Support all 12 chromatic root notes: C, C#/Db, D, D#/Eb, E, F, F#/Gb, G, G#/Ab, A, A#/Bb, B.

Store scales as interval definitions. Calculate scale notes and fretboard locations dynamically. Do not create 20 separate static diagram sets.

## 7. Interactive guitar fretboard

The fretboard is the visual centerpiece of Scale Viewer.

Support:

- Six strings.
- Standard tuning E-A-D-G-B-E by default.
- Configurable alternate tunings.
- 12, 15, 22, and 24 fret layouts.
- Note names.
- Fret numbers.
- Octave identification.
- Scale notes.
- Root notes.
- Chord tones.
- Target notes.
- Interval numbers.
- Optional finger numbers.
- Optional bends, slides, hammer-ons, and pull-offs where relevant.

### Color legend

Use a consistent visual system:

- Orange: Scale notes.
- Red: Root notes.
- Blue: Chord tones.
- Green: Recommended target notes.
- Grey: Notes outside the selected scale.
- Colored outlines: Scale-box boundaries.

Make the legend visible near the fretboard. Provide text labels and accessible contrast so color is never the only way to communicate meaning.

Allow each information layer to be switched on or off independently.

## 8. Scale boxes and positions

For pentatonic scales, show the five connected positions.

The user must be able to:

- Select Box 1, Box 2, Box 3, Box 4, or Box 5.
- View all five positions together.
- Highlight one position.
- Highlight two neighboring positions.
- See overlapping notes between positions.
- Follow a visual path between connected boxes.
- Select low, middle, high, or entire-neck register.

Do not treat the boxes as isolated patterns. Make the connections between them visually clear.

For seven-note and other scales, generate appropriate playable fingering regions based on the scale, tuning, and fretboard. Do not force every scale into a five-box pentatonic model.

Scale positions must be calculated from musical intervals and tuning, not manually hardcoded for each key.

The application should provide sensible default fingerings but allow future fingering alternatives.

## 9. Low, middle, and high register

Provide simple register controls:

**LOW** Show playable positions closer to the nut and lower-pitched areas of the neck.

**MIDDLE** Show central fretboard positions.

**HIGH** Show higher-pitched positions farther up the neck.

**ALL** Show the full neck and connected scale positions.

The register selector should filter or emphasize the relevant positions without changing the underlying scale or key.

The user must be able to override the automatic register recommendation.

Do not use fixed fret ranges as the only definition of a scale box. Position boundaries and register labels should be calculated or assigned from validated fingering layouts.

## 10. Chord and scale relationship

Keep chord calculations independent from scale calculations.

When a chord is active, show:

- Chord name.
- Chord formula.
- Chord notes.
- Chord tones that are also in the selected scale.
- Chord tones outside the selected scale.
- Suggested target notes.
- Nearby scale notes that can lead into target notes.

Explain the difference between a scale note and a chord tone.

Example: A minor pentatonic over A7:

- A is the root.
- C is the minor third/blues color.
- D is the fourth.
- E is the fifth.
- G is the flat seventh.
- C# is the major third of A7 and is outside A minor pentatonic.

The interface should make it clear that a note outside the selected scale is not automatically wrong. It may be a useful chord tone, passing tone, or intentional musical color.

## 11. Song-based scale recommendations

After analyzing a song, recommend scales based on its actual harmony.

Recommendations should distinguish between:

- A scale that works across much of the progression.
- A scale that emphasizes a specific chord.
- A scale that introduces a deliberate tension or color.

For each recommendation, show:

- Scale and key.
- Why it is recommended.
- Which chords it works over.
- Which notes may need careful treatment.
- Available fretboard positions.
- Suggested low, middle, or high register.

Never claim that one scale automatically works perfectly over every chord in a song.

Allow the user to select any scale from the 20-scale library even if it is not the top recommendation.

## 12. Automatic box recommendations

The application should recommend scale positions for each song section or chord passage.

Example for a 12-bar blues in A:

**Bars 1-4:** Chord A7. Suggested scale: A minor pentatonic. Suggested position: Box 1. Register: Low/middle.

**Bars 5-6:** Chord D7. Suggested scale: A minor pentatonic, with D7 chord-tone emphasis. Suggested position: Box 2 or a connected nearby position. Register: Middle.

**Bars 7-8:** Chord A7. Suggested position: Box 1 or Box 2. Register: Low/middle.

**Bar 9:** Chord E7. Suggested position: Box 3 or another convenient connected position. Register: Middle/high. Emphasize relevant E7 chord tones.

**Bar 10:** Chord D7. Suggested position: Box 2. Register: Middle.

**Bars 11-12:** Chords A7 and E7. Suggested movement: Box 1 toward Box 3, or another playable connected route. Register: Low to high.

These are practice suggestions, not mandatory jumps. The application should explain that a guitarist can remain in one position and follow the chord changes through target notes.

The recommendation engine must consider hand movement, position continuity, register, chord tones, and musical phrasing. Do not recommend a box solely because the chord changed.

## 13. Song structure and playback synchronization

As the song plays:

- Highlight the current chord.
- Highlight the current bar or timestamp.
- Show the next chord.
- Highlight the current song section.
- Highlight the recommended scale position.
- Update chord-tone and target-note layers.
- Keep the waveform, chord timeline, and fretboard synchronized.

Changing a scale, key display, box, or register must not restart playback.

Allow the user to:

- Loop a song section.
- Loop a chord or group of bars.
- Slow playback for practice.
- Adjust tempo when supported by the audio engine.
- Pause and resume.
- Jump to a chord or section.
- Practice with a metronome.

Do not promise beat-accurate chord synchronization until the audio analysis and timing engine can support it.

## 14. Build My Solo

Add a Build My Solo feature.

Let the user choose:

- Skill level.
- Scale.
- Key.
- Register.
- Scale box or connected boxes.
- Solo length.
- Musical style.
- Desired difficulty.

Generate original, playable lead-guitar exercises or solos that follow the analyzed chord progression.

Show:

- Chord for each section.
- Recommended scale.
- Recommended box.
- Fretboard notes.
- Guitar tablature.
- Bends, slides, hammer-ons, pull-offs, and vibrato where appropriate.
- Suggested target notes.
- Playback demonstration where supported.

The generated solo must be musically connected to the progression. Do not generate random scale-note sequences and label them as a finished solo.

## 15. Responsive UX

**DESKTOP** Use the full multi-panel workstation layout. Give the fretboard the largest share of the workspace.

**TABLET** Allow side panels to collapse or become drawers. Preserve a large, readable fretboard.

**MOBILE** Prioritize:

- Song player.
- Current chord.
- Scale and register selection.
- Large fretboard.
- Current box and next recommended box.

Use tabs, collapsible panels, or focused screens instead of shrinking the entire desktop interface onto a phone.

Touch targets must be large enough to use comfortably. Avoid controls that require precise tapping on tiny fretboard markers.

## 16. UX principles

1. **SHOW THE ANSWER FIRST** When a song is analyzed, make the key, current chord, recommended scale, and suggested box immediately visible.
2. **EXPLAIN WITHOUT OVERWHELMING** Use short explanations and expandable theory details.
3. **KEEP THE FRETBOARD CENTRAL** The user should not need to navigate away from the fretboard to understand what to play.
4. **MAKE RECOMMENDATIONS ACTIONABLE** Say exactly which scale, box, register, and target notes to try.
5. **SHOW UNCERTAINTY** Display confidence or an “Needs review” state for uncertain key, chord, or timing analysis. Let users correct the results.
6. **ALLOW MANUAL CONTROL** Automatic recommendations should never prevent users from choosing another scale, position, chord, or register.
7. **TEACH CONNECTIONS** Show how boxes overlap and how phrases can move between positions.
8. **PRESERVE PLAYBACK** Changing visual settings should not interrupt the song.
9. **USE CONSISTENT CONTROLS** The same type of action should look and behave the same throughout the application.
10. **ACCESSIBILITY** Use readable contrast, keyboard-accessible controls, visible focus states, descriptive labels, and non-color indicators.

## 17. Song input and analysis states

Design clear user flows and states for:

- No song loaded.
- Uploading a song.
- Processing audio.
- Analyzing key and tempo.
- Detecting chords.
- Mapping song structure.
- Analysis completed.
- Partial or uncertain analysis.
- Unsupported file or link.
- Playback unavailable.
- User correcting a chord or timestamp.

For YouTube, use permitted playback and access methods. Do not assume the application can freely download or extract arbitrary YouTube audio.

Provide a manual correction workflow for key, tempo, chords, and chord-change timestamps.

## 18. Technical and component architecture

Build reusable UI components rather than one oversized screen component.

Suggested components:

- AppHeader
- MainNavigation
- SongImportPanel
- SongPlayer
- WaveformTimeline
- ChordTimeline
- SongAnalysisPanel
- DetectedChordList
- WorkspaceTabs
- ScaleViewer
- ScaleSelector
- KeySelector
- RegisterSelector
- Fretboard
- FretboardString
- FretMarker
- ScalePositionOverlay
- ScaleLegend
- SelectedBoxDetails
- CurrentChordPanel
- RecommendedBoxesPanel
- ChordFinder
- PlaybackControls
- PracticeControls
- SoloBuilder

Keep UI components separate from music-theory and audio-processing logic.

Core engines should include:

- Audio Import Engine.
- Audio Analysis Engine.
- Key and Tempo Engine.
- Chord Recognition Engine.
- Song Structure Engine.
- Note and Interval Engine.
- Scale Library Engine.
- Fretboard Engine.
- Position Engine.
- Chord Engine.
- Progression Engine.
- Recommendation Engine.
- Playback Synchronization Engine.
- Tab and Solo Generation Engine.

Use data-driven scale definitions and reusable rendering logic.

## 19. Implementation order

Build in stages. Do not attempt to implement all features in one pass.

**PHASE 1: UI FOUNDATION**

- Establish design tokens, typography, colors, spacing, and panel styles.
- Build application header and navigation.
- Build the responsive song-analysis workspace.
- Build waveform and chord-timeline UI using realistic sample data.
- Build the Scale Viewer tab.

**PHASE 2: INTERACTIVE FRETBOARD**

- Implement strings, frets, notes, and tuning.
- Implement all 20 scale definitions.
- Support all 12 keys.
- Calculate note locations.
- Generate pentatonic positions and other appropriate fingering regions.
- Implement low, middle, high, and full-neck views.
- Add note layers and legends.

**PHASE 3: CHORD AWARENESS**

- Implement chord display and chord-tone calculation.
- Show scale/chord overlap and outside chord tones.
- Add target-note recommendations.
- Implement the 12-bar blues in A as a verified sample lesson.

**PHASE 4: SONG IMPORT AND ANALYSIS**

- Implement supported audio upload.
- Implement permitted YouTube integration.
- Add audio playback and waveform.
- Add key, tempo, chord, and song-structure analysis.
- Add manual correction and confidence states.

**PHASE 5: SYNCHRONIZATION AND RECOMMENDATIONS**

- Synchronize playback, chord timeline, and fretboard.
- Recommend scales and boxes for song sections.
- Preserve playback when changing views.

**PHASE 6: SOLO AND PRACTICE**

- Add tablature generation.
- Add original solo and exercise generation.
- Add practice loops and progress tracking.

## 20. Acceptance criteria

The UI/UX foundation is complete when:

- The main workspace follows the supplied visual direction.
- The fretboard is the dominant element in Scale Viewer.
- The song waveform and chord timeline are clearly visible.
- The detected chord list is readable and navigable.
- Scale, key, box, and register controls are easy to use.
- All five pentatonic positions can be displayed and selected.
- Connected positions and overlaps are visible.
- Other scales receive appropriate generated positions.
- Scale notes, roots, chord tones, and targets are visually distinguishable.
- The current chord and recommended box are easy to identify.
- The interface adapts properly to desktop, tablet, and mobile.
- Playback controls remain accessible.
- The UI has loading, error, empty, and uncertain-analysis states.
- All controls have working behavior; do not create decorative controls that appear functional but do nothing.
- Keyboard navigation and accessible contrast are supported.

## 21. Important Claude development rules

Before changing the codebase:

1. Inspect the existing project structure.
2. Identify the framework, dependencies, routing, styling system, and current components.
3. Review existing project instructions and conventions.
4. Reuse existing working functionality where possible.
5. Do not replace or rewrite unrelated parts of the application.

When implementing:

- Work in small, verifiable stages.
- Keep components reusable.
- Keep music calculations out of presentation components.
- Use real calculated data wherever functionality is implemented.
- Use clearly labeled sample data only for UI prototypes.
- Do not present mock analysis as real song analysis.
- Do not claim a feature works until it has been tested.
- Do not hardcode scale diagrams for every key.
- Do not hardcode chord progressions as if they were detected from an uploaded song.
- Preserve existing working features.
- Test desktop and mobile layouts.
- Report what was changed, what was tested, and what remains incomplete.

If a feature depends on an audio-analysis service, API, model, or external permission that is not configured, build the UI and a clearly identified integration boundary. Do not fabricate analysis results.

## Final product standard

Nukalhed22 Studios should feel like an intelligent guitar-learning workstation. A guitarist loads a song, sees the chords and progression, sees which scales and boxes to play, chooses a register, and learns how to follow the music on the fretboard.

The fretboard is the heart of the experience. The song timeline provides context. The scale and chord intelligence explains what to play. The teaching tools explain why it works.
