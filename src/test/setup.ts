/**
 * Test Setup Configuration
 * Global test setup for the Jest/Vitest environment
 */

import '@testing-library/jest-dom';

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock fetch
Object.defineProperty(window, 'fetch', {
  value: vi.fn(),
  writable: true,
});

// Mock console.error for cleaner test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Global test helpers
global.vi = vi;
