/**
 * Main Application Component
 * Root component that orchestrates the entire stock tracker application
 */

import React, { useCallback } from 'react';
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

  const handleAddTrade = useCallback(async (formData: CreateTradeDTO) => {
    try {
      await addTrade(formData);
    } catch (error) {
      console.error('Failed to add trade:', error);
      // Error is handled by the hook and displayed in the UI
    }
  }, [addTrade]);

  const handleSellTrade = useCallback(async (tradeId: string, sellPrice: number) => {
    try {
      await sellTrade(tradeId, sellPrice);
    } catch (error) {
      console.error('Failed to sell trade:', error);
      // Error is handled by the hook and displayed in the UI
    }
  }, [sellTrade]);

  const handleRefreshPrices = useCallback(async () => {
    try {
      await refreshPrices();
    } catch (error) {
      console.error('Failed to refresh prices:', error);
      // Error is handled by the hook and displayed in the UI
    }
  }, [refreshPrices]);

  const handleClearAllTrades = useCallback(async () => {
    if (window.confirm('Are you sure you want to clear all trades? This action cannot be undone.')) {
      try {
        await clearAllTrades();
      } catch (error) {
        console.error('Failed to clear trades:', error);
        // Error is handled by the hook and displayed in the UI
      }
    }
  }, [clearAllTrades]);

  // Show loading spinner during initial load
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
            
            {/* Error Display */}
            {error && (
              <ErrorMessage 
                message={error}
                className="animate-fade-in"
              />
            )}
            
            {/* Main Content */}
            <main className="space-y-8">
              {/* Trade Form */}
              <section>
                <TradeForm 
                  onSubmit={handleAddTrade} 
                  disabled={isLoading}
                />
              </section>
              
              {/* Content based on data availability */}
              {totalTrades === 0 ? (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No trades yet
                    </h3>
                    <p className="text-gray-600">
                      Start by adding your first trade above. Track your purchases and sales to monitor your portfolio performance.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-8">
                  {/* Trades List */}
                  <section>
                    <TradesList 
                      trades={trades} 
                      onSellTrade={handleSellTrade}
                    />
                  </section>
                  
                  {/* Portfolio Summary */}
                  <section>
                    <TradesSummary trades={trades} />
                  </section>
                  
                  {/* Gain Chart */}
                  <section>
                    <GainChart trades={trades} />
                  </section>
                </div>
              )}
            </main>
            
            {/* Footer */}
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
