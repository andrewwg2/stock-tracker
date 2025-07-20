/**
 * TradeForm Component
 * Form for creating new trades with validation and price lookup
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useStockPrice } from '../hooks';
import { validateTradeForm, sanitizeSymbol, isValidPrice, isValidQuantity } from '../utils';
import type { TradeFormProps, CreateTradeDTO } from '../types';
import { Button, Input, Card } from './';

export const TradeForm: React.FC<TradeFormProps> = React.memo(({ onSubmit, disabled = false }) => {
  const [formData, setFormData] = useState<CreateTradeDTO>({
    symbol: '',
    quantity: 1,
    buyPrice: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { fetchPrice, isLoading: isFetchingPrice, error: priceError } = useStockPrice();

  // Validate form and return validation state
  const validation = useMemo(() => {
    const result = validateTradeForm(formData);
    return {
      isValid: result.isValid,
      errors: result.errors.reduce((acc, error, index) => {
        // Map generic errors to specific fields
        if (error.includes('symbol') || error.includes('Symbol')) {
          acc.symbol = error;
        } else if (error.includes('quantity') || error.includes('Quantity')) {
          acc.quantity = error;
        } else if (error.includes('price') || error.includes('Price')) {
          acc.buyPrice = error;
        } else {
          acc[`general_${index}`] = error;
        }
        return acc;
      }, {} as Record<string, string>)
    };
  }, [formData]);

  const handleSymbolChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeSymbol(e.target.value);
    setFormData(prev => ({ ...prev, symbol: value }));
    
    // Clear symbol error when user starts typing
    if (errors.symbol) {
      setErrors(prev => ({ ...prev, symbol: '' }));
    }
  }, [errors.symbol]);

  const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setFormData(prev => ({ ...prev, quantity: Math.max(1, value) }));
    
    // Clear quantity error when user changes value
    if (errors.quantity) {
      setErrors(prev => ({ ...prev, quantity: '' }));
    }
  }, [errors.quantity]);

  const handleBuyPriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData(prev => ({ ...prev, buyPrice: Math.max(0, value) }));
    
    // Clear buy price error when user changes value
    if (errors.buyPrice) {
      setErrors(prev => ({ ...prev, buyPrice: '' }));
    }
  }, [errors.buyPrice]);

  const handleLookupPrice = useCallback(async () => {
    if (!formData.symbol.trim()) {
      setErrors(prev => ({ ...prev, symbol: 'Please enter a symbol first' }));
      return;
    }

    try {
      const price = await fetchPrice(formData.symbol, true);
      if (price !== null && isValidPrice(price)) {
        setFormData(prev => ({ ...prev, buyPrice: price }));
        setErrors(prev => ({ ...prev, buyPrice: '' }));
      } else {
        setErrors(prev => ({ ...prev, buyPrice: 'Unable to fetch price for this symbol' }));
      }
    } catch (error) {
      setErrors(prev => ({ 
        ...prev, 
        buyPrice: 'Failed to fetch price. Please enter manually.' 
      }));
    }
  }, [formData.symbol, fetchPrice]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await onSubmit(formData);
      
      // Reset form on successful submission
      setFormData({
        symbol: '',
        quantity: 1,
        buyPrice: 0
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add trade';
      setErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validation, onSubmit]);

  const isFormDisabled = disabled || isSubmitting || isFetchingPrice;

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add New Trade</h2>
          <div className="text-sm text-gray-500">
            All fields are required
          </div>
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {errors.general}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Symbol Input */}
          <div>
            <Input
              label="Stock Symbol"
              type="text"
              value={formData.symbol}
              onChange={handleSymbolChange}
              placeholder="e.g., AAPL"
              error={errors.symbol}
              disabled={isFormDisabled}
              className="uppercase"
              maxLength={5}
              helperText="1-5 letters only"
              required
            />
          </div>

          {/* Quantity Input */}
          <div>
            <Input
              label="Quantity"
              type="number"
              min={1}
              step={1}
              value={formData.quantity.toString()}
              onChange={handleQuantityChange}
              error={errors.quantity}
              disabled={isFormDisabled}
              helperText="Number of shares"
              required
            />
          </div>

          {/* Buy Price Input */}
          <div>
            <Input
              label="Buy Price"
              type="number"
              min={0}
              step={0.01}
              value={formData.buyPrice === 0 ? '' : formData.buyPrice.toString()}
              onChange={handleBuyPriceChange}
              placeholder="0.00"
              error={errors.buyPrice || (priceError ? priceError : undefined)}
              disabled={isFormDisabled}
              helperText="Price per share in USD"
              rightIcon={
                <button
                  type="button"
                  onClick={handleLookupPrice}
                  disabled={isFormDisabled || !formData.symbol.trim()}
                  className="text-xs z-100 bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-blue-700 disabled:text-gray-400 px-2 py-1 rounded transition-colors"
                  title="Fetch current market price"
                >
                  {isFetchingPrice ? 'Loading...' : 'Lookup'}
                </button>
              }
              required
              
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={!validation.isValid || isFormDisabled}
            className="min-w-[120px]"
          >
            {isSubmitting ? 'Adding...' : 'Add Trade'}
          </Button>
        </div>

        {/* Form Help */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
          <strong>Tip:</strong> Use the "Lookup" button to fetch current market prices automatically, 
          or enter the price manually if you know the exact purchase price.
        </div>
      </form>
    </Card>
  );
});

TradeForm.displayName = 'TradeForm';
