Metronome Web App

A minimalist, keyboard-driven metronome web application designed for practice, rhythm training, and tempo control.

Core Behavior

The metronome has a default tempo of 40 BPM.

The space bar is the only key that starts and stops (pauses) the metronome.

All other keyboard interactions only work while the metronome is running.

Keyboard Controls
Start / Stop

Space bar

Starts or pauses the metronome.

Always resumes at the current BPM (default: 40 BPM).

Tap Tempo

t (press twice)

Activates tap tempo.

The time interval between the two presses determines the BPM.

The metronome immediately starts at the calculated tempo.

Random Muting

r + number

Opens a prompt (or input) to specify a percentage.

This percentage determines how often the metronome is randomly muted.

Example:

r50 → the metronome will be silent for 50% of beats, chosen randomly.

Tempo Adjustments

h

Halves the current BPM.

d

Doubles the current BPM.

Design Principles

Keyboard-first interaction

No mouse input required

Simple, distraction-free UI

Intended for musicians practicing timing and groove

Notes

Only the space bar can pause or restart the metronome.

All other controls modify behavior while playback is active.

Random muting is probabilistic and varies continuously over time.
