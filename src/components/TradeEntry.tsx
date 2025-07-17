import { useState } from "react";
import { fetchStockPrice } from "../utils/stockApi";

type Trade = {
  symbol: string;
  quantity: number;
  buyPrice: number;
  sellPrice?: number;
};

export default function TradeEntry({ trade, onSell }: {
  trade: Trade;
  onSell: (sellPrice: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  const handleFetchPrice = async () => {
    const price = await fetchStockPrice(trade.symbol);
    setCurrentPrice(price);
  };

  return (
    <div className="border p-4 rounded-md shadow my-2">
      <div
        className="cursor-pointer flex justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div>{trade.symbol.toUpperCase()}</div>
        <div>Qty: {trade.quantity}</div>
      </div>
      {expanded && (
        <div className="mt-4 space-y-2">
          <div>Buy Price: ${trade.buyPrice.toFixed(2)}</div>
          <button
            onClick={handleFetchPrice}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Check Price
          </button>
          {currentPrice && (
            <div>
              Current Price: ${currentPrice.toFixed(2)}{" "}
              <button
                onClick={() => onSell(currentPrice)}
                className="ml-4 bg-green-600 text-white px-3 py-1 rounded"
              >
                Simulate Sell
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
