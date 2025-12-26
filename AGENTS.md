# AGENTS.md - Development Guidelines for Metronome Web App

## Overview
This document provides development guidelines for the Metronome web application - a keyboard-driven metronome for musicians practicing timing and groove. The app features tempo control, tap tempo, random muting, and keyboard-first interaction.

## Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript/TypeScript
- **Build Tool**: Vite (recommended for fast development)
- **Package Manager**: npm or yarn
- **Version Control**: Git

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation
```bash
npm install
# or
yarn install
```

### Development Server
```bash
npm run dev
# or
yarn dev
```

## Build Commands

### Development Build
```bash
npm run build:dev
# or
yarn build:dev
```
Creates an unminified build for development testing.

### Production Build
```bash
npm run build
# or
yarn build
```
Creates an optimized, minified production build.

### Preview Production Build
```bash
npm run preview
# or
yarn preview
```
Serves the production build locally for testing.

## Testing Commands

### Run All Tests
```bash
npm test
# or
yarn test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
# or
yarn test:watch
```

### Run Single Test File
```bash
npm test -- path/to/test/file.test.js
# or
yarn test path/to/test/file.test.js
```

### Run Tests with Coverage
```bash
npm run test:coverage
# or
yarn test:coverage
```

## Linting and Code Quality

### Lint Code
```bash
npm run lint
# or
yarn lint
```

### Fix Lint Issues Automatically
```bash
npm run lint:fix
# or
yarn lint:fix
```

### Type Checking (if using TypeScript)
```bash
npm run typecheck
# or
yarn typecheck
```

### Format Code
```bash
npm run format
# or
yarn format
```

## Code Style Guidelines

### File Structure
```
src/
├── components/     # Reusable UI components
├── utils/         # Utility functions
├── hooks/         # Custom React hooks (if applicable)
├── styles/        # CSS/SCSS files
├── types/         # TypeScript type definitions
├── constants/     # Application constants
├── audio/         # Audio-related code
├── keyboard/      # Keyboard event handling
└── index.js       # Main entry point
```

### Naming Conventions

#### Files and Directories
- Use kebab-case for file names: `metronome-controls.js`
- Use PascalCase for React components: `MetronomeControls.jsx`
- Use camelCase for utility files: `audioUtils.js`

#### Variables and Functions
- Use camelCase: `currentBpm`, `startMetronome()`
- Use UPPER_SNAKE_CASE for constants: `DEFAULT_BPM = 40`
- Prefix boolean variables with `is`, `has`, `should`: `isRunning`, `hasTapTempo`

#### Classes and Components
- Use PascalCase: `MetronomeApp`, `TempoDisplay`
- Event handlers: `handleKeyPress`, `handleTempoChange`

### JavaScript/TypeScript Guidelines

#### Imports
```javascript
// Group imports: React, third-party libraries, local modules
import React, { useState, useEffect } from 'react';
import { Howl } from 'howler';

import { DEFAULT_BPM } from './constants';
import { playSound } from './audioUtils';
import TempoControls from './components/TempoControls';
```

#### Function Declarations
```javascript
// Use arrow functions for component methods
const MetronomeApp = () => {
  // Component logic
};

// Use function declarations for utility functions
function calculateBpmFromInterval(interval) {
  return Math.round(60000 / interval);
}
```

#### Event Handling
```javascript
// Keyboard events
const handleKeyPress = (event) => {
  const { key } = event;

  switch (key) {
    case ' ':
      toggleMetronome();
      break;
    case 't':
      handleTapTempo();
      break;
    case 'h':
      halveTempo();
      break;
    case 'd':
      doubleTempo();
      break;
    default:
      if (key.startsWith('r')) {
        handleRandomMuting(key);
      }
      break;
  }
};
```

### CSS Guidelines

#### Class Naming
- Use BEM methodology: `metronome__display`, `metronome__controls--active`
- Use descriptive, semantic names: `.tempo-display`, `.keyboard-hint`

#### Structure
```css
.metronome {
  /* Container styles */
}

.metronome__display {
  /* Display component styles */
}

.metronome__controls {
  /* Controls container */
}

.metronome__button {
  /* Button styles */
}

.metronome__button--active {
  /* Active button modifier */
}
```

### Error Handling

#### Try-Catch Blocks
```javascript
const loadAudioFiles = async () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    // Load audio files
  } catch (error) {
    console.error('Failed to initialize audio context:', error);
    // Fallback to alternative audio method
  }
};
```

#### User Input Validation
```javascript
const validateBpm = (bpm) => {
  if (typeof bpm !== 'number' || bpm < 1 || bpm > 300) {
    throw new Error('BPM must be a number between 1 and 300');
  }
  return bpm;
};
```

### Performance Considerations

#### Audio Context Management
- Initialize AudioContext only when needed
- Suspend/resume context appropriately
- Handle audio context state changes

#### Event Listeners
- Add keyboard listeners only when component mounts
- Remove listeners on unmount to prevent memory leaks
- Use passive listeners where appropriate

#### State Management
- Minimize unnecessary re-renders
- Use appropriate state update patterns
- Consider using useCallback for event handlers

### Accessibility

#### Keyboard Navigation
- Ensure all functionality is accessible via keyboard
- Provide visual feedback for keyboard interactions
- Use semantic HTML elements

#### Screen Readers
- Add ARIA labels where necessary
- Provide text alternatives for audio cues
- Ensure sufficient color contrast

### Testing Guidelines

#### Unit Tests
```javascript
// Test utility functions
describe('calculateBpmFromInterval', () => {
  test('calculates correct BPM for 500ms interval', () => {
    expect(calculateBpmFromInterval(500)).toBe(120);
  });
});
```

#### Component Tests
```javascript
// Test component behavior
describe('MetronomeControls', () => {
  test('starts metronome when spacebar is pressed', () => {
    // Test implementation
  });
});
```

#### Integration Tests
- Test keyboard interaction flows
- Test audio playback functionality
- Test tempo calculation accuracy

### Git Workflow

#### Commit Messages
- Use imperative mood: "Add tap tempo feature"
- Keep first line under 50 characters
- Add detailed description for complex changes

#### Branch Naming
- `feature/tap-tempo`: New features
- `fix/audio-initialization`: Bug fixes
- `refactor/keyboard-handling`: Code refactoring

### Deployment

#### Build Optimization
- Minify JavaScript and CSS
- Optimize images and assets
- Generate source maps for debugging

#### Environment Variables
- Use `.env` files for configuration
- Never commit secrets to repository
- Document required environment variables

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Test on mobile devices where possible
- Graceful degradation for older browsers

### Documentation
- Keep README updated with current features
- Document complex algorithms
- Add JSDoc comments for public APIs

## Additional Resources
- [Web Audio API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [KeyboardEvent Documentation](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
- [Vite Documentation](https://vitejs.dev/)

---

This document should be updated as the project evolves and new patterns emerge.