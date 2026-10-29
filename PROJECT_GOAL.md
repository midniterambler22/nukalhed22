# Nukalhed22 Studios — Project Goal

## 1. Project Overview

Build an interactive guitar-learning application that helps guitar players understand songs, visualize notes and scales across the fretboard, recognize chord progressions, and learn to improvise with greater confidence.

The application should bridge the gap between hearing a song and understanding how to play along with it on guitar. Instead of relying on memorized patterns or isolated pentatonic boxes, users should learn how musical ideas connect across the entire fretboard.

The experience should be practical, visual, interactive, and accessible to guitarists who have experience playing but want to improve their understanding of music theory, fretboard navigation, and improvisation.

## 2. Primary Objective

Create an application that can analyze a song or backing track and help the user understand:

- The song's key and tonal center.
- The tempo and timing.
- The chord progression and when chord changes occur.
- Which scales and notes work over the progression.
- Where those notes appear on the guitar fretboard.
- How to transition smoothly between scale positions.
- How to practice playing along with the song.

The application should explain not only what to play, but also why it works and where to play it.

## 3. Core Features

### Song Selection and Audio Playback

Allow users to load supported local audio files, such as MP3, WAV, and M4A where browser support permits. Provide an authorized YouTube integration or supported link-based workflow where technically and legally available.

Users should be able to play, pause, seek, loop sections, and adjust playback speed when supported.

### Song Analysis

Analyze available audio to estimate:

- Musical key and tonal center.
- Beats per minute (BPM).
- Chord progression.
- Chord-change timestamps.
- Song sections and repeated progressions where feasible.

Display confidence or uncertainty when analysis is ambiguous. Users should be able to correct detected chords, keys, or timing rather than being forced to accept incorrect results.

### Interactive Guitar Fretboard

Build a clear, interactive fretboard that displays notes, scale tones, root notes, chord tones, and fingering positions.

Users should be able to select a key, scale, root note, tuning, and fret range. The fretboard should support standard tuning initially, with additional tunings considered later.

### Scale and Position Learning

Include a library of useful guitar scales and patterns, beginning with the minor pentatonic scale and its five connected positions.

Help users understand how positions connect instead of treating each shape as an isolated pattern. Show the root notes, neighboring positions, recommended fingerings, and practical ways to move between positions.

### Chord-Aware Improvisation

Use the current chord in the song to highlight notes that work well over that chord.

Distinguish between:

- Notes belonging to the overall key or scale.
- Chord tones that emphasize the current harmony.
- Optional passing tones and other color tones.

Recommend useful target notes and fretboard positions as the progression changes.

### Synchronized Play-Along

Keep the playback timeline, current chord, song position, and fretboard display synchronized as closely as the analysis allows.

As the song progresses, update the displayed chord and highlight relevant notes and scale positions. Provide clear visual feedback so users can anticipate transitions.

### Practice Tools

Include looping, tempo reduction, focused chord-transition practice, and exercises for connecting scale positions.

Track practice activity and allow users to save useful songs, settings, and personal corrections.

## 4. Target User

The primary user is an intermediate guitar player who can already play familiar riffs, chords, and scale patterns but wants to develop stronger fretboard awareness, music theory knowledge, and improvisational ability.

The application should also accommodate beginners through clear explanations and allow advanced players to explore more sophisticated harmony and scale choices.

## 5. Product Philosophy

The application should prioritize learning and musical understanding over overwhelming users with information.

Design principles:

- **Visual first:** Make musical relationships easy to see on the fretboard.
- **Song centered:** Teach theory in the context of real music.
- **Connected learning:** Emphasize transitions between positions and chord changes.
- **Practical explanations:** Explain concepts in straightforward language.
- **User control:** Allow corrections when automated analysis is inaccurate.
- **Progressive complexity:** Start simple and introduce advanced concepts as needed.
- **Responsive performance:** Keep the interface usable during active practice.
- **Respect for rights and privacy:** Handle user-provided audio responsibly and integrate external platforms through permitted methods.

## 6. Initial Release Scope

The first working version should focus on a small set of dependable features:

1. Load and play a local audio file.
2. Display an accurate, interactive guitar fretboard.
3. Select a key and minor pentatonic scale.
4. Display all five connected pentatonic positions.
5. Highlight root notes and scale tones.
6. Select or enter a chord progression manually.
7. Move through the progression using a basic timeline.
8. Save and reload a practice session.

Automated song analysis, advanced chord detection, external video integration, detailed song-section detection, and a Windows desktop package can be added in later phases.

## 7. Long-Term Vision

Develop a polished guitar-learning platform under the Nukalhed22 Studios name that combines song analysis, music theory, interactive fretboard visualization, and guided practice into one cohesive experience.

The long-term goal is to help guitarists move beyond memorized patterns, understand the relationship between chords and scales, navigate the entire neck confidently, and make more intentional musical decisions while playing.

**The defining product promise:** Help guitar players understand what is happening in a song, see where the music lives on the fretboard, and learn how to play along with purpose.
