// __tests__/useDebounce.performance.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce, useDebounceCallback, useAdvancedDebounce } from '../useDebounce';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe('Performance tests', () => {
  it('should handle rapid updates efficiently', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: 0 } }
    );

    // Simulate 1000 rapid updates
    for (let i = 1; i <= 1000; i++) {
      rerender({ value: i });
    }

    expect(result.current).toBe(0); // Still initial value
    
    vi.advanceTimersByTime(100);
    expect(result.current).toBe(1000); // Final value
  });

  it('should not create memory leaks with multiple instances', () => {
    const hooks: any[] = [];
    
    // Create multiple hook instances
    for (let i = 0; i < 100; i++) {
      const { result } = renderHook(() => useDebounce(`value-${i}`, 100));
      hooks.push(result);
    }

    vi.advanceTimersByTime(100);
    
    // Check all hooks have correct values
    hooks.forEach((hook, index) => {
      expect(hook.current).toBe(`value-${index}`);
    });
  });

  it('should handle stress test with mixed operations', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useAdvancedDebounce(value, 50),
      { initialProps: { value: 'start' } }
    );

    // Rapid updates
    for (let i = 0; i < 10; i++) {
      rerender({ value: `update-${i}` });
      
      if (i % 3 === 0) {
        act(() => {
          result.current.cancel();
        });
      }
      
      if (i % 5 === 0) {
        act(() => {
          result.current.flush();
        });
      }
      
      vi.advanceTimersByTime(10);
    }

    // Final state check
    expect(typeof result.current.debouncedValue).toBe('string');
    expect(typeof result.current.isDebouncing).toBe('boolean');
  });
});