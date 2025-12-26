const { calculateBpmFromInterval } = require('../public/metronome');

describe('Metronome Utility Functions', () => {
  describe('calculateBpmFromInterval', () => {
    test('calculates correct BPM for 500ms interval', () => {
      expect(calculateBpmFromInterval(500)).toBe(120);
    });

    test('calculates correct BPM for 1000ms interval', () => {
      expect(calculateBpmFromInterval(1000)).toBe(60);
    });

    test('calculates correct BPM for 250ms interval', () => {
      expect(calculateBpmFromInterval(250)).toBe(240);
    });

    test('rounds BPM to nearest integer', () => {
      expect(calculateBpmFromInterval(333)).toBe(180); // 60000/333 ≈ 180.18
    });

    test('handles edge case intervals', () => {
      expect(calculateBpmFromInterval(1)).toBe(60000);
      expect(calculateBpmFromInterval(60000)).toBe(1);
    });
  });
});

describe('Metronome Class', () => {
  let metronome;
  let mockAudioContext;

  beforeEach(() => {
    // Reset DOM elements
    document.body.innerHTML = `
      <div class="metronome">
        <div class="metronome__display">
          <div class="tempo-display" id="tempo-display">40 BPM</div>
          <div class="status-display" id="status-display">Stopped</div>
        </div>
      </div>
    `;

    // Mock AudioContext
    mockAudioContext = {
      currentTime: 0,
      createOscillator: jest.fn(() => ({
        connect: jest.fn(),
        frequency: { setValueAtTime: jest.fn() },
        type: 'square',
        start: jest.fn(),
        stop: jest.fn()
      })),
      createGain: jest.fn(() => ({
        connect: jest.fn(),
        gain: {
          setValueAtTime: jest.fn(),
          linearRampToValueAtTime: jest.fn(),
          exponentialRampToValueAtTime: jest.fn()
        }
      })),
      destination: {}
    };

    global.AudioContext.mockImplementation(() => mockAudioContext);

    // Import and create metronome instance
    const { Metronome } = require('../public/metronome');
    metronome = new Metronome();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  test('initializes with default values', () => {
    expect(metronome.currentBpm).toBe(40);
    expect(metronome.isRunning).toBe(false);
    expect(metronome.randomMutingEnabled).toBe(false);
    expect(metronome.randomMutingPercentage).toBe(0);
  });

  test('updates display correctly', () => {
    metronome.updateDisplay();
    expect(document.getElementById('tempo-display').textContent).toBe('40 BPM');
    expect(document.getElementById('status-display').textContent).toBe('Stopped');
  });

  test('starts metronome correctly', () => {
    jest.useFakeTimers();
    metronome.start();

    expect(metronome.isRunning).toBe(true);
    expect(metronome.intervalId).not.toBeNull();

    // Fast-forward time and check if playBeat is called
    jest.advanceTimersByTime(1500); // 1.5 seconds at 40 BPM = 1 second interval

    metronome.stop();
    jest.useRealTimers();
  });

  test('stops metronome correctly', () => {
    metronome.start();
    expect(metronome.isRunning).toBe(true);

    metronome.stop();
    expect(metronome.isRunning).toBe(false);
    expect(metronome.intervalId).toBeNull();
  });

  test('doubles tempo when running', () => {
    metronome.start();
    const originalBpm = metronome.currentBpm;

    metronome.doubleTempo();
    expect(metronome.currentBpm).toBe(originalBpm * 2);
  });

  test('halves tempo when running', () => {
    metronome.start();
    metronome.currentBpm = 80; // Set to 80 for clean halving
    metronome.halveTempo();
    expect(metronome.currentBpm).toBe(40);
  });

  test('does not change tempo when stopped', () => {
    expect(metronome.isRunning).toBe(false);

    const originalBpm = metronome.currentBpm;
    metronome.doubleTempo();
    metronome.halveTempo();

    expect(metronome.currentBpm).toBe(originalBpm);
  });

  test('clamps BPM within reasonable limits', () => {
    metronome.start();

    // Test doubling beyond limit
    metronome.currentBpm = 200;
    metronome.doubleTempo();
    expect(metronome.currentBpm).toBe(300); // Max limit

    // Test halving below limit
    metronome.currentBpm = 2;
    metronome.halveTempo();
    expect(metronome.currentBpm).toBe(1); // Min limit
  });
});