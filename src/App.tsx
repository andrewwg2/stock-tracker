import React from 'react';
import { 
  TradeForm, 
  TradesList, 
  TradesSummary, 
  GainChart, 
  ErrorBoundary, 
  LoadingSpinner 
} from './components';
import { useTrades } from './hooks';

function App() {
  const { 
    tradeDTOs: trades, 
    addTrade, 
    sellTrade, 
    clearAllTrades, 
    isLoading, 
    error 
  } = useTrades();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-200 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-neutral-200 flex items-center justify-center px-4">
        <div className="bg-slate-100 rounded-2xl shadow-lg p-8 w-full max-w-4xl border border-neutral-300">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-center">Stock Tracker</h1>
            {trades.length > 0 && (
              <button
                onClick={clearAllTrades}
                className="text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded transition"
              >
                Clear All
              </button>
            )}
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-8">
            <TradeForm onSubmit={addTrade} />
            <TradesList trades={trades} onSellTrade={sellTrade} />
            <TradesSummary trades={trades} />
            <GainChart trades={trades} />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
