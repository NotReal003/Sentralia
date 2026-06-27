import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900/80 p-4 rounded-lg border border-zinc-700 backdrop-blur-md">
        <p className="label text-zinc-300">{`Time: ${label}`}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {`${p.name}: ${p.value.toFixed(2)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PerformanceChart = ({ data, visibleMetrics, metricConfig }) => {
  return (
    <ResponsiveContainer
      width="100%"
      height={400}
      aria-label="A line chart showing web performance metrics over time."
      role="figure"
    >
      <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
        <XAxis dataKey="time" stroke="#a1a1aa" fontSize={12} />
        <YAxis stroke="#a1a1aa" fontSize={12} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#a1a1aa', strokeWidth: 1, strokeDasharray: '3 3' }} />
        <Legend />
        {visibleMetrics.map((metric) => (
          <Line
            key={metric}
            type="monotone"
            dataKey={metric}
            stroke={metricConfig[metric].color}
            strokeWidth={2.5}
            dot={false}
            animationDuration={300}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PerformanceChart;
