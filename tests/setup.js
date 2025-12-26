// Jest setup file
// Mock AudioContext for testing
global.AudioContext = jest.fn().mockImplementation(() => ({
  currentTime: 0,
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    frequency: {
      setValueAtTime: jest.fn()
    },
    type: '',
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
}));

global.webkitAudioContext = global.AudioContext;

// Mock console methods to reduce noise during testing
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};