// useLocalStorage.test.ts
/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLocalStorage, useLocalStorageWithExpiry, useLocalStorageCache } from './useLocalStorage';

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

describe('useLocalStorage', () => {
  let mockLocalStorage: Record<string, string>;
  let localStorageGetItemSpy: Mock;
  let localStorageSetItemSpy: Mock;
  let localStorageRemoveItemSpy: Mock;

  beforeEach(() => {
    // Reset window to ensure it exists
    if (!global.window) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      global.window = {};
    }
    
    mockLocalStorage = {};
    
    localStorageGetItemSpy = vi.fn((key: string) => mockLocalStorage[key] || null);
    localStorageSetItemSpy = vi.fn((key: string, value: string) => {
      mockLocalStorage[key] = value;
    });
    localStorageRemoveItemSpy = vi.fn((key: string) => {
      delete mockLocalStorage[key];
    });

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: localStorageGetItemSpy,
        setItem: localStorageSetItemSpy,
        removeItem: localStorageRemoveItemSpy,
        clear: vi.fn(() => {
          mockLocalStorage = {};
        }),
        key: vi.fn(),
        length: 0,
      },
      writable: true,
      configurable: true,
    });

    // Mock window event methods
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
    window.dispatchEvent = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockLocalStorage = {};
  });

  describe('Basic functionality', () => {
    it('should return initial value when localStorage is empty', () => {
      const { result } = renderHook(() => useLocalStorage('testKey', 'initialValue'));
      expect(result.current[0]).toBe('initialValue');
    });

    it('should return stored value when localStorage has value', async () => {
      mockLocalStorage.testKey = JSON.stringify('storedValue');
      const { result } = renderHook(() => useLocalStorage('testKey', 'initialValue'));
      
      // After hydration, it should use the stored value
      await waitFor(() => {
        expect(result.current[0]).toBe('storedValue');
      });
    });

    it('should update localStorage when setting value', async () => {
      const { result } = renderHook(() => useLocalStorage('testKey', 'initialValue'));
      
      await act(async () => {
        result.current[1]('newValue');
      });

      expect(result.current[0]).toBe('newValue');
      expect(localStorageSetItemSpy).toHaveBeenCalledWith('testKey', JSON.stringify('newValue'));
    });

    it('should accept function updater', async () => {
      const { result } = renderHook(() => useLocalStorage('testKey', 0));
      
      await act(async () => {
        result.current[1](prev => prev + 1);
      });

      expect(result.current[0]).toBe(1);
      expect(localStorageSetItemSpy).toHaveBeenCalledWith('testKey', '1');
    });

    it('should remove value from localStorage', async () => {
      const { result } = renderHook(() => useLocalStorage('testKey', 'initialValue'));
      
      await act(async () => {
        result.current[1]('someValue');
      });

      await act(async () => {
        result.current[2](); // removeValue
      });

      expect(result.current[0]).toBe('initialValue');
      expect(localStorageRemoveItemSpy).toHaveBeenCalledWith('testKey');
    });
  });

  describe('SSR behavior', () => {
    it('should work when window is undefined', () => {
      const originalWindow = global.window;
      const originalLocalStorage = originalWindow?.localStorage;
      
      // Temporarily remove window.localStorage
      if (originalWindow) {
        delete (originalWindow as any).localStorage;
      }
      
      const { result } = renderHook(() => useLocalStorage('testKey', 'initialValue'));
      
      expect(result.current[0]).toBe('initialValue');
      
      // Setting value should not throw
      act(() => {
        result.current[1]('newValue');
      });

      // Value should update in state even without localStorage
      expect(result.current[0]).toBe('newValue');
      
      // Restore localStorage
      if (originalWindow && originalLocalStorage) {
        Object.defineProperty(originalWindow, 'localStorage', {
          value: originalLocalStorage,
          writable: true,
          configurable: true,
        });
      }
    });
  });

  describe('Hydration behavior', () => {
    it('should rehydrate from localStorage after mount', async () => {
      // Set value in localStorage before rendering
      mockLocalStorage.testKey = JSON.stringify('hydratedValue');
      
      const { result } = renderHook(() => useLocalStorage('testKey', 'initialValue'));
      
      // Wait for effect to run
      await waitFor(() => {
        expect(result.current[0]).toBe('hydratedValue');
      });
    });

    it('should handle corrupted localStorage data during hydration', async () => {
      mockLocalStorage.testKey = 'invalid json {';
      
      const { result } = renderHook(() => useLocalStorage('testKey', 'fallbackValue'));
      
      // Should fallback to initial value
      expect(result.current[0]).toBe('fallbackValue');
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('Error'),
          expect.any(Error)
        );
      });
    });
  });

  describe('Cross-tab synchronization', () => {
    it('should update value when storage event is fired', async () => {
      const { result } = renderHook(() => useLocalStorage('testKey', 'initialValue'));
      
      // Get the storage event handler that was registered
      const addEventListenerCalls = (window.addEventListener as Mock).mock.calls;
      const storageHandlerCall = addEventListenerCalls.find(call => call[0] === 'storage');
      const storageHandler = storageHandlerCall?.[1];

      expect(storageHandler).toBeDefined();

      // Create a proper storage event without storageArea (it's optional in many browsers)
      const event = new Event('storage') as StorageEvent;
      Object.defineProperties(event, {
        key: { value: 'testKey', writable: false },
        newValue: { value: JSON.stringify('valueFromOtherTab'), writable: false },
        oldValue: { value: JSON.stringify('initialValue'), writable: false },
      });

      // Simulate storage event from another tab
      await act(async () => {
        storageHandler(event);
      });

      expect(result.current[0]).toBe('valueFromOtherTab');
    });

    it('should handle removal in another tab', async () => {
      const { result } = renderHook(() => useLocalStorage('testKey', 'initialValue'));
      
      await act(async () => {
        result.current[1]('someValue');
      });

      // Get the storage event handler
      const addEventListenerCalls = (window.addEventListener as Mock).mock.calls;
      const storageHandlerCall = addEventListenerCalls.find(call => call[0] === 'storage');
      const storageHandler = storageHandlerCall?.[1];

      // Create event for removal
      const event = new Event('storage') as StorageEvent;
      Object.defineProperties(event, {
        key: { value: 'testKey', writable: false },
        newValue: { value: null, writable: false },
        oldValue: { value: JSON.stringify('someValue'), writable: false },
      });

      // Simulate removal from another tab
      await act(async () => {
        storageHandler(event);
      });

      expect(result.current[0]).toBe('initialValue');
    });
  });

  describe('Same-tab synchronization', () => {
    it('should update value when custom localstorage event is fired', async () => {
      const { result } = renderHook(() => useLocalStorage('testKey', 'initialValue'));
      
      // Get the custom event handler
      const addEventListenerCalls = (window.addEventListener as Mock).mock.calls;
      const customHandlerCall = addEventListenerCalls.find(call => call[0] === 'localstorage');
      const customHandler = customHandlerCall?.[1];

      expect(customHandler).toBeDefined();

      // Simulate custom event from same tab
      await act(async () => {
        customHandler(new CustomEvent('localstorage', {
          detail: { key: 'testKey', newValue: JSON.stringify('valueFromSameTab') }
        }));
      });

      expect(result.current[0]).toBe('valueFromSameTab');
    });

    it('should dispatch custom event when setting value', async () => {
      const { result } = renderHook(() => useLocalStorage('testKey', 'initialValue'));
      
      await act(async () => {
        result.current[1]('newValue');
      });

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'localstorage',
          detail: { key: 'testKey', newValue: JSON.stringify('newValue') }
        })
      );
    });
  });

  describe('Error handling', () => {
it('should handle localStorage.setItem errors gracefully (optimistic=false)', () => {
  const { result } = renderHook(() => useLocalStorage('testKey', 'initialValue'));

  // Let availability probe succeed; fail only for the real business key
  localStorageSetItemSpy.mockImplementation((key: string) => {
    if (key === 'testKey') throw new Error('QuotaExceededError');
  });

  act(() => {
    result.current[1]('newValue');
  });

  // State should NOT change (strict/durable semantics)
  expect(result.current[0]).toBe('initialValue');

  // We attempted to persist that new value…
  expect(localStorageSetItemSpy).toHaveBeenCalledWith('testKey', JSON.stringify('newValue'));

  // …and we logged the failure
  expect(console.error).toHaveBeenCalledWith(
    expect.stringContaining('Error setting localStorage'),
    expect.any(Error)
  );

  // Optional: no same-tab sync event should fire if persistence failed
  if ((window as any).dispatchEvent?.mock) {
    expect((window.dispatchEvent as any).mock.calls.length).toBe(0);
  }
});

    it('should handle localStorage access errors (private browsing)', () => {
      // Simulate localStorage being completely inaccessible
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('Access denied');
        },
        configurable: true,
      });

      const { result } = renderHook(() => useLocalStorage('testKey', 'initialValue'));
      
      expect(result.current[0]).toBe('initialValue');
      
      // Should still work with in-memory state
      act(() => {
        result.current[1]('newValue');
      });
      
      expect(result.current[0]).toBe('newValue');
    });
  });

  describe('Key changes', () => {
    it('should rehydrate when key changes', async () => {
      mockLocalStorage.key1 = JSON.stringify('value1');
      mockLocalStorage.key2 = JSON.stringify('value2');
      
      const { result, rerender } = renderHook(
        ({ key }) => useLocalStorage(key, 'default'),
        { initialProps: { key: 'key1' } }
      );
      
      await waitFor(() => {
        expect(result.current[0]).toBe('value1');
      });
      
      rerender({ key: 'key2' });
      
      await waitFor(() => {
        expect(result.current[0]).toBe('value2');
      });
    });
  });
});

describe('useLocalStorageWithExpiry', () => {
  // Use a locally re-imported hook here
  let useLocalStorageWithExpiryHook:
    typeof import('./useLocalStorage')['useLocalStorageWithExpiry'];

  let mockLocalStorage: Record<string, string>;
  let mockDateNow: Mock;

  // 1) Create window first, then reset modules, then dynamic import the hook
  beforeAll(async () => {
    if (!(globalThis as any).window) (globalThis as any).window = {} as any;
    const w = globalThis.window as any;
    w.addEventListener ??= vi.fn();
    w.removeEventListener ??= vi.fn();
    w.dispatchEvent ??= vi.fn();

    await vi.resetModules();
    ({ useLocalStorageWithExpiry: useLocalStorageWithExpiryHook } =
      await import('./useLocalStorage')); // <-- use THIS in tests
  });

  beforeEach(() => {
    mockLocalStorage = {};
    mockDateNow = vi.fn(() => 1000);
    vi.spyOn(Date, 'now').mockImplementation(mockDateNow);

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((k: string) => mockLocalStorage[k] ?? null),
        setItem: vi.fn((k: string, v: string) => { mockLocalStorage[k] = v; }),
        removeItem: vi.fn((k: string) => { delete mockLocalStorage[k]; }),
        clear: vi.fn(() => { mockLocalStorage = {}; }),
        key: vi.fn(),
        length: 0,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should return expired status for expired values', () => {
    mockLocalStorage.testKey = JSON.stringify({ value: 'expired', expiry: 500 });

    const { result } = renderHook(() =>
      useLocalStorageWithExpiryHook('testKey', 'defaultValue', 5000)
    );

    // Assert immediately; no waitFor (effects may later flip the flag)
    expect(result.current[0]).toBe('defaultValue');
    expect(result.current[3]).toBe(false);
  });

  it('cleans expired values on mount (final state)', async () => {
    mockLocalStorage.testKey = JSON.stringify({ value: 'expired', expiry: 500 });

    const { result } = renderHook(() =>
      useLocalStorageWithExpiryHook('testKey', 'defaultValue', 5000)
    );

    await waitFor(() => {
      expect(result.current[0]).toBe('defaultValue');
      expect(result.current[3]).toBe(false); // after effect cleanup
    });
  });
});
describe('useLocalStorageCache', () => {
  let mockLocalStorage: Record<string, string>;
  let mockDateNow: Mock;
  let originalObjectKeys: typeof Object.keys;

  beforeEach(() => {
    // Ensure window exists
    if (!global.window) {
      // @ts-ignore
      global.window = {};
    }
    
    mockLocalStorage = {};
    mockDateNow = vi.fn(() => 1000);
    vi.spyOn(Date, 'now').mockImplementation(mockDateNow);
    
    // Store original Object.keys
    originalObjectKeys = Object.keys;
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
        clear: vi.fn(() => {
          mockLocalStorage = {};
        }),
        key: vi.fn(),
        length: 0,
      },
      writable: true,
      configurable: true,
    });

    // Mock Object.keys to return our mock storage keys when called on localStorage
    Object.keys = vi.fn((obj) => {
      if (typeof window !== 'undefined' && obj === window.localStorage) {
        return originalObjectKeys(mockLocalStorage);
      }
      return originalObjectKeys(obj);
    }) as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    Object.keys = originalObjectKeys;
  });

  describe('Cache operations', () => {
    it('should set and get cache items', () => {
      const { result } = renderHook(() => useLocalStorageCache<any>('cache', 10));
      
      act(() => {
        result.current.setItem('item1', { data: 'test' });
      });
      
      const item = result.current.getItem('item1');
      expect(item).toEqual({ data: 'test' });
    });

    it('should handle cache expiration', () => {
      const { result } = renderHook(() => useLocalStorageCache<string>('cache', 10));
      
      act(() => {
        result.current.setItem('item1', 'value1', 5000);
      });
      
      // Advance time past expiration
      mockDateNow.mockReturnValue(10000);
      
      const item = result.current.getItem('item1');
      expect(item).toBeNull();
    });

    it('should enforce max items limit', () => {
      const { result } = renderHook(() => useLocalStorageCache<string>('cache', 2));
      
      // Add 3 items with different timestamps
      act(() => {
        mockDateNow.mockReturnValue(1000);
        result.current.setItem('item1', 'value1');
      });
      
      act(() => {
        mockDateNow.mockReturnValue(2000);
        result.current.setItem('item2', 'value2');
      });
      
      act(() => {
        mockDateNow.mockReturnValue(3000);
        result.current.setItem('item3', 'value3');
      });
      
      // Oldest item should be removed
      expect(mockLocalStorage['cache_item1']).toBeUndefined();
      expect(mockLocalStorage['cache_item2']).toBeDefined();
      expect(mockLocalStorage['cache_item3']).toBeDefined();
    });

    it('should remove specific items', () => {
      const { result } = renderHook(() => useLocalStorageCache<string>('cache', 10));
      
      act(() => {
        result.current.setItem('item1', 'value1');
      });
      
      expect(result.current.getItem('item1')).toBe('value1');
      
      act(() => {
        result.current.removeItem('item1');
      });
      
      expect(result.current.getItem('item1')).toBeNull();
    });

    it('should clear all cache items with prefix', () => {
      const { result } = renderHook(() => useLocalStorageCache<string>('cache', 10));
      
      act(() => {
        result.current.setItem('item1', 'value1');
        result.current.setItem('item2', 'value2');
        mockLocalStorage['other_key'] = 'should_not_be_removed';
      });
      
      act(() => {
        result.current.clearAll();
      });
      
      expect(mockLocalStorage['cache_item1']).toBeUndefined();
      expect(mockLocalStorage['cache_item2']).toBeUndefined();
      expect(mockLocalStorage['other_key']).toBe('should_not_be_removed');
    });
  });

  describe('SSR behavior', () => {
    it('should handle SSR environment gracefully', () => {
      const originalLocalStorage = window.localStorage;
      
      // Temporarily remove localStorage
      delete (window as any).localStorage;
      
      const { result } = renderHook(() => useLocalStorageCache('cache', 10));
      
      // Operations should not throw
      expect(() => {
        result.current.setItem('item1', 'value1');
        const value = result.current.getItem('item1');
        result.current.removeItem('item1');
        result.current.clearAll();
      }).not.toThrow();
      
      // Get should return null when localStorage is not available
      expect(result.current.getItem('item1')).toBeNull();
      
      // Restore localStorage
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
        configurable: true,
      });
    });
  });
});

describe('Integration tests', () => {
  let mockLocalStorage: Record<string, string>;

  beforeEach(() => {
    if (!global.window) {
      // @ts-ignore
      global.window = {};
    }
    
    mockLocalStorage = {};
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
        clear: vi.fn(),
        key: vi.fn(),
        length: 0,
      },
      writable: true,
      configurable: true,
    });

    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
    window.dispatchEvent = vi.fn();
  });

  it('should handle multiple hooks with same key', async () => {
    const { result: result1 } = renderHook(() => useLocalStorage('sharedKey', 'initial'));
    const { result: result2 } = renderHook(() => useLocalStorage('sharedKey', 'initial'));
    
    // Get event handlers
    const addEventListenerCalls = (window.addEventListener as Mock).mock.calls;
    const customHandlers = addEventListenerCalls
      .filter(call => call[0] === 'localstorage')
      .map(call => call[1]);

    await act(async () => {
      result1.current[1]('updated');
    });
    
    // Simulate the custom event being received by the second hook
    const dispatchedEvent = (window.dispatchEvent as Mock).mock.calls[0]?.[0];
    if (dispatchedEvent && customHandlers[1]) {
      await act(async () => {
        customHandlers[1](dispatchedEvent);
      });
    }
    
    expect(result1.current[0]).toBe('updated');
    expect(result2.current[0]).toBe('updated');
  });

  it('should handle complex objects', async () => {
    const complexObject = {
      user: { name: 'John', age: 30 },
      settings: { theme: 'dark', notifications: true },
      array: [1, 2, 3],
    };
    
    const { result } = renderHook(() => useLocalStorage('complex', complexObject));
    
    await act(async () => {
      result.current[1](prev => ({
        ...prev,
        user: { ...prev.user, age: 31 },
      }));
    });
    
    expect(result.current[0].user.age).toBe(31);
    expect(result.current[0].settings).toEqual(complexObject.settings);
  });
}); 