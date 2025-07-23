import React, { useCallback, useState } from 'react';
import {
  TradeForm,
  TradesList,
  TradesSummary,
  GainChart,
  ErrorBoundary,
  LoadingSpinner,
  ErrorMessage,
  Container,
  Card
} from './components';
import { useTrades } from './hooks/useTrades';
import { useOscillationAnalysis } from './hooks/useOscillatorAnalysis';
import type { CreateTradeDTO } from './dto';
import './App.css';

const App: React.FC = () => {
  const {
    trades,
    addTrade,
    sellTrade,
    clearAllTrades,
    refreshPrices,
    isLoading,
    error,
    hasOpenPositions,
    totalTrades
  } = useTrades();

  const [symbolToAnalyze, setSymbolToAnalyze] = useState('');
  const [analysisTriggerSymbol, setAnalysisTriggerSymbol] = useState<string | null>(null);
  const { result, loading: analysisLoading, error: analysisError } = useOscillationAnalysis(analysisTriggerSymbol, 30);

  const handleAddTrade = useCallback(async (formData: CreateTradeDTO) => {
    try {
      await addTrade(formData);
    } catch (error) {
      console.error('Failed to add trade:', error);
    }
  }, [addTrade]);

  const handleSellTrade = useCallback(async (tradeId: string, sellPrice: number) => {
    try {
      await sellTrade(tradeId, sellPrice);
    } catch (error) {
      console.error('Failed to sell trade:', error);
    }
  }, [sellTrade]);

  const handleRefreshPrices = useCallback(async () => {
    try {
      await refreshPrices();
    } catch (error) {
      console.error('Failed to refresh prices:', error);
    }
  }, [refreshPrices]);

  const handleClearAllTrades = useCallback(async () => {
    if (window.confirm('Are you sure you want to clear all trades? This action cannot be undone.')) {
      try {
        await clearAllTrades();
      } catch (error) {
        console.error('Failed to clear trades:', error);
      }
    }
  }, [clearAllTrades]);

  const handleAnalyzeSymbol = () => {
    const trimmed = symbolToAnalyze.trim().toUpperCase();
    if (trimmed) {
      setAnalysisTriggerSymbol(trimmed);
    }
  };

  if (isLoading && totalTrades === 0) {
    return (
      <div className="min-h-screen bg-neutral-200 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-neutral-200 flex items-center justify-center px-4 py-8">
        <Container maxWidth="4xl" className="w-full">
          <Card className="p-8 space-y-8">
            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Stock Tracker</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Track your stock trades and portfolio performance
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleRefreshPrices}
                  disabled={isLoading || totalTrades === 0}
                  className="btn btn-secondary btn-sm"
                  title="Refresh current prices"
                >
                  {isLoading ? 'Refreshing...' : 'Refresh Prices'}
                </button>
                {totalTrades > 0 && (
                  <button
                    onClick={handleClearAllTrades}
                    disabled={isLoading}
                    className="btn btn-danger btn-sm"
                    title="Clear all trades"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </header>

            {error && <ErrorMessage message={error} className="animate-fade-in" />}

            <main className="space-y-8">
              {/* Trade Form */}
              <section>
                <TradeForm
                  onSubmit={(formData) => {
                    handleAddTrade(formData);
                    setSymbolToAnalyze(formData.symbol); // Save last added symbol for analysis
                  }}
                  disabled={isLoading}
                />
              </section>

              {/* Oscillation Lookup */}
              <section className="bg-blue-50 rounded-md p-4">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Enter Symbol"
                    value={symbolToAnalyze}
                    onChange={(e) => setSymbolToAnalyze(e.target.value.toUpperCase())}
                    className="border px-3 py-1 rounded text-sm"
                  />
                  <button
                    onClick={handleAnalyzeSymbol}
                    className="btn btn-primary btn-sm"
                    disabled={analysisLoading || !symbolToAnalyze.trim()}
                  >
                    {analysisLoading ? 'Analyzing...' : 'Lookup Oscillation'}
                  </button>
                </div>
                {analysisError && (
                  <div className="text-red-600 mt-2 text-sm">Error: {analysisError}</div>
                )}
         {result && (
          <div className="p-4 bg-gray-100 rounded shadow-sm mt-4">
            <h4>Oscillation Statistics (30d)</h4>
            <div>Swing: {result.swingPct.toFixed(2)}%</div>
            <div>Volatility (σ): {result.stddevPct.toFixed(2)}%</div>
            <div>Data points: {result.dataPoints}</div>
            {result.simulated && (
              <div className="text-yellow-600 text-sm mt-2">
                ⚠️ Using simulated data due to API limits.
              </div>
            )}
            {result.swingPct > 5 && result.stddevPct > 2 && (
              <span className="text-green-600">Looks oscillatory 📈</span>
            )}
          </div>
          )}

              </section>

              {totalTrades === 0 ? (
                <div className="text-center py-12 text-gray-600">Start by adding your first trade.</div>
              ) : (
                <div className="grid gap-8">
                  <section>
                    <TradesList trades={trades} onSellTrade={handleSellTrade} />
                  </section>
                  <section>
                    <TradesSummary trades={trades} />
                  </section>
                  <section>
                    <GainChart trades={trades} />
                  </section>
                </div>
              )}
            </main>

            <footer className="text-center text-sm text-gray-500 pt-8 border-t border-gray-200">
              <p>
                Stock prices are delayed and for demonstration purposes only.
                {hasOpenPositions && (
                  <span className="block mt-1 text-blue-600">
                    You have open positions. Use "Refresh Prices" to get current values.
                  </span>
                )}
              </p>
            </footer>
          </Card>
        </Container>
      </div>
    </ErrorBoundary>
  );
};

export default App;
