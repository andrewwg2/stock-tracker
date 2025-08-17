// __tests__/test-utils.ts
import { renderHook, act } from '@testing-library/react';

export const waitFor = (ms: number) => 
  new Promise(resolve => setTimeout(resolve, ms));

export const advanceTimersByTime = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};