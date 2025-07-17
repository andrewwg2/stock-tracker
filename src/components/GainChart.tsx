import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Trade = {
  symbol: string;
  quantity: number;
  buyPrice: number;
  buyDate: string;
  sellPrice?: number;
  sellDate?: string;
};

export default function GainChart({ trades }: { trades: Trade[] }) {
  const gainData = trades
    .filter(t => t.sellPrice && t.sellDate)
    .map(t => ({
      date: t.sellDate!,
      gain: parseFloat(((t.sellPrice! - t.buyPrice) * t.quantity).toFixed(2)),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-2">Gain/Loss Over Time</h3>
      {gainData.length === 0 ? (
        <p className="text-sm text-gray-500">No closed trades yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={gainData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="gain" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}