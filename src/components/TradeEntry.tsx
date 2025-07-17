import React, { useState } from 'react';
import type { Trade } from '../types';
import { useStockPrice } from '../hooks';
import { formatCurrency, formatDate, formatGain } from '../utils';
import { tradeService } from '../services';

interface TradeEntryProps {
  trade: Trade;
  onSell: (tradeId: string, sellPrice: number) => void;
}

export function TradeEntry({ trade, onSell }: TradeEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const { fetchPrice, isLoading: isFetchingPrice, error: priceError } = useStockPrice();

  const handleFetchPrice = async () => {
    const price = await fetchPrice(trade.symbol);
    if (price !== null) {
      setCurrentPrice(price);
    }
  };

  const handleSell = () => {
    if (currentPrice) {
      onSell(trade.id, currentPrice);
      setCurrentPrice(null);
    }
  };

  const isOpen = tradeService.isTradeOpen(trade);
  const gain = tradeService.calculateGain(trade);
  const isPositiveGain = gain >= 0;

  return (
    <div className="border p-4 rounded-md shadow my-2">
      <div
        className="cursor-pointer flex justify-between items-center"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">{trade.symbol}</span>
          <span className="text-sm text-gray-500">({trade.quantity} shares)</span>
        </div>
        <div className="flex items-center gap-2">
          {!isOpen && (
            <span className={`text-sm font-medium ${isPositiveGain ? 'text-green-600' : 'text-red-600'}`}>
              {formatGain(gain)}
            </span>
          )}
          <span className="text-sm text-gray-400">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Buy Price:</span>
              <span className="ml-2 font-medium">{formatCurrency(trade.buyPrice)}</span>
            </div>
            <div>
              <span className="text-gray-500">Buy Date:</span>
              <span className="ml-2">{formatDate(trade.buyDate)}</span>
            </div>
            
            {trade.sellPrice && trade.sellDate && (
              <>
                <div>
                  <span className="text-gray-500">Sell Price:</span>
                  <span className="ml-2 font-medium">{formatCurrency(trade.sellPrice)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Sell Date:</span>
                  <span className="ml-2">{formatDate(trade.sellDate)}</span>
                </div>
              </>
            )}
          </div>

          {isOpen && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={handleFetchPrice}
                  disabled={isFetchingPrice}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-1 rounded text-sm transition"
                >
                  {isFetchingPrice ? 'Loading...' : 'Check Current Price'}
                </button>
              </div>
              
              {priceError && (
                <p className="text-sm text-red-600">{priceError}</p>
              )}
              
              {currentPrice && (
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    Current Price: <span className="font-medium">{formatCurrency(currentPrice)}</span>
                  </span>
                  <button
                    onClick={handleSell}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition"
                  >
                    Sell at Current Price
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
