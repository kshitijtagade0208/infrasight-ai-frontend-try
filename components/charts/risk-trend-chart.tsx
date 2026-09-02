'use client';

import * as React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { RiskTrendPoint } from '@/lib/types';

const RISK_COLORS = {
  low: '#2E7D5B',
  moderate: '#C9962C',
  high: '#C7591E',
  critical: '#B23A3A',
};

interface RiskTrendChartProps {
  data: RiskTrendPoint[];
  height?: number;
}

export function RiskTrendChart({ data, height = 240 }: RiskTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <defs>
          {(['low', 'moderate', 'high', 'critical'] as const).map((band) => (
            <linearGradient key={band} id={`grad-${band}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={RISK_COLORS[band]} stopOpacity={0.25} />
              <stop offset="95%" stopColor={RISK_COLORS[band]} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E2DE" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: '#5B6270' }}
          axisLine={{ stroke: '#E2E2DE' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#5B6270' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E2DE',
            borderRadius: 6,
            fontSize: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
          labelStyle={{ fontWeight: 600, color: '#14171C' }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          iconType="circle"
          iconSize={8}
        />
        <Area
          type="monotone"
          dataKey="low"
          stackId="1"
          stroke={RISK_COLORS.low}
          strokeWidth={1.5}
          fill={`url(#grad-low)`}
        />
        <Area
          type="monotone"
          dataKey="moderate"
          stackId="1"
          stroke={RISK_COLORS.moderate}
          strokeWidth={1.5}
          fill={`url(#grad-moderate)`}
        />
        <Area
          type="monotone"
          dataKey="high"
          stackId="1"
          stroke={RISK_COLORS.high}
          strokeWidth={1.5}
          fill={`url(#grad-high)`}
        />
        <Area
          type="monotone"
          dataKey="critical"
          stackId="1"
          stroke={RISK_COLORS.critical}
          strokeWidth={1.5}
          fill={`url(#grad-critical)`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
