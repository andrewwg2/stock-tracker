// __tests__/useDebounce.edge-cases.test.ts
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

describe('Edge Cases', () => {
  describe('useDebounce edge cases', () => {
    it('should handle zero delay', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 0),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });
      vi.advanceTimersByTime(0);
      
      expect(result.current).toBe('updated');
    });

    it('should handle undefined values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: undefined as string | undefined } }
      );

      expect(result.current).toBeUndefined();

      rerender({ value: 'defined' });
      vi.advanceTimersByTime(100);
      
      expect(result.current).toBe('defined');
    });

    it('should handle null values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: null as string | null } }
      );

      expect(result.current).toBeNull();

      rerender({ value: 'not null' });
      vi.advanceTimersByTime(100);
      
      expect(result.current).toBe('not null');
    });

    it('should handle negative delays (treat as 0)', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, -100),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });
      vi.advanceTimersByTime(0);
      
      expect(result.current).toBe('updated');
    });

    it('should handle very large delays', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, Number.MAX_SAFE_INTEGER),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });
      vi.advanceTimersByTime(1000000); // Advance by 1 million ms
      
      expect(result.current).toBe('initial'); // Should still be initial
    });
  });

  describe('useDebounceCallback edge cases', () => {
    it('should handle callback that throws error', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Test error');
      });
      
      const { result } = renderHook(() => 
        useDebounceCallback(errorCallback, 100)
      );

      act(() => {
        result.current();
      });

      expect(() => {
        vi.advanceTimersByTime(100);
      }).toThrow('Test error');
    });

    it('should handle async callbacks', async () => {
      const asyncCallback = vi.fn(async (value: string) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return `processed: ${value}`;
      });

      const { result } = renderHook(() => 
        useDebounceCallback(asyncCallback, 100)
      );

      act(() => {
        result.current('test');
      });

      vi.advanceTimersByTime(100);
      
      expect(asyncCallback).toHaveBeenCalledWith('test');
    });

    it('should handle empty dependency array', () => {
      const mockCallback = vi.fn();
      const { result, rerender } = renderHook(
        ({ value }) => {
          const debouncedFn = useDebounceCallback(() => mockCallback(value), 100, []);
          return debouncedFn;
        },
        { initialProps: { value: 'initial' } }
      );

      const firstRef = result.current;
      
      rerender({ value: 'updated' });
      
      // Should be the same reference due to empty deps
      expect(result.current).toBe(firstRef);
    });

    it('should handle no arguments callback', () => {
      const noArgsCallback = vi.fn();
      const { result } = renderHook(() => 
        useDebounceCallback(noArgsCallback, 100)
      );

      act(() => {
        result.current();
      });

      vi.advanceTimersByTime(100);
      
      expect(noArgsCallback).toHaveBeenCalledWith();
    });
  });

  describe('useAdvancedDebounce edge cases', () => {
    it('should handle flush when not debouncing', () => {
      const { result } = renderHook(() => 
        useAdvancedDebounce('initial', 500)
      );

      expect(result.current.isDebouncing).toBe(false);
      
      act(() => {
        result.current.flush();
      });

      expect(result.current.debouncedValue).toBe('initial');
      expect(result.current.isDebouncing).toBe(false);
    });

    it('should handle cancel when not debouncing', () => {
      const { result } = renderHook(() => 
        useAdvancedDebounce('initial', 500)
      );

      expect(result.current.isDebouncing).toBe(false);
      
      act(() => {
        result.current.cancel();
      });

      expect(result.current.debouncedValue).toBe('initial');
      expect(result.current.isDebouncing).toBe(false);
    });

    it('should handle multiple flushes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useAdvancedDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });
      
      act(() => {
        result.current.flush();
        result.current.flush(); // Second flush
      });

      expect(result.current.debouncedValue).toBe('updated');
      expect(result.current.isDebouncing).toBe(false);
    });

    it('should handle complex objects with immediate mode', () => {
      const complexObj = {
        nested: {
          array: [1, 2, 3],
          string: 'test'
        }
      };

      const updatedObj = {
        nested: {
          array: [4, 5, 6],
          string: 'updated'
        }
      };

      const { result, rerender } = renderHook(
        ({ value }) => useAdvancedDebounce(value, 200, true),
        { initialProps: { value: complexObj } }
      );

      rerender({ value: updatedObj });

      expect(result.current.debouncedValue).toEqual(updatedObj);
      expect(result.current.isDebouncing).toBe(true);

      vi.advanceTimersByTime(200);
      expect(result.current.isDebouncing).toBe(false);
    });
  });
});