// Metronome State
const state = {
  bpm: 40,
  isRunning: false,
  randomMuteProbability: 0,
  lastTapTime: null,
  tapCount: 0,
  intervalId: null,
  nextNoteTime: 0,
  scheduleAheadTime: 0.1, // Schedule 100ms ahead
  lookahead: 10, // Check every 10ms for more responsive timing
};

// Audio Context
let audioContext = null;

// DOM Elements
const bpmEl = document.getElementById("tempo-display");
const statusEl = document.getElementById("status-display");
const muteEl = document.getElementById("mute");
const hintEl = document.getElementById("hint");
const randomInput = document.getElementById("random-input");

// Initialize Audio Context
function initAudio() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    console.error('Web Audio API not supported');
  }
}

// Play a single click sound
function playClick(time) {
  if (!audioContext) return;

  // Skip if random muting is active
  if (state.randomMuteProbability > 0 && Math.random() < state.randomMuteProbability) {
    return;
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Click sound: high frequency square wave
  oscillator.frequency.setValueAtTime(1000, time);
  oscillator.type = 'square';

  // Quick envelope for click sound
  gainNode.gain.setValueAtTime(0, time);
  gainNode.gain.linearRampToValueAtTime(0.3, time + 0.001); // Quick attack
  gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05); // Quick decay

  oscillator.start(time);
  oscillator.stop(time + 0.05);
}

// Scheduler function
function scheduler() {
  while (state.nextNoteTime < audioContext.currentTime + state.scheduleAheadTime) {
    playClick(state.nextNoteTime);
    state.nextNoteTime += 60.0 / state.bpm; // Time between beats in seconds
  }
}

// Main timer loop
function timerLoop() {
  if (state.isRunning) {
    scheduler();
  }
}

// Start metronome
function start() {
  if (state.isRunning) return;

  if (!audioContext) initAudio();

  state.isRunning = true;
  state.nextNoteTime = audioContext.currentTime + 0.05; // Start in 50ms

  // Start the timer loop
  state.intervalId = setInterval(timerLoop, state.lookahead);

  updateUI();
}

// Stop metronome
function stop() {
  state.isRunning = false;

  if (state.intervalId) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }

  updateUI();
}

// Handle tap tempo
function handleTapTempo() {
  if (!state.isRunning) return;

  const now = audioContext.currentTime;
  state.tapCount++;

  if (state.tapCount === 1) {
    state.lastTapTime = now;
  } else if (state.tapCount === 2) {
    const interval = now - state.lastTapTime;
    const newBpm = 60 / interval;

    // Clamp BPM between 30-300
    state.bpm = Math.max(30, Math.min(300, Math.round(newBpm)));

    updateUI();
    state.tapCount = 0;
  }
}

// Handle random muting input
function handleRandomMuting() {
  // Show input field with current value
  randomInput.style.display = 'block';
  randomInput.value = Math.round(state.randomMuteProbability * 100);
  randomInput.focus();
  randomInput.select();
}

// Apply random muting when input is confirmed
function applyRandomMuting() {
  const percent = parseInt(randomInput.value, 10);
  if (!isNaN(percent) && percent >= 0 && percent <= 100) {
    state.randomMuteProbability = percent / 100;
  }
  randomInput.style.display = 'none';
  updateUI();
}

// Update UI
function updateUI() {
  if (bpmEl) bpmEl.textContent = `BPM: ${Math.round(state.bpm)}`;
  if (statusEl) statusEl.textContent = state.isRunning ? "RUNNING" : "STOPPED";

  // Update mute display - only show when active
  if (muteEl) {
    const mutePercent = Math.round(state.randomMuteProbability * 100);
    if (mutePercent > 0) {
      muteEl.textContent = `Random mute: ${mutePercent}%`;
      muteEl.classList.add('active');
      muteEl.style.display = 'block';
    } else {
      muteEl.classList.remove('active');
      muteEl.style.display = 'none';
    }
  }

  // Update hint based on state
  if (hintEl) {
    if (state.isRunning) {
      hintEl.textContent = "T=tap tempo | R=random mute | H=half | D=double | SPACE=stop";
    } else {
      hintEl.textContent = "SPACE = start";
    }
  }
}

// Keyboard event handler
document.addEventListener("keydown", (e) => {
  // Handle random input field first
  if (randomInput.style.display !== 'none') {
    if (e.code === 'Enter') {
      applyRandomMuting();
      e.preventDefault();
      return;
    }
    if (e.code === 'Escape') {
      randomInput.style.display = 'none';
      e.preventDefault();
      return;
    }
    // Allow normal input handling for the input field
    return;
  }

  // Prevent default for our keys
  if (['Space', 'KeyT', 'KeyH', 'KeyD'].includes(e.code) || e.code.startsWith('KeyR')) {
    e.preventDefault();
  }

  switch (e.code) {
    case 'Space':
      if (state.isRunning) {
        stop();
      } else {
        start();
      }
      break;

    case 'KeyT':
      if (state.isRunning) {
        handleTapTempo();
      }
      break;

    case 'KeyH':
      if (state.isRunning) {
        state.bpm = Math.max(1, Math.round(state.bpm / 2));
        updateUI();
      }
      break;

    case 'KeyD':
      if (state.isRunning) {
        state.bpm = Math.min(300, Math.round(state.bpm * 2));
        updateUI();
      }
      break;

    default:
      if (e.code.startsWith('KeyR') && state.isRunning) {
        handleRandomMuting();
      }
      break;
  }
});

// Handle input field blur (clicking outside)
if (randomInput) {
  randomInput.addEventListener('blur', () => {
    applyRandomMuting();
  });
}

// Utility functions for testing
function calculateBpmFromInterval(intervalMs) {
  return Math.round(60000 / intervalMs);
}

// Initialize
updateUI();

// Mock Metronome class for testing compatibility
class Metronome {
  constructor() {
    this.currentBpm = 40;
    this.isRunning = false;
  }
}

// Export functions for testing (in Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateBpmFromInterval,
    Metronome
  };
}