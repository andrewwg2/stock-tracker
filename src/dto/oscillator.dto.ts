/**
 * Oscillator Analysis Data Transfer Objects
 */

export interface OscillatorAnalysisDTO {
  symbol: string;
  swingPct: number;
  stddevPct: number;
  dataPoints: number;
  simulated?: boolean;
}

export interface OscillatorAnalysisRequestDTO {
  symbol: string;
  days?: number;
}
