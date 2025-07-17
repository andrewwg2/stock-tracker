import React, { useState } from 'react';
import type { TradeFormData } from '../types';
import { useStockPrice } from '../hooks';


interface TradeFormProps {
  onSubmit: (formData: TradeFormData) => void;
  disabled?: boolean;
}

export function TradeForm({ onSubmit, disabled = false }: TradeFormProps) {
  const [formData, setFormData] = useState<TradeFormData>({
    symbol: '',
    quantity: 1,
    buyPrice: 0
  });

  const { fetchPrice, isLoading: isFetchingPrice, error: priceError } = useStockPrice();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.symbol.trim() || formData.quantity <= 0 || formData.buyPrice <= 0) {
      return;
    }

    onSubmit(formData);
    setFormData({
      symbol: '',
      quantity: 1,
      buyPrice: 0
    });
  };

  const handleLookupPrice = async () => {
    if (!formData.symbol.trim()) {
      return;
    }

    const price = await fetchPrice(formData.symbol);
    if (price !== null) {
      setFormData(prev => ({ ...prev, buyPrice: price }));
    }
  };

  const isFormValid = formData.symbol.trim() && formData.quantity > 0 && formData.buyPrice > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold">New Trade</h2>
      
      <div className="flex flex-wrap gap-4 items-end">
        {/* Symbol Input */}
        <div className="flex flex-col">
          <label className="text-sm text-gray-500 mb-1">Symbol</label>
          <input
            type="text"
            value={formData.symbol}
            onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
            placeholder="AAPL"
            className="border border-neutral-300 p-2 rounded-md w-28 uppercase"
            disabled={disabled}
            required
          />
        </div>

        {/* Quantity Input */}
        <div className="flex flex-col">
          <label className="text-sm text-gray-500 mb-1">Quantity</label>
          <input
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
            className="border border-neutral-300 p-2 rounded-md w-20"
            disabled={disabled}
            required
          />
        </div>

        {/* Buy Price Input */}
        <div className="flex flex-col">
          <label className="text-sm text-gray-500 mb-1">Buy Price</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.buyPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, buyPrice: parseFloat(e.target.value) || 0 }))}
              className="border border-neutral-300 p-2 rounded-md w-32"
              disabled={disabled}
              required
            />
            <button
              type="button"
              onClick={handleLookupPrice}
              disabled={disabled || isFetchingPrice || !formData.symbol.trim()}
              className="text-xs bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed px-2 py-1 rounded-md transition"
            >
              {isFetchingPrice ? 'Loading...' : 'Lookup'}
            </button>
          </div>
          {priceError && (
            <p className="text-xs text-red-600 mt-1">{priceError}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={disabled || !isFormValid}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md shadow-sm transition"
        >
          Add Trade
        </button>
      </div>
    </form>
  );
}
