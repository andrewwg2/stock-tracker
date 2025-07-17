import React from 'react';
import type { Trade } from '../types';
import { formatCurrency, formatDate, formatGain } from '../utils';
import { tradeService } from '../services';

interface TradesSummaryProps {
  trades: Trade[];
}

export function TradesSummary({ trades }: TradesSummaryProps) {
  const totalGain = tradeService.calculateTotalGain(trades);
  const closedTrades = tradeService.getClosedTrades(trades);
  const openTrades = trades.filter(trade => tradeService.isTradeOpen(trade));

  if (trades.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 space-y-4">
      <h3 className="text-lg font-semibold">Portfolio Summary</h3>
      
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="text-gray-500">Total Trades</div>
          <div className="font-medium">{trades.length}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="text-gray-500">Open Positions</div>
          <div className="font-medium">{openTrades.length}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="text-gray-500">Closed Trades</div>
          <div className="font-medium">{closedTrades.length}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="text-gray-500">Total Realized P&L</div>
          <div className={`font-medium ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatGain(totalGain)}
          </div>
        </div>
      </div>

      {/* Detailed List */}
      <div className="space-y-3">
        <h4 className="text-md font-medium">Trade History</h4>
        {trades.map((trade) => (
          <div key={trade.id} className="p-3 border rounded-md bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{trade.symbol}</div>
                <div className="text-sm text-gray-600">
                  Bought {trade.quantity} shares on {formatDate(trade.buyDate)} @ {formatCurrency(trade.buyPrice)}
                </div>
              </div>
              <div className="text-right">
                {trade.sellPrice && trade.sellDate ? (
                  <div>
                    <div className="text-sm text-gray-600">
                      Sold on {formatDate(trade.sellDate)} @ {formatCurrency(trade.sellPrice)}
                    </div>
                    <div className={`font-medium ${tradeService.calculateGain(trade) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatGain(tradeService.calculateGain(trade))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-yellow-600 font-medium">
                    Holding...
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
