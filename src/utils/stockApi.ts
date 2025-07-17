export async function fetchStockPrice(symbol: string): Promise<number> {
  const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  const price = parseFloat(data["Global Quote"]?.["05. price"] ?? "0");
  return price;
}
