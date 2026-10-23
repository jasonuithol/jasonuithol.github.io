#!/usr/bin/env python3
"""Keyboard recording -> sounds/hover.wav, the chip hover sound sprite.

Cuts single, well-isolated keystrokes out of Pixabay's "Keyboard sound
satisfying" (yzaak, Pixabay Content License), levels them, and packs them
SLOT seconds apart in one mono WAV. circuit-audio.js plays a random slot.
Onsets were picked by ranking strokes that are loud with quiet either side,
then thuddy ones were weeded out by their energy below 300 Hz.

    python3 tools/hover-sprite.py ~/Downloads/yzaak-keyboard-sound-satisfying-304411.mp3
"""

import subprocess
import sys
import wave

import numpy as np

SRC = sys.argv[1]
OUT = sys.argv[2] if len(sys.argv) > 2 else "sounds/hover.wav"
# 5.082 and 10.138 were dropped: a bottoming-out thud, and a second key
# landing inside the slice.
ONSETS = [3.972, 15.034, 0.084, 0.560, 3.700, 16.248]  # seconds
HIGHPASS = 250  # Hz: strips the desk thump under the remaining clicks
SR = 22050
PRE, LEN, FADE, SLOT = 0.004, 0.15, 0.03, 0.2  # seconds

pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", SRC, "-ac", "1", "-ar", str(SR),
                      "-af", f"highpass=f={HIGHPASS}:poles=2", "-f", "s16le", "-"],
                     check=True, capture_output=True).stdout
x = np.frombuffer(pcm, dtype=np.int16).astype(float) / 32768

n, fade = int(LEN * SR), int(FADE * SR)
ramp = np.ones(n)
ramp[-fade:] = np.linspace(1, 0, fade)
out = np.zeros(int(SLOT * SR) * len(ONSETS))
for k, t in enumerate(ONSETS):
    a = int((t - PRE) * SR)
    cut = x[max(a, 0):max(a, 0) + n] * ramp
    cut *= 0.9 / np.abs(cut).max()
    s = k * int(SLOT * SR)
    out[s:s + n] = cut

with wave.open(OUT, "wb") as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(SR)
    f.writeframes((out * 32767).astype("<i2").tobytes())
print(f"{len(ONSETS)} strokes -> {OUT}", file=sys.stderr)
