/**
 * TradesList Component
 * Displays a list of trades with sorting and filtering options
 */

import React, { useState, useMemo } from 'react';
import { TradeEntry } from './TradeEntry';
import { Card } from './Card';
import type { TradeListProps, TradeDTO } from '../types';

export const TradesList: React.FC<TradeListProps> = React.memo(({ trades, onSellTrade }) => {
  const [sortBy, setSortBy] = useState<'date' | 'symbol' | 'gain' | 'quantity'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('all');

  // Filter and sort trades
  const processedTrades = useMemo(() => {
    let filtered = [...trades];

    // Apply status filter
    if (filterStatus === 'open') {
      filtered = filtered.filter(trade => trade.isOpen);
    } else if (filterStatus === 'closed') {
      filtered = filtered.filter(trade => !trade.isOpen);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.buyDate).getTime();
          bValue = new Date(b.buyDate).getTime();
          break;
        case 'symbol':
          aValue = a.symbol;
          bValue = b.symbol;
          break;
        case 'gain':
          aValue = a.gain || 0;
          bValue = b.gain || 0;
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        default:
          return 0;
      }

      const modifier = sortOrder === 'asc' ? 1 : -1;
      
      if (aValue < bValue) return -1 * modifier;
      if (aValue > bValue) return 1 * modifier;
      return 0;
    });

    return filtered;
  }, [trades, sortBy, sortOrder, filterStatus]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: typeof sortBy) => {
    if (sortBy !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    );
  };

  if (trades.length === 0) {
    return (
      <Card className="text-center py-8">
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No trades yet</h3>
          <p className="text-gray-600">Add your first trade above to start tracking your portfolio!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Your Trades</h3>
            <p className="text-sm text-gray-600">
              {processedTrades.length} of {trades.length} trades shown
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Status Filter */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { key: 'all', label: 'All' },
                { key: 'open', label: 'Open' },
                { key: 'closed', label: 'Closed' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilterStatus(key as typeof filterStatus)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    filterStatus === key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Sort Controls */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {[
                { key: 'date', label: 'Date' },
                { key: 'symbol', label: 'Symbol' },
                { key: 'gain', label: 'Gain' },
                { key: 'quantity', label: 'Qty' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleSort(key as typeof sortBy)}
                  className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                    sortBy === key
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {label}
                  {getSortIcon(key as typeof sortBy)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Trades List */}
        {processedTrades.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No trades match the current filter.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {processedTrades.map((trade) => (
              <TradeEntry
                key={trade.id}
                trade={trade}
                onSell={onSellTrade}
              />
            ))}
          </div>
        )}

        {/* Summary Footer */}
        {processedTrades.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                Showing {processedTrades.length} trade{processedTrades.length !== 1 ? 's' : ''}
              </span>
              <span>
                Sorted by {sortBy} ({sortOrder === 'asc' ? 'ascending' : 'descending'})
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
});

TradesList.displayName = 'TradesList';
