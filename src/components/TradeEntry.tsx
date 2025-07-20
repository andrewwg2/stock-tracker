/**
 * TradeEntry Component
 * Individual trade entry with expand/collapse and sell functionality
 */

import React, { useState, useCallback } from 'react';
import { usePrice } from '../hooks/usePrice';
import { formatCurrency, formatDate, formatGain, validateSellPrice } from '../utils';
import { Button, LoadingSpinner } from './';
import type { TradeEntryProps } from '../types';

export const TradeEntry: React.FC<TradeEntryProps> = React.memo(({ trade, onSell }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCheckingPrice, setIsCheckingPrice] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [sellPriceInput, setSellPriceInput] = useState('');
  const [priceError, setPriceError] = useState<string | null>(null);
  const [showSellForm, setShowSellForm] = useState(false);

  const { fetchPrice } = usePrice();

  const isOpen = trade.isOpen;
  const gain = trade.gain || 0;
  const isPositiveGain = gain >= 0;

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleCheckPrice = useCallback(async () => {
    setIsCheckingPrice(true);
    setPriceError(null);

    try {
      const price = await fetchPrice(trade.symbol, true);
      if (price !== null) {
        setCurrentPrice(price);
        setSellPriceInput(price.toString());
        setShowSellForm(true);
      } else {
        setPriceError('Unable to fetch current price');
      }
    } catch (error) {
      setPriceError('Failed to fetch price. Please enter manually.');
      setShowSellForm(true);
    } finally {
      setIsCheckingPrice(false);
    }
  }, [trade.symbol, fetchPrice]);

  const handleSell = useCallback(async () => {
    const sellPrice = parseFloat(sellPriceInput);
    
    if (!sellPrice || sellPrice <= 0) {
      setPriceError('Please enter a valid sell price');
      return;
    }

    // Validate sell price
    const validation = validateSellPrice(sellPrice, trade.buyPrice);
    if (!validation.isValid) {
      setPriceError(validation.warnings[0] || 'Invalid sell price');
      return;
    }

    // Show warning for significant loss
    if (validation.warnings.length > 0) {
      const confirmed = window.confirm(
        `${validation.warnings[0]}\n\nAre you sure you want to proceed?`
      );
      if (!confirmed) return;
    }

    try {
      await onSell(trade.id, sellPrice);
      setShowSellForm(false);
      setCurrentPrice(null);
      setSellPriceInput('');
    } catch (error) {
      setPriceError('Failed to sell trade. Please try again.');
    }
  }, [sellPriceInput, trade.id, trade.buyPrice, onSell]);

  const handleCancelSell = useCallback(() => {
    setShowSellForm(false);
    setCurrentPrice(null);
    setSellPriceInput('');
    setPriceError(null);
  }, []);

  // Trade card styling based on status and performance
  const getCardClasses = () => {
    const baseClasses = 'border border-gray-200 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md';
    
    if (isOpen) {
      return `${baseClasses} bg-white border-l-4 border-l-blue-500`;
    }
    
    if (isPositiveGain) {
      return `${baseClasses} bg-green-50 border-l-4 border-l-green-500`;
    }
    
    return `${baseClasses} bg-red-50 border-l-4 border-l-red-500`;
  };

  return (
    <div className={`trade-card ${getCardClasses()}`}>
      {/* Main Trade Info - Always Visible */}
      <div
        className="p-4 cursor-pointer flex justify-between items-center"
        onClick={handleToggleExpand}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggleExpand();
          }
        }}
        aria-expanded={isExpanded}
        aria-controls={`trade-details-${trade.id}`}
      >
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-lg text-gray-900">{trade.symbol}</h4>
              <span className="text-sm text-gray-500">
                {trade.quantity} share{trade.quantity !== 1 ? 's' : ''}
              </span>
              {isOpen && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                  Open
                </span>
              )}
            </div>
            
            <div className="text-sm text-gray-600">
              Bought on {formatDate(trade.buyDate)} @ {formatCurrency(trade.buyPrice)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Gain/Loss Display */}
          {!isOpen && (
            <div className={`text-right ${isPositiveGain ? 'text-green-600' : 'text-red-600'}`}>
              <div className="font-semibold">
                {formatGain(gain)}
              </div>
              {trade.gainPercentage && (
                <div className="text-sm">
                  ({trade.gainPercentage > 0 ? '+' : ''}{trade.gainPercentage.toFixed(2)}%)
                </div>
              )}
            </div>
          )}

          {/* Expand/Collapse Icon */}
          <div className="text-gray-400">
            <svg 
              className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div 
          id={`trade-details-${trade.id}`}
          className="px-4 pb-4 space-y-4 border-t border-gray-100 animate-fade-in"
        >
          {/* Trade Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
            <div>
              <div className="text-sm text-gray-500">Buy Price</div>
              <div className="font-medium">{formatCurrency(trade.buyPrice)}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500">Current Value</div>
              <div className="font-medium">
                {trade.currentValue ? formatCurrency(trade.currentValue) : 'N/A'}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500">Total Cost</div>
              <div className="font-medium">
                {formatCurrency(trade.buyPrice * trade.quantity)}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500">Gain/Loss</div>
              <div className={`font-medium ${isPositiveGain ? 'text-green-600' : 'text-red-600'}`}>
                {formatGain(gain)}
                {trade.gainPercentage && (
                  <div className="text-sm">
                    ({trade.gainPercentage > 0 ? '+' : ''}{trade.gainPercentage.toFixed(2)}%)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sell Price Info (for closed trades) */}
          {!isOpen && trade.sellPrice && trade.sellDate && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600 mb-1">Sale Information</div>
              <div className="flex justify-between items-center">
                <span>
                  Sold on {formatDate(trade.sellDate)} @ {formatCurrency(trade.sellPrice)}
                </span>
                <span className="text-sm text-gray-500">
                  Total: {formatCurrency(trade.sellPrice * trade.quantity)}
                </span>
              </div>
            </div>
          )}

          {/* Sell Actions (for open trades) */}
          {isOpen && (
            <div className="border-t border-gray-200 pt-4">
              {!showSellForm ? (
                <div className="flex gap-2">
                  <Button
                    onClick={handleCheckPrice}
                    disabled={isCheckingPrice}
                    variant="primary"
                    size="sm"
                    loading={isCheckingPrice}
                  >
                    {isCheckingPrice ? 'Checking Price...' : 'Sell at Current Price'}
                  </Button>
                  
                  <Button
                    onClick={() => setShowSellForm(true)}
                    variant="secondary"
                    size="sm"
                  >
                    Enter Sell Price
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sell Price
                      {currentPrice && (
                        <span className="ml-2 text-sm text-gray-500">
                          (Current: {formatCurrency(currentPrice)})
                        </span>
                      )}
                    </label>
                    
                    <div className="flex gap-2 items-start">
                      <div className="flex-1">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={sellPriceInput}
                          onChange={(e) => {
                            setSellPriceInput(e.target.value);
                            setPriceError(null);
                          }}
                          className="form-input w-full"
                          placeholder={currentPrice?.toString() || '0.00'}
                          autoFocus
                        />
                        {priceError && (
                          <div className="text-sm text-red-600 mt-1">{priceError}</div>
                        )}
                      </div>
                      
                      <Button
                        onClick={handleSell}
                        variant="success"
                        size="sm"
                        disabled={!sellPriceInput || parseFloat(sellPriceInput) <= 0}
                      >
                        Confirm Sale
                      </Button>
                      
                      <Button
                        onClick={handleCancelSell}
                        variant="secondary"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>

                  {/* Potential Gain/Loss Preview */}
                  {sellPriceInput && parseFloat(sellPriceInput) > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      <div className="flex justify-between">
                        <span>Potential proceeds:</span>
                        <span>{formatCurrency(parseFloat(sellPriceInput) * trade.quantity)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Original cost:</span>
                        <span>{formatCurrency(trade.buyPrice * trade.quantity)}</span>
                      </div>
                      <div className={`flex justify-between font-medium border-t border-gray-200 pt-2 mt-2 ${
                        parseFloat(sellPriceInput) >= trade.buyPrice ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <span>Net gain/loss:</span>
                        <span>
                          {formatGain((parseFloat(sellPriceInput) - trade.buyPrice) * trade.quantity)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

TradeEntry.displayName = 'TradeEntry';
