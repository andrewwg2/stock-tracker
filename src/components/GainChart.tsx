/**
 * GainChart Component
 * Chart visualization for portfolio gains/losses over time
 */

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card } from './Card';
import { transformTradesForChart, COLORS, CHART_CONFIG } from '../utils';
import type { TradeDTO } from '../types';

interface GainChartProps {
  trades: TradeDTO[];
  chartType?: 'line' | 'bar';
  showCumulative?: boolean;
}

export const GainChart: React.FC<GainChartProps> = React.memo(({ 
  trades, 
  chartType = 'line',
  showCumulative = true 
}) => {
  const chartData = useMemo(() => {
    const baseData = transformTradesForChart(trades);
    
    if (!showCumulative || baseData.length === 0) {
      return baseData;
    }

    // Add cumulative gain calculation
    let cumulativeGain = 0;
    return baseData.map(point => {
      cumulativeGain += point.gain;
      return {
        ...point,
        cumulativeGain
      };
    });
  }, [trades, showCumulative]);

  const hasData = chartData.length > 0;
  const hasPositiveGains = chartData.some(d => d.gain > 0);
  const hasNegativeGains = chartData.some(d => d.gain < 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="chart-tooltip">
          <div className="font-semibold">{new Date(label).toLocaleDateString()}</div>
          <div className="text-sm">
            <div>Symbol: {data.symbol}</div>
            <div>Trade Gain: <span className={data.gain >= 0 ? 'text-green-600' : 'text-red-600'}>
              ${data.gain.toFixed(2)}
            </span></div>
            {showCumulative && data.cumulativeGain !== undefined && (
              <div>Cumulative: <span className={data.cumulativeGain >= 0 ? 'text-green-600' : 'text-red-600'}>
                ${data.cumulativeGain.toFixed(2)}
              </span></div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (!hasData) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Chart</h3>
          <p className="text-gray-600">Complete some trades to see your portfolio performance over time.</p>
          <p className="text-sm text-gray-500 mt-1">Charts will show realized gains and losses from closed positions.</p>
        </div>
      </Card>
    );
  }

  const ChartComponent = chartType === 'bar' ? BarChart : LineChart;

  return (
    <Card>
      <div className="space-y-4">
        {/* Chart Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Performance Over Time</h3>
            <p className="text-sm text-gray-600">
              {showCumulative ? 'Cumulative gains/losses' : 'Individual trade gains/losses'} from closed positions
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            {hasPositiveGains && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Gains</span>
              </div>
            )}
            {hasNegativeGains && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">Losses</span>
              </div>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="chart-container" style={{ height: CHART_CONFIG.HEIGHT }}>
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent 
              data={chartData} 
              margin={CHART_CONFIG.MARGIN}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
              
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={(value) => `$${Math.abs(value) >= 1000 
                  ? `${(value / 1000).toFixed(1)}k` 
                  : value.toFixed(0)}`}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
              
              <Tooltip content={<CustomTooltip />} />

              {chartType === 'line' ? (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="gain" 
                    stroke={COLORS.PRIMARY}
                    strokeWidth={2}
                    dot={{ fill: COLORS.PRIMARY, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: COLORS.PRIMARY }}
                    name="Trade Gain"
                  />
                  
                  {showCumulative && (
                    <Line 
                      type="monotone" 
                      dataKey="cumulativeGain" 
                      stroke={COLORS.SECONDARY}
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={false}
                      activeDot={{ r: 6, fill: COLORS.SECONDARY }}
                      name="Cumulative Gain"
                    />
                  )}
                </>
              ) : (
                <Bar 
                  dataKey="gain" 
                  fill={(entry: any) => entry.gain >= 0 ? COLORS.POSITIVE : COLORS.NEGATIVE}
                  name="Trade Gain"
                />
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </div>

        {/* Chart Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-sm text-gray-500">Total Trades</div>
            <div className="font-semibold">{chartData.length}</div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-500">Profitable</div>
            <div className="font-semibold text-green-600">
              {chartData.filter(d => d.gain > 0).length}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-500">Losing</div>
            <div className="font-semibold text-red-600">
              {chartData.filter(d => d.gain < 0).length}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-500">Win Rate</div>
            <div className="font-semibold">
              {chartData.length > 0 
                ? `${((chartData.filter(d => d.gain > 0).length / chartData.length) * 100).toFixed(1)}%`
                : '0%'
              }
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
});

GainChart.displayName = 'GainChart';
