// src/hooks/useOscillatorAnalysis.ts
import { useState, useEffect } from 'react';
import { oscillatorService } from '../services';
import type { OscillatorAnalysisDTO } from '../dto';

interface OscillatorAnalysisResult {
  result: OscillatorAnalysisDTO | null;
  loading: boolean;
  error: string | null;
}

export function useOscillationAnalysis(symbol: string, days = 30): OscillatorAnalysisResult {
  const [result, setResult] = useState<OscillatorAnalysisDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    oscillatorService
      .analyzeOscillation({ symbol, days })
      .then((data) => {
        if (!isMounted) return;
        setResult(data);
        
        // Set error message if simulated data was used
        if (data.simulated) {
          setError('Simulated data used due to API limits');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'An error occurred during analysis');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [symbol, days]);

  return { result, loading, error };
}
