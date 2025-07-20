/**
 * TradesSummary Component
 * Portfolio summary with key metrics and statistics
 */

import React from 'react';
import { Card } from './Card';
import { formatCurrency, formatGain, calculatePortfolioValue, calculateTotalGain } from '../utils';
import type { TradesSummaryProps } from '../types';

export const TradesSummary: React.FC<TradesSummaryProps> = React.memo(({ trades }) => {
  if (trades.length === 0) {
    return null;
  }

  // Calculate portfolio metrics
  const openTrades = trades.filter(trade => trade.isOpen);
  const closedTrades = trades.filter(trade => !trade.isOpen);
  
  const totalInvestment = trades.reduce((sum, trade) => 
    sum + (trade.buyPrice * trade.quantity), 0);
  
  const currentValue = trades.reduce((sum, trade) => {
    if (trade.sellPrice) {
      return sum + (trade.sellPrice * trade.quantity);
    }
    return sum + (trade.currentValue || trade.buyPrice * trade.quantity);
  }, 0);
  
  const realizedGain = closedTrades.reduce((sum, trade) => 
    sum + (trade.gain || 0), 0);
  
  const unrealizedGain = openTrades.reduce((sum, trade) => 
    sum + (trade.gain || 0), 0);
  
  const totalGain = realizedGain + unrealizedGain;
  const totalGainPercentage = totalInvestment > 0 
    ? (totalGain / totalInvestment) * 100 
    : 0;

  // Performance stats
  const winningTrades = closedTrades.filter(trade => (trade.gain || 0) > 0);
  const losingTrades = closedTrades.filter(trade => (trade.gain || 0) < 0);
  const winRate = closedTrades.length > 0 
    ? (winningTrades.length / closedTrades.length) * 100 
    : 0;

  const averageGain = closedTrades.length > 0 
    ? realizedGain / closedTrades.length 
    : 0;

  // Find best and worst performing trades
  const bestTrade = trades.reduce((best, trade) => {
    const tradeGain = trade.gain || 0;
    const bestGain = best?.gain || Number.NEGATIVE_INFINITY;
    return tradeGain > bestGain ? trade : best;
  }, null as typeof trades[0] | null);

  const worstTrade = trades.reduce((worst, trade) => {
    const tradeGain = trade.gain || 0;
    const worstGain = worst?.gain || Number.POSITIVE_INFINITY;
    return tradeGain < worstGain ? trade : worst;
  }, null as typeof trades[0] | null);

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    variant = 'neutral' 
  }: {
    title: string;
    value: string;
    subtitle?: string;
    variant?: 'positive' | 'negative' | 'neutral';
  }) => (
    <div className={`stat-card ${variant !== 'neutral' ? `stat-${variant}` : ''}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );

  return (
    <Card>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Portfolio Summary</h3>
          <div className="text-sm text-gray-500">
            {trades.length} total position{trades.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="stats-grid">
          <StatCard
            title="Total Investment"
            value={formatCurrency(totalInvestment)}
            subtitle="Amount invested"
          />
          
          <StatCard
            title="Current Value"
            value={formatCurrency(currentValue)}
            subtitle="Current portfolio worth"
          />
          
          <StatCard
            title="Total Gain/Loss"
            value={formatGain(totalGain)}
            subtitle={`${totalGainPercentage >= 0 ? '+' : ''}${totalGainPercentage.toFixed(2)}%`}
            variant={totalGain >= 0 ? 'positive' : 'negative'}
          />
          
          <StatCard
            title="Win Rate"
            value={`${winRate.toFixed(1)}%`}
            subtitle={`${winningTrades.length}/${closedTrades.length} profitable`}
            variant={winRate >= 50 ? 'positive' : winRate > 0 ? 'neutral' : 'negative'}
          />
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Position Status */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Position Status</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <div className="font-medium text-blue-900">Open Positions</div>
                  <div className="text-sm text-blue-700">{openTrades.length} positions</div>
                </div>
                <div className="text-right">
                  <div className="text-blue-900 font-semibold">
                    {unrealizedGain >= 0 ? '+' : ''}{formatCurrency(unrealizedGain)}
                  </div>
                  <div className="text-sm text-blue-700">Unrealized</div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Closed Positions</div>
                  <div className="text-sm text-gray-700">{closedTrades.length} trades</div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${realizedGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatGain(realizedGain)}
                  </div>
                  <div className="text-sm text-gray-700">Realized</div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Highlights */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Performance Highlights</h4>
            
            <div className="space-y-3">
              {bestTrade && (bestTrade.gain || 0) > 0 && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-green-900">Best Trade</div>
                      <div className="text-sm text-green-700">{bestTrade.symbol}</div>
                    </div>
                    <div className="text-green-900 font-semibold">
                      {formatGain(bestTrade.gain || 0)}
                    </div>
                  </div>
                </div>
              )}

              {worstTrade && (worstTrade.gain || 0) < 0 && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-red-900">Worst Trade</div>
                      <div className="text-sm text-red-700">{worstTrade.symbol}</div>
                    </div>
                    <div className="text-red-900 font-semibold">
                      {formatGain(worstTrade.gain || 0)}
                    </div>
                  </div>
                </div>
              )}

              {closedTrades.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900">Avg. Trade Return</div>
                      <div className="text-sm text-gray-700">Per closed position</div>
                    </div>
                    <div className={`font-semibold ${averageGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatGain(averageGain)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Summary */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="text-sm text-gray-600">
              Portfolio includes {trades.length} position{trades.length !== 1 ? 's' : ''} across{' '}
              {new Set(trades.map(t => t.symbol)).size} symbol{new Set(trades.map(t => t.symbol)).size !== 1 ? 's' : ''}
            </div>
            
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
});

TradesSummary.displayName = 'TradesSummary';
