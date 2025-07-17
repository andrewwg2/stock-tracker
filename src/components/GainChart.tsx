import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Trade } from '../types';
import { transformTradesForChart } from '../utils';

interface GainChartProps {
  trades: Trade[];
}

export function GainChart({ trades }: GainChartProps) {
  const chartData = transformTradesForChart(trades);

  if (chartData.length === 0) {
    return (
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Gain/Loss Over Time</h3>
        <div className="text-center py-8 text-gray-500">
          <p>No closed trades yet.</p>
          <p className="text-sm mt-1">Complete some trades to see your performance chart.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Gain/Loss Over Time</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip 
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Gain/Loss']}
              labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
            />
            <Line 
              type="monotone" 
              dataKey="gain" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
