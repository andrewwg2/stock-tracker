import { useState, useEffect } from "react";
import TradeEntry from "./TradeEntry";
import GainChart from "./GainChart";

type Trade = {
  symbol: string;
  quantity: number;
  buyPrice: number;
  buyDate: string;
  sellPrice?: number;
  sellDate?: string;
};

const LOCAL_STORAGE_KEY = "simulated-stock-trades";

export default function TradeList() {
  const [trades, setTrades] = useState<Trade[]>(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [buyPrice, setBuyPrice] = useState(0);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trades));
  }, [trades]);

  const handleAddTrade = () => {
    const newTrade: Trade = {
      symbol,
      quantity,
      buyPrice,
      buyDate: new Date().toLocaleDateString(),
    };

    setTrades([...trades, newTrade]);
    setSymbol("");
    setQuantity(1);
    setBuyPrice(0);
  };

  const updateSell = (index: number, sellPrice: number) => {
    const updated = [...trades];
    updated[index].sellPrice = sellPrice;
    updated[index].sellDate = new Date().toLocaleDateString();
    setTrades(updated);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">New Trade</h2>

      <div className="flex flex-wrap gap-4 items-end mb-6">
        {/* Symbol */}
        <div className="flex flex-col">
          <label className="text-sm text-gray-500 mb-1">Symbol</label>
          <input
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            placeholder="Symbol"
            className="border border-neutral-300 p-2 rounded-md w-28"
          />
        </div>

        {/* Quantity */}
        <div className="flex flex-col">
          <label className="text-sm text-gray-500 mb-1">Quantity</label>
          <input
            type="number"
            value={quantity}
            onChange={e => setQuantity(Number(e.target.value))}
            className="border border-neutral-300 p-2 rounded-md w-16"
          />
        </div>

        {/* Buy Price + Lookup */}
        <div className="flex flex-col">
          <label className="text-sm text-gray-500 mb-1">Buy Price</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={buyPrice}
              onChange={e => setBuyPrice(Number(e.target.value))}
              className="border border-neutral-300 p-2 rounded-md w-32"
            />
            <button
              className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded-md transition"
              onClick={async () => {
                const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
                const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;

                try {
                  const res = await fetch(url);
                  const data = await res.json();
                  const fetchedPrice = parseFloat(data["Global Quote"]?.["05. price"] ?? "0");

                  if (!isNaN(fetchedPrice)) {
                    setBuyPrice(fetchedPrice);
                  } else {
                    alert("Failed to fetch price.");
                  }
                } catch (error) {
                  alert("Price lookup failed.");
                }
              }}
            >
              Lookup
            </button>
          </div>
        </div>

        {/* Add Trade Button */}
        <div className="flex flex-col">
          <button
            onClick={handleAddTrade}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm transition"
          >
            Add Trade
          </button>
        </div>
      </div>

      {/* Trade Entries */}
      {trades.map((t, i) => (
        <TradeEntry key={i} trade={t} onSell={price => updateSell(i, price)} />
      ))}

      {/* Summary */}
      <h3 className="mt-6 text-lg font-semibold">Summary</h3>
      <div className="space-y-3 mt-2">
        {trades.map((t, i) => (
          <div key={i} className="p-3 border rounded-md bg-gray-50">
            <div className="font-medium">{t.symbol.toUpperCase()}</div>
            <div className="text-sm text-gray-600">
              Bought on {t.buyDate} @ ${t.buyPrice.toFixed(2)} — Qty: {t.quantity}
            </div>

            {t.sellPrice && t.sellDate ? (
              <div className="text-sm">
                Sold on {t.sellDate} @ ${t.sellPrice.toFixed(2)} — Gain:{" "}
                <span className={
                  (t.sellPrice - t.buyPrice) * t.quantity >= 0
                    ? "text-green-700"
                    : "text-red-700"
                }>
                  {(t.sellPrice - t.buyPrice) * t.quantity >= 0 ? "+" : ""}
                  {((t.sellPrice - t.buyPrice) * t.quantity).toFixed(2)}
                </span>
              </div>
            ) : (
              <div className="text-sm text-yellow-700">Holding...</div>
            )}
          </div>
        ))}
      </div>
      <GainChart trades={trades} />

    </div>
  );
}
