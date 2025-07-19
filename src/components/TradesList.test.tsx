// src/components/TradesList.test.tsx
import { render, screen } from '@testing-library/react';
import { TradesList } from './TradesList';
import type { Trade } from '../types';
import { describe, expect, it } from 'vitest';

describe('TradesList', () => {
  const mockTrades: Trade[] = [
    {
      id: '123',
      symbol: 'TSLA',
      quantity: 3,
      buyPrice: 300,
      buyDate: '2023-01-01',
      sellPrice: 350,
      sellDate: '2023-01-02',
    },
  ];

  it('renders empty message if no trades', () => {
    render(<TradesList trades={[]} onSellTrade={() => {}} />);
    expect(screen.getByText(/No trades yet/i)).toBeInTheDocument();
  });

  it('renders trades list', () => {
    render(<TradesList trades={mockTrades} onSellTrade={() => {}} />);
    expect(screen.getByText(/TSLA/i)).toBeInTheDocument();
    expect(screen.getByText(/\(\s*3\s*shares\)/i)).toBeInTheDocument();
  });

});
