// __tests__/useDebounce.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce, useDebounceCallback, useAdvancedDebounce } from './useDebounce';
import { advanceTimersByTime } from './tests-utils';

// Mock timers for all tests
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe('useDebounce', () => {
  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce value updates', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Update the value
    rerender({ value: 'updated', delay: 500 });
    expect(result.current).toBe('initial'); // Should still be initial

    // Advance time by less than delay
    advanceTimersByTime(300);
    expect(result.current).toBe('initial'); // Should still be initial

    // Advance time to complete delay
    advanceTimersByTime(200);
    expect(result.current).toBe('updated'); // Should now be updated
  });

  it('should reset timer on rapid value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'first' });
    advanceTimersByTime(300);
    
    rerender({ value: 'second' });
    advanceTimersByTime(300);
    
    rerender({ value: 'final' });
    expect(result.current).toBe('initial'); // Should still be initial
    
    advanceTimersByTime(500);
    expect(result.current).toBe('final'); // Should be the final value
  });

  it('should handle different data types', () => {
    // Test with numbers
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: 0 } }
    );

    numberRerender({ value: 42 });
    advanceTimersByTime(100);
    expect(numberResult.current).toBe(42);

    // Test with objects
    const initialObj = { id: 1, name: 'test' };
    const updatedObj = { id: 2, name: 'updated' };
    
    const { result: objectResult, rerender: objectRerender } = renderHook(
      ({ value }) => useDebounce(value, initialObj),
      { initialProps: { value: initialObj } }
    );

    objectRerender({ value: updatedObj });
    advanceTimersByTime(100);
    expect(objectResult.current).toEqual(updatedObj);

    // Test with arrays
    const { result: arrayResult, rerender: arrayRerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: [1, 2, 3] } }
    );

    arrayRerender({ value: [4, 5, 6] });
    advanceTimersByTime(100);
    expect(arrayResult.current).toEqual([4, 5, 6]);
  });

  it('should handle delay changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    rerender({ value: 'updated', delay: 200 }); // Change both value and delay
    advanceTimersByTime(200);
    expect(result.current).toBe('updated');
  });

  it('should cleanup timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    
    const { unmount } = renderHook(() => useDebounce('test', 500));
    
    unmount();
    
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});

describe('useDebounceCallback', () => {
  it('should debounce callback execution', () => {
    const mockCallback = vi.fn();
    const { result } = renderHook(() => 
      useDebounceCallback(mockCallback, 500)
    );

    // Call the debounced function multiple times rapidly
    act(() => {
      result.current('arg1');
      result.current('arg2');
      result.current('arg3');
    });

    // Callback should not have been called yet
    expect(mockCallback).not.toHaveBeenCalled();

    // Advance time
    advanceTimersByTime(500);

    // Callback should have been called only once with the last arguments
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('arg3');
  });

  it('should cancel previous calls when called rapidly', () => {
    const mockCallback = vi.fn();
    const { result } = renderHook(() => 
      useDebounceCallback(mockCallback, 300)
    );

    act(() => {
      result.current('first');
    });
    
    advanceTimersByTime(200);
    
    act(() => {
      result.current('second');
    });
    
    advanceTimersByTime(200); // Total 400ms, but second call resets timer
    expect(mockCallback).not.toHaveBeenCalled();
    
    advanceTimersByTime(100); // Complete the 300ms from second call
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('second');
  });

  it('should handle multiple arguments', () => {
    const mockCallback = vi.fn();
    const { result } = renderHook(() => 
      useDebounceCallback(mockCallback, 100)
    );

    act(() => {
      result.current('arg1', 'arg2', { key: 'value' });
    });

    advanceTimersByTime(100);

    expect(mockCallback).toHaveBeenCalledWith('arg1', 'arg2', { key: 'value' });
  });

  it('should respect dependency changes', () => {
    const mockCallback1 = vi.fn();
    const mockCallback2 = vi.fn();
    
    const { result, rerender } = renderHook(
      ({ callback, deps }) => useDebounceCallback(callback, 100, deps),
      { initialProps: { callback: mockCallback1, deps: ['dep1'] } }
    );

    const firstDebouncedCallback = result.current;

    // Change dependencies
    rerender({ callback: mockCallback2, deps: ['dep2'] });

    // Should return a different function reference
    expect(result.current).not.toBe(firstDebouncedCallback);
  });

  it('should cleanup timers on unmount', () => {
    const mockCallback = vi.fn();
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    
    const { result, unmount } = renderHook(() => 
      useDebounceCallback(mockCallback, 500)
    );

    act(() => {
      result.current('test');
    });

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('should handle callbacks that return values', () => {
    const mockCallback = vi.fn((x: number) => x * 2);
    const { result } = renderHook(() => 
      useDebounceCallback(mockCallback, 100)
    );

    let returnValue: any;
    act(() => {
      returnValue = result.current(5);
    });

    advanceTimersByTime(100);
    
    expect(mockCallback).toHaveBeenCalledWith(5);
    expect(mockCallback).toHaveReturnedWith(10);
  });
});

describe('useAdvancedDebounce', () => {
  it('should return initial state correctly', () => {
    const { result } = renderHook(() => 
      useAdvancedDebounce('initial', 500)
    );

    expect(result.current.debouncedValue).toBe('initial');
    expect(result.current.isDebouncing).toBe(false);
    expect(typeof result.current.cancel).toBe('function');
    expect(typeof result.current.flush).toBe('function');
  });

  it('should debounce value with isDebouncing state', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useAdvancedDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    expect(result.current.debouncedValue).toBe('initial');
    expect(result.current.isDebouncing).toBe(true);

    advanceTimersByTime(500);

    expect(result.current.debouncedValue).toBe('updated');
    expect(result.current.isDebouncing).toBe(false);
  });

  it('should handle immediate execution', () => {
    const { result, rerender } = renderHook(
      ({ value, immediate }) => useAdvancedDebounce(value, 500, immediate),
      { initialProps: { value: 'initial', immediate: true } }
    );

    rerender({ value: 'updated', immediate: true });

    // With immediate=true, value should update immediately
    expect(result.current.debouncedValue).toBe('updated');
    expect(result.current.isDebouncing).toBe(true);

    advanceTimersByTime(500);
    expect(result.current.isDebouncing).toBe(false);
  });

  it('should cancel debouncing', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useAdvancedDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });
    expect(result.current.isDebouncing).toBe(true);

    act(() => {
      result.current.cancel();
    });

    expect(result.current.isDebouncing).toBe(false);
    expect(result.current.debouncedValue).toBe('initial'); // Should remain unchanged
  });

  it('should flush debounced value immediately', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useAdvancedDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });
    expect(result.current.debouncedValue).toBe('initial');
    expect(result.current.isDebouncing).toBe(true);

    act(() => {
      result.current.flush();
    });

    expect(result.current.debouncedValue).toBe('updated');
    expect(result.current.isDebouncing).toBe(false);
  });

  it('should handle rapid value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useAdvancedDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'first' });
    advanceTimersByTime(100);
    
    rerender({ value: 'second' });
    advanceTimersByTime(100);
    
    rerender({ value: 'final' });
    
    expect(result.current.debouncedValue).toBe('initial');
    expect(result.current.isDebouncing).toBe(true);

    advanceTimersByTime(300);
    
    expect(result.current.debouncedValue).toBe('final');
    expect(result.current.isDebouncing).toBe(false);
  });

  it('should toggle between immediate and delayed mode', () => {
    const { result, rerender } = renderHook(
      ({ value, immediate }) => useAdvancedDebounce(value, 200, immediate),
      { initialProps: { value: 'initial', immediate: false } }
    );

    // Test delayed mode
    rerender({ value: 'delayed', immediate: false });
    expect(result.current.debouncedValue).toBe('initial');
    
    advanceTimersByTime(200);
    expect(result.current.debouncedValue).toBe('delayed');

    // Switch to immediate mode
    rerender({ value: 'immediate', immediate: true });
    expect(result.current.debouncedValue).toBe('immediate');
  });
});

describe('Integration tests', () => {
  it('should work in a typical search scenario', () => {
    const mockSearchFn = vi.fn();
    
    const { result, rerender } = renderHook(
      ({ query }) => {
        const debouncedQuery = useDebounce(query, 300);
        const search = useDebounceCallback(mockSearchFn, 200);
        return { debouncedQuery, search };
      },
      { initialProps: { query: '' } }
    );

    // Simulate rapid typing
    rerender({ query: 'h' });
    rerender({ query: 'he' });
    rerender({ query: 'hel' });
    rerender({ query: 'hello' });

    expect(result.current.debouncedQuery).toBe('');

    advanceTimersByTime(300);
    expect(result.current.debouncedQuery).toBe('hello');

    // Simulate search call
    act(() => {
      result.current.search(result.current.debouncedQuery);
    });

    advanceTimersByTime(200);
    expect(mockSearchFn).toHaveBeenCalledWith('hello');
  });

  it('should handle form validation scenario', () => {
    const validateFn = vi.fn((value: string) => value.length >= 3);
    
    const { result, rerender } = renderHook(
      ({ input }) => {
        const { debouncedValue, isDebouncing } = useAdvancedDebounce(input, 400);
        const validate = useDebounceCallback(() => validateFn(debouncedValue), 100);
        
        return { debouncedValue, isDebouncing, validate };
      },
      { initialProps: { input: '' } }
    );

    // Type too short input
    rerender({ input: 'ab' });
    expect(result.current.isDebouncing).toBe(true);
    
    advanceTimersByTime(400);
    expect(result.current.debouncedValue).toBe('ab');
    
    act(() => {
      result.current.validate();
    });
    
    advanceTimersByTime(100);
    expect(validateFn).toHaveBeenCalledWith('ab');
    expect(validateFn).toHaveReturnedWith(false);

    // Type valid input
    rerender({ input: 'valid' });
    advanceTimersByTime(400);
    
    act(() => {
      result.current.validate();
    });
    
    advanceTimersByTime(100);
    expect(validateFn).toHaveBeenLastCalledWith('valid');
    expect(validateFn).toHaveLastReturnedWith(true);
  });
});