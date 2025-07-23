import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOscillationAnalysis } from './useOscillatorAnalysis';
import { oscillatorService } from '../services';

// Mock the oscillator service
vi.mock('../services', () => ({
  oscillatorService: {
    analyzeOscillation: vi.fn()
  },
  stockApiService: {
    getStockQuote: vi.fn()
  }
}));

describe('useOscillationAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns analysis result from real API data', async () => {
    const mockResult = {
      symbol: 'AAPL',
      swingPct: 4.2,
      stddevPct: 1.5,
      dataPoints: 5
    };
    
    (oscillatorService.analyzeOscillation as any).mockResolvedValue(mockResult);

    const { result } = renderHook(() => useOscillationAnalysis('AAPL', 5));

    expect(result.current.loading).toBe(true);

    await act(() => Promise.resolve());

    expect(result.current.result).toBeTruthy();
    expect(result.current.result?.symbol).toBe('AAPL');
    expect(result.current.result?.simulated).toBeFalsy();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('uses fallback simulated data on API failure', async () => {
    const mockResult = {
      symbol: 'MSFT',
      swingPct: 7.1,
      stddevPct: 3.2,
      dataPoints: 5,
      simulated: true
    };
    
    (oscillatorService.analyzeOscillation as any).mockResolvedValue(mockResult);

    const { result } = renderHook(() => useOscillationAnalysis('MSFT', 5));

    await act(() => Promise.resolve());

    expect(result.current.result).toBeTruthy();
    expect(result.current.result?.simulated).toBe(true);
    expect(result.current.error).toContain('Simulated');
    expect(result.current.loading).toBe(false);
  });

  it('does not call API if symbol is empty', async () => {
    const { result } = renderHook(() => useOscillationAnalysis('', 5));

    expect(result.current.result).toBeNull();
    expect(oscillatorService.analyzeOscillation).not.toHaveBeenCalled();
  });

  it('handles errors from the service', async () => {
    const testError = new Error('Test error message');
    (oscillatorService.analyzeOscillation as any).mockRejectedValue(testError);

    const { result } = renderHook(() => useOscillationAnalysis('GOOG', 5));

    await act(() => Promise.resolve());

    expect(result.current.error).toBe('Test error message');
    expect(result.current.loading).toBe(false);
  });
});
