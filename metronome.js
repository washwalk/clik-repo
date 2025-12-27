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
let audioInitialized = false;

// iOS audio unmute
const USER_ACTIVATION_EVENTS = [
  'auxclick',
  'click',
  'contextmenu',
  'dblclick',
  'keydown',
  'keyup',
  'mousedown',
  'mouseup',
  'touchstart',
  'touchend'
]

function unmuteIosAudio () {
  const AudioContext = window.webkitAudioContext

  // To detect iOS, check for touch device and confirm Safari-only
  // webkitAudioContext is present.
  const isIos = navigator.maxTouchPoints > 0 && AudioContext != null

  if (!isIos) return

  // state can be 'blocked', 'pending', 'allowed'
  let htmlAudioState = 'blocked'
  let webAudioState = 'blocked'

  let audio
  let context
  let source

  const sampleRate = (new AudioContext()).sampleRate
  const silentAudioFile = createSilentAudioFile(sampleRate)

  USER_ACTIVATION_EVENTS.forEach(eventName => {
    window.addEventListener(
      eventName, handleUserActivation, { capture: true, passive: true }
    )
  })

  // Return a seven samples long 8 bit mono WAVE file
  function createSilentAudioFile (sampleRate) {
    const arrayBuffer = new ArrayBuffer(10)
    const dataView = new DataView(arrayBuffer)

    dataView.setUint32(0, sampleRate, true)
    dataView.setUint32(4, sampleRate, true)
    dataView.setUint16(8, 1, true)

    const missingCharacters =
      window.btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
        .slice(0, 13)

    return `data:audio/wav;base64,UklGRisAAABXQVZFZm10IBAAAAABAAEA${missingCharacters}AgAZGF0YQcAAACAgICAgICAAAA=`
  }

  function handleUserActivation (e) {
    if (htmlAudioState === 'blocked') {
      htmlAudioState = 'pending'
      createHtmlAudio()
    }
    if (webAudioState === 'blocked') {
      webAudioState = 'pending'
      createWebAudio()
    }
  }

  function createHtmlAudio () {
    audio = document.createElement('audio')

    audio.setAttribute('x-webkit-airplay', 'deny') // Disable the iOS control center media widget
    audio.preload = 'auto'
    audio.loop = true
    audio.src = silentAudioFile
    audio.load()

    audio.play().then(
      () => {
        htmlAudioState = 'allowed'
        maybeCleanup()
      },
      () => {
        htmlAudioState = 'blocked'

        audio.pause()
        audio.removeAttribute('src')
        audio.load()
        audio = null
      }
    )
  }

  function createWebAudio () {
    context = new AudioContext()

    source = context.createBufferSource()
    source.buffer = context.createBuffer(1, 1, 22050) // .045 msec of silence
    source.connect(context.destination)
    source.start()

    if (context.state === 'running') {
      webAudioState = 'allowed'
      maybeCleanup()
    } else {
      webAudioState = 'blocked'

      source.disconnect(context.destination)
      source = null

      context.close()
      context = null
    }
  }

  function maybeCleanup () {
    if (htmlAudioState !== 'allowed' || webAudioState !== 'allowed') return

    USER_ACTIVATION_EVENTS.forEach(eventName => {
      window.removeEventListener(
        eventName, handleUserActivation, { capture: true, passive: true }
      )
    })
  }
}

// Initialize unmute early
unmuteIosAudio();

// DOM Elements
const bpmEl = typeof document !== 'undefined' ? document.getElementById("tempo-display") : null;
const statusEl = typeof document !== 'undefined' ? document.getElementById("status-display") : null;
const muteEl = typeof document !== 'undefined' ? document.getElementById("mute") : null;
const hintEl = typeof document !== 'undefined' ? document.getElementById("hint") : null;
const randomInput = typeof document !== 'undefined' ? document.getElementById("random-input") : null;

// Detect iOS devices
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// Initialize Audio Context (called on page load)
function initAudio() {
  try {
  // For iOS, we'll create the audio context inside user gesture events
     if (isIOS()) {
       console.log('iOS detected - setting up audio context creation on user gesture');
       setupIOSAudioCreation();
       unmuteIosAudio(); // Enable WebAudio on iOS
     } else {
       // For non-iOS devices, create immediately
       audioContext = new (window.AudioContext || window.webkitAudioContext)();
       audioInitialized = true;
       console.log('Audio context initialized for non-iOS device, state:', audioContext.state);

       // Add state change listener for auto-resume
       audioContext.onstatechange = () => {
         if (audioContext.state === 'suspended') {
           audioContext.resume().catch(e => console.error('Resume failed:', e));
         }
       };
    }
  } catch (e) {
    console.error('Web Audio API not supported:', e);
  }
}

// Setup iOS-specific audio context creation inside user gestures
function setupIOSAudioCreation() {
  const createAudioContext = async () => {
    if (!audioContext) {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // iOS often starts in 'suspended' state, try to resume immediately
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        console.log('Audio context created and resumed on iOS, state:', audioContext.state);

        // Play a test sound and mark as ready
        playTestSound();
        onIOSAudioReady();
      } catch (error) {
        console.error('Failed to create/resume audio context on iOS:', error);
      }
    }
  };

  // Add creation listeners to user interaction events
  const events = ['touchstart', 'touchend', 'click', 'keydown'];

  events.forEach(event => {
    document.addEventListener(event, createAudioContext, {
      once: true, // Only trigger once
      passive: true
    });
  });
}

// Play a test sound to verify audio works
function playTestSound() {
  if (!audioContext || !audioInitialized || audioContext.state !== 'running') {
    return;
  }

  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);

    console.log('Test sound played successfully');
  } catch (error) {
    console.error('Failed to play test sound:', error);
  }
}

// Handle iOS audio context creation completion
function onIOSAudioReady() {
  audioInitialized = true;
  console.log('iOS audio fully ready');

  // Add state change listener for auto-resume
  if (audioContext) {
    audioContext.onstatechange = () => {
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(e => console.error('Resume failed:', e));
      }
    };
  }

  // If metronome was supposed to be running but couldn't start due to audio, start it now
  if (state.isRunning && !state.intervalId) {
    console.log('Starting metronome that was waiting for iOS audio');
    startMetronome();
  }

  updateUI();
}

// Play a single click sound
function playClick(time) {
  // Check if audio is ready (initialized and not suspended)
  if (!audioContext || !audioInitialized) {
    console.log('Audio not ready - context:', !!audioContext, 'initialized:', audioInitialized);
    return;
  }

  // If suspended, try to resume (skip this beat to avoid timing issues)
  if (audioContext.state === 'suspended') {
    console.log('Audio context suspended, attempting resume');
    audioContext.resume().catch(e => console.error('Resume failed in playClick:', e));
    return; // Skip this click, next will hopefully work
  }

  // Skip if random muting is active
  if (state.randomMuteProbability > 0 && Math.random() < state.randomMuteProbability) {
    return;
  }

  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // iOS-friendly click sound: lower frequency, sine wave for better compatibility
    const frequency = isIOS() ? 800 : 1000; // Lower frequency for iOS
    const waveType = isIOS() ? 'sine' : 'square'; // Sine wave works better on iOS

    oscillator.frequency.setValueAtTime(frequency, time);
    oscillator.type = waveType;

    // Quick envelope for click sound - slightly longer for iOS
    const attackTime = isIOS() ? 0.005 : 0.001;
    const decayTime = isIOS() ? 0.08 : 0.05;
    const gainLevel = isIOS() ? 0.2 : 0.3; // Lower gain for iOS

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(gainLevel, time + attackTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

    oscillator.start(time);
    oscillator.stop(time + decayTime);

    console.log('Click played at time:', time, 'frequency:', frequency);
  } catch (error) {
    console.error('Error playing audio:', error);
  }
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

  // For iOS, if audio context doesn't exist yet, trigger creation
  if (isIOS() && !audioContext) {
    console.log('iOS: Audio context not ready yet, metronome will start after user interaction');
    // Don't start metronome yet - wait for audio context creation
    return;
  }

  // Try to resume audio context if suspended
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      audioInitialized = true;
      console.log('Audio context resumed when starting metronome');
      startMetronome();
    }).catch(error => {
      console.error('Failed to resume audio context:', error);
      startMetronome(); // Start anyway, audio might work on next interaction
    });
  } else {
    startMetronome();
  }
}

function startMetronome() {
  state.isRunning = true;
  if (audioContext) {
    state.nextNoteTime = audioContext.currentTime + 0.05; // Start in 50ms
  }

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
  if (statusEl) {
    if (state.isRunning) {
      if (audioInitialized && audioContext && audioContext.state === 'running') {
        statusEl.textContent = "RUNNING";
        statusEl.classList.remove('audio-disabled');
      } else {
        statusEl.textContent = "RUNNING (NO AUDIO - TAP TO ENABLE)";
        statusEl.classList.add('audio-disabled');
      }
    } else {
      statusEl.textContent = "STOPPED";
      statusEl.classList.remove('audio-disabled');
    }
  }

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

  // Update hint based on state and audio status
  if (hintEl) {
    if (isIOS() && (!audioContext || !audioInitialized)) {
      hintEl.textContent = "TAP START TO ENABLE AUDIO ON iOS";
    } else if (!audioInitialized || (audioContext && audioContext.state === 'suspended')) {
      hintEl.textContent = "TAP ANYWHERE TO ENABLE AUDIO";
    } else if (state.isRunning) {
      hintEl.textContent = "Use buttons below or: T=tap tempo | R=random mute | H=half | D=double | SPACE=stop";
    } else {
      hintEl.textContent = "Use START button below or press SPACE";
    }
  }

  // Update mobile buttons
  updateMobileButtons();
}

// Keyboard event handler
document.addEventListener("keydown", (e) => {
  // Resume audio context on iOS for any key press
  if (isIOS() && audioContext) {
    audioContext.resume().catch(e => console.error('Resume failed on keydown:', e));
  }

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
      if (isIOS() && !audioContext) {
        // On iOS, space key before audio is enabled should create audio context
        initAudio();
        console.log('iOS: Audio initialization triggered by space key');
        return;
      }

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
if (typeof randomInput !== 'undefined' && randomInput) {
  randomInput.addEventListener('blur', () => {
    applyRandomMuting();
  });
}

// Mobile Touch Controls
const startStopBtn = typeof document !== 'undefined' ? document.getElementById('start-stop-btn') : null;
const halfBtn = typeof document !== 'undefined' ? document.getElementById('half-btn') : null;
const tapBtn = typeof document !== 'undefined' ? document.getElementById('tap-btn') : null;
const doubleBtn = typeof document !== 'undefined' ? document.getElementById('double-btn') : null;
const muteBtn = typeof document !== 'undefined' ? document.getElementById('mute-btn') : null;

// Add mobile button event listeners
if (startStopBtn) {
  startStopBtn.addEventListener('click', () => {
    // Resume audio context on iOS
    if (isIOS() && audioContext) {
      audioContext.resume().catch(e => console.error('Resume failed on start button:', e));
    }

    if (isIOS() && !audioContext) {
      // On iOS, clicking start before audio is enabled should create audio context
      initAudio();
      // The audio creation will be handled by the gesture event
      console.log('iOS: Audio initialization triggered by start button');
      return;
    }

    if (state.isRunning) {
      stop();
    } else {
      start();
    }
  });
}

if (halfBtn) {
  halfBtn.addEventListener('click', () => {
    // Resume audio context on iOS
    if (isIOS() && audioContext) {
      audioContext.resume().catch(e => console.error('Resume failed on half button:', e));
    }

    if (state.isRunning) {
      state.bpm = Math.max(1, Math.round(state.bpm / 2));
      updateUI();
    }
  });
}

if (tapBtn) {
  tapBtn.addEventListener('click', () => {
    // Resume audio context on iOS
    if (isIOS() && audioContext) {
      audioContext.resume().catch(e => console.error('Resume failed on tap button:', e));
    }

    if (state.isRunning) {
      handleTapTempo();
    }
  });
}

if (doubleBtn) {
  doubleBtn.addEventListener('click', () => {
    // Resume audio context on iOS
    if (isIOS() && audioContext) {
      audioContext.resume().catch(e => console.error('Resume failed on double button:', e));
    }

    if (state.isRunning) {
      state.bpm = Math.min(300, Math.round(state.bpm * 2));
      updateUI();
    }
  });
}

if (muteBtn) {
  muteBtn.addEventListener('click', () => {
    // Resume audio context on iOS
    if (isIOS() && audioContext) {
      audioContext.resume().catch(e => console.error('Resume failed on mute button:', e));
    }

    if (state.isRunning) {
      handleRandomMuting();
    }
  });
}

// Update mobile button text based on state
function updateMobileButtons() {
  if (startStopBtn) {
    if (isIOS() && !audioContext) {
      startStopBtn.textContent = 'ENABLE AUDIO';
    } else {
      startStopBtn.textContent = state.isRunning ? 'STOP' : 'START';
    }
  }
}

// Modify updateUI to also update mobile buttons
const originalUpdateUI = updateUI;
updateUI = function() {
  originalUpdateUI();
  updateMobileButtons();
};

// Utility functions for testing
function calculateBpmFromInterval(intervalMs) {
  return Math.round(60000 / intervalMs);
}

// Initialize audio on page load
initAudio();

// Initialize UI
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
}// redeploy trigger
// force redeploy
// force redeploy
// redeploy trigger
