import React from 'react';
import type { Trade } from '../types';
import { TradeEntry } from './TradeEntry';

interface TradesListProps {
  trades: Trade[];
  onSellTrade: (tradeId: string, sellPrice: number) => void;
}

export function TradesList({ trades, onSellTrade }: TradesListProps) {
  if (trades.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No trades yet. Add your first trade above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Your Trades</h3>
      {trades.map((trade) => (
        <TradeEntry
          key={trade.id}
          trade={trade}
          onSell={onSellTrade}
        />
      ))}
    </div>
  );
}
