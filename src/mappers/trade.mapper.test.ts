import { describe, it, expect } from 'vitest';
import { TradeMapper } from './trade.mapper';
import type { Trade } from '../types';
import type { CreateTradeDTO, UpdateTradeDTO } from '../dto';

describe('TradeMapper', () => {
  const sampleTrade: Trade = {
    id: '1',
    symbol: 'AAPL',
    quantity: 10,
    buyPrice: 150,
    buyDate: '2025-07-17',
    sellPrice: 170,
    sellDate: '2025-07-18',
  };

  it('should map Trade to TradeDTO with current price', () => {
    const dto = TradeMapper.toDTO(sampleTrade, 180);
    expect(dto.symbol).toBe('AAPL');
    expect(dto.currentValue).toBe(1800); // 10 * 180
    expect(dto.gain).toBeGreaterThanOrEqual(0); // assumes gain calculation exists
    expect(dto.isOpen).toBe(false);
  });

  it('should map Trade[] to TradeListResponseDTO', () => {
    const priceMap = new Map([['AAPL', 180]]);
    const listDTO = TradeMapper.toListResponseDTO([sampleTrade], priceMap);
    expect(listDTO.trades.length).toBe(1);
    expect(listDTO.totalCount).toBe(1);
    expect(listDTO.totalValue).toBe(1800);
  });

  it('should convert CreateTradeDTO to TradeFormData', () => {
    const createDTO: CreateTradeDTO = {
      symbol: 'TSLA',
      quantity: 5,
      buyPrice: 200
    };
    const form = TradeMapper.fromCreateDTO(createDTO);
    expect(form.symbol).toBe('TSLA');
    expect(form.quantity).toBe(5);
  });

  it('should apply updates to a Trade', () => {
    const updates: UpdateTradeDTO = {
        sellPrice: 185,
        sellDate: '2025-07-20',
        quantity: 12,
        id: ''
    };

    const updated = TradeMapper.applyUpdates(sampleTrade, updates);
    expect(updated.sellPrice).toBe(185);
    expect(updated.sellDate).toBe('2025-07-20');
    expect(updated.quantity).toBe(12);
  });
});
