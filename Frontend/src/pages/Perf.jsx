import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  ReferenceArea,
} from 'recharts';
import { FaChartLine, FaClock } from 'react-icons/fa';
import apiClient, { API } from '../utils/api';

const METRIC_CONFIG = {
  LCP: { name: 'Largest Contentful Paint', color: '#4ade80', id: 'gradLCP' },
  FID: { name: 'First Input Delay', color: '#f87171', id: 'gradFID' },
  CLS: { name: 'Cumulative Layout Shift', color: '#60a5fa', id: 'gradCLS' },
  FCP: { name: 'First Contentful Paint', color: '#facc15', id: 'gradFCP' },
  TTFB: { name: 'Time to First Byte', color: '#fb923c', id: 'gradTTFB' },
  INP: { name: 'Interaction to Next Paint', color: '#a78bfa', id: 'gradINP' },
};
const ALL_METRICS = Object.keys(METRIC_CONFIG);

const DashboardHeader = ({ lastUpdated }) => (
  <div className="text-center mb-8">
    <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-400">
      <FaChartLine /> Realtime Performance Trends
    </h1>
    <p className="text-sm text-zinc-400 flex items-center justify-center gap-2">
      <FaClock className="text-green-400 animate-pulse" />
      <span>Last updated: {lastUpdated}</span>
    </p>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-4 bg-zinc-900/70 rounded-lg border border-zinc-700 backdrop-blur-sm shadow-xl">
        <p className="label text-zinc-300 font-semibold">{`Time: ${label}`}</p>
        <ul className="mt-2 space-y-1">
          {payload.map((p) => (
            <li key={p.dataKey} className="flex items-center gap-2 text-sm" style={{ color: p.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
              <span>{`${p.name}: ${p.value.toFixed(2)}`}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return null;
};

const CustomizedLegend = ({ payload, onHover, onLeave, onToggle, visibleMetrics }) => (
  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4">
    {payload.map((entry) => {
      const { dataKey, color } = entry;
      const isVisible = visibleMetrics.includes(dataKey);
      return (
        <button
          key={`item-${dataKey}`}
          onClick={() => onToggle(dataKey)}
          onMouseEnter={() => onHover(dataKey)}
          onMouseLeave={onLeave}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full cursor-pointer transition-all duration-200 ease-in-out border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900`}
          style={{
            borderColor: color,
            backgroundColor: isVisible ? color : 'transparent',
            color: isVisible ? '#18181b' : color,
            opacity: isVisible ? 1 : 0.6,
          }}
        >
          {METRIC_CONFIG[dataKey]?.name || dataKey}
        </button>
      );
    })}
  </div>
);

const PerformanceDashboard = () => {
  const [metrics, setMetrics] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('initializing...');
  const [visibleMetrics, setVisibleMetrics] = useState(ALL_METRICS);
  const [hoveredMetric, setHoveredMetric] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await apiClient.get(`${API}/performance`);
        setMetrics(res.data);
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Error fetching metrics:', err);
        setLastUpdated('Error');
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  const chartData = useMemo(() => {
    const grouped = {};
    if (!Array.isArray(metrics)) return [];

    metrics.forEach((metric) => {
      const time = new Date(metric.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      if (!grouped[time]) {
        grouped[time] = { time };
      }
      grouped[time][metric.name] = metric.value;
    });
    return Object.values(grouped).slice(-30);
  }, [metrics]);

  const handleLegendToggle = useCallback((metric) => {
    setVisibleMetrics(prev =>
      prev.includes(metric) ? prev.filter(m => m !== metric) : [...prev, metric]
    );
  }, []);
  const handleLegendHover = useCallback((metric) => setHoveredMetric(metric), []);
  const handleLegendLeave = useCallback(() => setHoveredMetric(null), []);

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader lastUpdated={lastUpdated} />

        <div className="bg-zinc-800/50 rounded-lg p-4 sm:p-6 border border-zinc-700 shadow-2xl backdrop-blur-sm">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <defs>
                {Object.entries(METRIC_CONFIG).map(([key, { color, id }]) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.2} />
                  </linearGradient>
                ))}
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#404040" vertical={false} />
              <XAxis dataKey="time" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#a1a1aa', strokeWidth: 1, strokeDasharray: '3 3' }} />
              
              <ReferenceArea y1={0} y2={100} fill="#4ade80" fillOpacity={0.05} label={{ value: 'Good', position: 'insideTopLeft', fill: '#4ade80', fontSize: 12, dy: 10, dx: 10 }} />
              <ReferenceArea y1={100} y2={300} fill="#facc15" fillOpacity={0.05} label={{ value: 'Needs Improvement', position: 'insideTopLeft', fill: '#facc15', fontSize: 12, dy: 10, dx: 10 }} />

              {ALL_METRICS.map(key => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={`url(#${METRIC_CONFIG[key].id})`}
                  strokeWidth={hoveredMetric === key ? 4 : (visibleMetrics.includes(key) ? 2.5 : 0)}
                  dot={false}
                  animationDuration={300}
                  connectNulls
                />
              ))}
              
              <Legend
                content={
                  <CustomizedLegend
                    onHover={handleLegendHover}
                    onLeave={handleLegendLeave}
                    onToggle={handleLegendToggle}
                    visibleMetrics={visibleMetrics}
                  />
                }
                wrapperStyle={{ paddingTop: '20px' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
