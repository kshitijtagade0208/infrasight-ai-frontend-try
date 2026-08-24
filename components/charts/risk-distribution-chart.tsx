'use client';

import * as React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { StateRiskDatum } from '@/lib/types';
import { RISK_BAND_BG } from '@/lib/risk';

const RISK_HEX: Record<string, string> = {
  low: '#2E7D5B',
  moderate: '#C9962C',
  high: '#C7591E',
  critical: '#B23A3A',
};

interface RiskDistributionChartProps {
  data: StateRiskDatum[];
  height?: number;
}

export function RiskDistributionChart({ data, height = 240 }: RiskDistributionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
      >
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis
          type="category"
          dataKey="state"
          tick={{ fontSize: 11, fill: '#5B6270' }}
          axisLine={false}
          tickLine={false}
          width={110}
        />
        <Tooltip
          cursor={{ fill: '#F7F7F5' }}
          contentStyle={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E2DE',
            borderRadius: 6,
            fontSize: 12,
          }}
          labelStyle={{ fontWeight: 600, color: '#14171C' }}
        />
        <Bar dataKey="avgRisk" radius={[0, 3, 3, 0]} barSize={14}>
          {data.map((entry, i) => (
            <Cell key={i} fill={RISK_HEX[entry.band]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export { RISK_HEX };
