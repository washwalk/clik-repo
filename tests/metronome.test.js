const { calculateBpmFromInterval } = require('../metronome');

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

// Skipping class tests for now - implementation changed to functional approach
describe.skip('Metronome Class', () => {
  // Tests skipped due to architecture change from class to functional approach
});