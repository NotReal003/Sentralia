import React, { useEffect, useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { 
  BarChart3, TrendingUp, TrendingDown, Calendar, AlertCircle, 
  RefreshCw, Users, Activity, Download, Search, Grid3x3, List,
  Maximize2, Minimize2, Eye, EyeOff, AreaChart as AreaIcon,
  BarChart2, LineChart as LineIcon, Zap, Target, Clock,
  ArrowUpRight, ArrowDownRight, X, Settings, ChevronDown,
  CalendarDays, CalendarRange, Trophy, Crown, Award,
  ChevronLeft, ChevronRight, Sparkles,
} from 'lucide-react';
import AdminOnly from '../components/AdminOnly';

const Card = ({ children, className = '', hover = true }) => (
  <div className={`bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden ${hover ? 'hover:border-indigo-500/30 transition-all duration-300' : ''} ${className}`}>
    {children}
  </div>
);

const DashboardSkeleton = () => (
  <div className="min-h-screen bg-slate-950 p-6">
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="h-24 bg-slate-800/40 rounded-2xl animate-pulse"></div>
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-800/40 rounded-xl animate-pulse"></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => <div key={i} className="h-96 bg-slate-800/40 rounded-2xl animate-pulse"></div>)}
      </div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label, colorTheme = 'indigo' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-slate-700 p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[180px]">
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 border-b border-slate-800 pb-2">{label}</p>
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3 py-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: entry.color }}></div>
              <span className="text-slate-400 text-xs">Visits</span>
            </div>
            <span className="text-indigo-400 font-bold text-sm">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const COLOR_THEMES = {
  indigo: { primary: '#6366f1', secondary: '#818cf8' },
  emerald: { primary: '#10b981', secondary: '#34d399' },
  amber: { primary: '#f59e0b', secondary: '#fbbf24' },
  rose: { primary: '#f43f5e', secondary: '#fb7185' },
  cyan: { primary: '#06b6d4', secondary: '#22d3ee' },
};

const TIME_PRESETS = [
  { id: 'today', label: 'Today', icon: Clock, granularity: 'daily', days: 1 },
  { id: '7d', label: 'Last 7 Days', icon: CalendarDays, granularity: 'daily', days: 7 },
  { id: '30d', label: 'Last 30 Days', icon: Calendar, granularity: 'daily', days: 30 },
  { id: '90d', label: 'Last 90 Days', icon: CalendarRange, granularity: 'daily', days: 90 },
  { id: 'thisMonth', label: 'This Month', icon: Calendar, granularity: 'daily', type: 'currentMonth' },
  { id: 'lastMonth', label: 'Last Month', icon: Calendar, granularity: 'daily', type: 'lastMonth' },
  { id: 'thisYear', label: 'This Year', icon: CalendarRange, granularity: 'monthly', type: 'currentYear' },
  { id: 'lastYear', label: 'Last Year', icon: CalendarRange, granularity: 'monthly', type: 'lastYear' },
  { id: 'all', label: 'All Time', icon: Sparkles, granularity: 'monthly', type: 'all' },
];

const GRANULARITY_OPTIONS = [
  { id: 'daily', label: 'Days', icon: CalendarDays },
  { id: 'weekly', label: 'Weeks', icon: CalendarRange },
  { id: 'monthly', label: 'Months', icon: Calendar },
];

const useAnalytics = (apiEndpoint) => {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchData = async () => {
    setStatus('loading');
    setErrorMessage(null);
    try {
      const response = await fetch(`${apiEndpoint}/visits`, { credentials: 'include' });
      if (response.status === 403) { setStatus('admin_restricted'); return; }
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const result = await response.json();
      setData(result.pageStats || []);
      setStatus('success');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load analytics.');
      setStatus('error');
    }
  };

  useEffect(() => { fetchData(); }, [apiEndpoint]);
  return { data, status, errorMessage, retry: fetchData };
};

const filterByTimeRange = (rawData, preset, customRange, granularity) => {
  if (!rawData || !rawData.length) return [];
  
  const entries = rawData.map(([d, v]) => {
    let date;
    if (granularity === 'daily') {
      date = new Date(d);
    } else if (granularity === 'monthly') {
      const [year, month] = d.split('-');
      date = new Date(parseInt(year), parseInt(month) - 1, 1);
    } else if (granularity === 'weekly') {
      return { date: d, visits: v, rawDate: null, label: `Week ${d}` };
    }
    return { date: d, visits: v, rawDate: date, label: d };
  }).filter(e => e.rawDate instanceof Date && !isNaN(e.rawDate) || granularity === 'weekly');

  if (granularity === 'weekly') return entries;

  const now = new Date();
  let startDate = null;
  let endDate = now;

  if (preset === 'custom' && customRange.start && customRange.end) {
    startDate = new Date(customRange.start);
    endDate = new Date(customRange.end);
  } else if (preset === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (preset === '7d') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (preset === '30d') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (preset === '90d') {
    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  } else if (preset === 'thisMonth') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (preset === 'lastMonth') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0);
  } else if (preset === 'thisYear') {
    startDate = new Date(now.getFullYear(), 0, 1);
  } else if (preset === 'lastYear') {
    startDate = new Date(now.getFullYear() - 1, 0, 1);
    endDate = new Date(now.getFullYear() - 1, 11, 31);
  } else if (preset === 'all') {
    return entries;
  } else if (preset.startsWith('year-')) {
    const year = parseInt(preset.replace('year-', ''));
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31);
  }

  if (!startDate) return entries;

  return entries.filter(e => e.rawDate >= startDate && e.rawDate <= endDate);
};

const calculateComparison = (current, rawData, preset, granularity) => {
  if (!current.length) return { change: 0, previousTotal: 0 };
  
  const currentTotal = current.reduce((sum, e) => sum + e.visits, 0);
  const now = new Date();
  let prevStart, prevEnd;

  if (preset === '7d') {
    prevEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    prevStart = new Date(prevEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (preset === '30d') {
    prevEnd = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    prevStart = new Date(prevEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (preset === 'thisMonth') {
    prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  } else if (preset === 'thisYear') {
    prevStart = new Date(now.getFullYear() - 1, 0, 1);
    prevEnd = new Date(now.getFullYear() - 1, 11, 31);
  } else {
    return { change: 0, previousTotal: 0 };
  }

  const entries = rawData.map(([d, v]) => ({
    date: new Date(d),
    visits: v
  })).filter(e => e.date instanceof Date && !isNaN(e.date));

  const previousEntries = entries.filter(e => e.date >= prevStart && e.date <= prevEnd);
  const previousTotal = previousEntries.reduce((sum, e) => sum + e.visits, 0);
  
  const change = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
  return { change, previousTotal };
};

const findBestPeriods = (rawData, granularity) => {
  if (!rawData || !rawData.length) return null;

  const daily = {};
  const monthly = {};
  const yearly = {};

  rawData.forEach(([d, v]) => {
    const date = granularity === 'monthly' 
      ? new Date(...d.split('-').map((p, i) => i === 1 ? parseInt(p) - 1 : parseInt(p)))
      : new Date(d);
    
    if (isNaN(date)) return;

    const dayKey = date.toISOString().split('T')[0];
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const yearKey = `${date.getFullYear()}`;

    daily[dayKey] = (daily[dayKey] || 0) + v;
    monthly[monthKey] = (monthly[monthKey] || 0) + v;
    yearly[yearKey] = (yearly[yearKey] || 0) + v;
  });

  const findMax = (obj) => {
    const entries = Object.entries(obj);
    if (!entries.length) return null;
    return entries.reduce((max, curr) => curr[1] > max[1] ? curr : max);
  };

  const bestDay = findMax(daily);
  const bestMonth = findMax(monthly);
  const bestYear = findMax(yearly);

  return {
    bestDay: bestDay ? { label: bestDay[0], value: bestDay[1] } : null,
    bestMonth: bestMonth ? { label: bestMonth[0], value: bestMonth[1] } : null,
    bestYear: bestYear ? { label: bestYear[0], value: bestYear[1] } : null,
    availableYears: Object.keys(yearly).sort().reverse(),
  };
};

const StatCard = ({ label, value, icon: Icon, color = 'indigo', trend, subValue, badge }) => {
  const colorMap = {
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  };
  const c = colorMap[color];

  return (
    <div className={`relative bg-slate-800/40 backdrop-blur-md border ${c.border} rounded-2xl p-5 overflow-hidden group transition-all duration-300`}>
      <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full ${c.bg} blur-2xl opacity-50`}></div>
      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">{label}</p>
            {badge && (
              <span className={`px-1.5 py-0.5 ${c.bg} ${c.text} text-[9px] font-bold rounded uppercase`}>
                {badge}
              </span>
            )}
          </div>
          <p className={`text-2xl font-black ${c.text} truncate`}>{value}</p>
          {(trend !== undefined || subValue) && (
            <div className="flex items-center gap-2 mt-2">
              {trend !== undefined && trend !== 0 && (
                <span className={`inline-flex items-center gap-1 text-xs font-bold ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {Math.abs(trend).toFixed(1)}%
                </span>
              )}
              {subValue && <span className="text-xs text-slate-500 truncate">{subValue}</span>}
            </div>
          )}
        </div>
        <div className={`p-2.5 ${c.bg} rounded-xl ${c.text} border ${c.border} flex-shrink-0`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
};

const TimeRangeSelector = ({ preset, setPreset, customRange, setCustomRange, availableYears }) => {
  const [showCustom, setShowCustom] = useState(false);
  const [showYears, setShowYears] = useState(false);
  
  const currentPreset = TIME_PRESETS.find(p => p.id === preset);
  const isYearFilter = preset.startsWith('year-');
  const selectedYear = isYearFilter ? preset.replace('year-', '') : null;

  return (
    <div className="space-y-3">
      
      <div className="flex flex-wrap gap-2">
        {TIME_PRESETS.map(p => (
          <button
            key={p.id}
            onClick={() => { setPreset(p.id); setShowCustom(false); setShowYears(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              preset === p.id
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent shadow-lg shadow-indigo-500/30'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <p.icon size={12} />
            {p.label}
          </button>
        ))}

        {availableYears && availableYears.length > 0 && (
          <div className="relative">
            <button
              onClick={() => { setShowYears(!showYears); setShowCustom(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                isYearFilter || showYears
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-lg shadow-amber-500/30'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <Trophy size={12} />
              {isYearFilter ? `Year ${selectedYear}` : 'Specific Year'}
              <ChevronDown size={10} className={`transition-transform ${showYears ? 'rotate-180' : ''}`} />
            </button>
            {showYears && (
              <div className="absolute top-full mt-2 left-0 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 min-w-[150px] z-20 max-h-60 overflow-y-auto">
                {availableYears.map(year => (
                  <button
                    key={year}
                    onClick={() => { setPreset(`year-${year}`); setShowYears(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      selectedYear === year
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => { setShowCustom(!showCustom); setShowYears(false); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
            preset === 'custom' || showCustom
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-transparent shadow-lg shadow-cyan-500/30'
              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
          }`}
        >
          <CalendarRange size={12} />
          Custom Range
        </button>
      </div>

      {showCustom && (
        <div className="flex flex-wrap items-end gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">From</label>
            <input
              type="date"
              value={customRange.start}
              onChange={e => setCustomRange({ ...customRange, start: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">To</label>
            <input
              type="date"
              value={customRange.end}
              onChange={e => setCustomRange({ ...customRange, end: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            onClick={() => setPreset('custom')}
            disabled={!customRange.start || !customRange.end}
            className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-lg text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
};

const GranularitySelector = ({ value, onChange }) => (
  <div className="bg-slate-900/60 p-1 rounded-lg border border-slate-800 flex">
    {GRANULARITY_OPTIONS.map(opt => (
      <button
        key={opt.id}
        onClick={() => onChange(opt.id)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all capitalize ${
          value === opt.id 
            ? 'bg-indigo-500/20 text-indigo-400' 
            : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <opt.icon size={12} />
        {opt.label}
      </button>
    ))}
  </div>
);

const ChartTypeSelector = ({ value, onChange }) => {
  const types = [
    { id: 'area', icon: AreaIcon, label: 'Area' },
    { id: 'line', icon: LineIcon, label: 'Line' },
    { id: 'bar', icon: BarChart2, label: 'Bar' },
  ];
  return (
    <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
      {types.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          title={t.label}
          className={`p-1.5 rounded-md transition-all ${
            value === t.id ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <t.icon size={14} />
        </button>
      ))}
    </div>
  );
};

const MiniStat = ({ label, value, icon: Icon, color, highlight }) => {
  const colors = {
    blue: 'text-blue-400 bg-blue-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    rose: 'text-rose-400 bg-rose-500/10',
    yellow: 'text-yellow-400 bg-yellow-500/10',
  };
  return (
    <div className={`bg-slate-900/40 rounded-xl p-3 border ${highlight ? 'border-yellow-500/30' : 'border-slate-800/50'}`}>
      <div className={`inline-flex items-center gap-1 ${colors[color]} px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mb-1.5`}>
        <Icon size={10} />
        {label}
      </div>
      <div className="text-base font-black text-white truncate">{value}</div>
    </div>
  );
};

const ChartSection = ({ pageData, granularity, preset, customRange, globalSettings }) => {
  const [chartType, setChartType] = useState(globalSettings.defaultChartType);
  const [colorTheme, setColorTheme] = useState(globalSettings.defaultColorTheme);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => { setChartType(globalSettings.defaultChartType); }, [globalSettings.defaultChartType]);
  useEffect(() => { setColorTheme(globalSettings.defaultColorTheme); }, [globalSettings.defaultColorTheme]);

  const { chartData, stats, bestPeriods, comparison } = useMemo(() => {
    let rawSource = [];
    if (granularity === 'daily') rawSource = pageData.dailyVisits || [];
    else if (granularity === 'weekly') rawSource = pageData.weeklyVisits || [];
    else if (granularity === 'monthly') rawSource = pageData.monthlyVisits || [];

    const filtered = filterByTimeRange(rawSource, preset, customRange, granularity);
    const chartData = filtered.map(e => ({ date: e.label || e.date, visits: e.visits }));

    const visitsArr = chartData.map(d => d.visits);
    const total = visitsArr.reduce((a, b) => a + b, 0);
    const avg = visitsArr.length ? Math.round(total / visitsArr.length) : 0;
    const max = visitsArr.length ? Math.max(...visitsArr) : 0;
    const min = visitsArr.length ? Math.min(...visitsArr) : 0;

    const bestPeriods = findBestPeriods(pageData.dailyVisits || [], 'daily');
    
    const comparison = calculateComparison(filtered, rawSource, preset, granularity);

    return { 
      chartData, 
      stats: { total, avg, max, min, count: visitsArr.length },
      bestPeriods,
      comparison,
    };
  }, [pageData, granularity, preset, customRange]);

  const theme = COLOR_THEMES[colorTheme];
  const gradientId = `gradient-${pageData.pageType}-${colorTheme}`;

  const exportCSV = () => {
    const csv = ['Date,Visits', ...chartData.map(d => `${d.date},${d.visits}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pageData.pageType}-${preset}-${granularity}.csv`;
    a.click();
  };

  const renderChart = () => {
    const commonProps = { data: chartData, margin: { top: 10, right: 10, left: 0, bottom: 0 } };
    const axes = (
      <>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} minTickGap={30} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} 
          tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val} />
        <Tooltip content={<CustomTooltip colorTheme={colorTheme} />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
      </>
    );

    if (chartType === 'line') {
      return (
        <LineChart {...commonProps}>
          {axes}
          <Line type="monotone" dataKey="visits" stroke={theme.primary} strokeWidth={3} 
            dot={{ fill: theme.primary, r: 3 }} activeDot={{ r: 6, fill: theme.secondary }} animationDuration={1000} />
        </LineChart>
      );
    }

    if (chartType === 'bar') {
      return (
        <BarChart {...commonProps}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.primary} stopOpacity={1}/>
              <stop offset="100%" stopColor={theme.secondary} stopOpacity={0.6}/>
            </linearGradient>
          </defs>
          {axes}
          <Bar dataKey="visits" fill={`url(#${gradientId})`} radius={[6, 6, 0, 0]} animationDuration={1000} />
        </BarChart>
      );
    }

    return (
      <AreaChart {...commonProps}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={theme.primary} stopOpacity={0.5}/>
            <stop offset="95%" stopColor={theme.primary} stopOpacity={0}/>
          </linearGradient>
        </defs>
        {axes}
        <Area type="monotone" dataKey="visits" stroke={theme.secondary} strokeWidth={3}
          fillOpacity={1} fill={`url(#${gradientId})`} animationDuration={1200} />
      </AreaChart>
    );
  };

  return (
    <Card className={isExpanded ? 'lg:col-span-2' : ''}>
      <div className="p-5 sm:p-6">
        
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl"
              style={{ background: `linear-gradient(135deg, ${theme.primary}30, ${theme.secondary}15)`, borderColor: `${theme.primary}40`, borderWidth: 1, borderStyle: 'solid' }}>
              <Activity size={18} style={{ color: theme.primary }} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-black text-white truncate">
                {pageData.pageType.toUpperCase()}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {stats.count} {granularity === 'daily' ? 'days' : granularity === 'weekly' ? 'weeks' : 'months'} • 
                <span className="text-slate-400 ml-1">{TIME_PRESETS.find(p => p.id === preset)?.label || 'Filtered'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <ChartTypeSelector value={chartType} onChange={setChartType} />
            
            <div className="flex gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
              {Object.entries(COLOR_THEMES).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setColorTheme(key)}
                  className={`w-4 h-4 rounded-full transition-all ${
                    colorTheme === key ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900 scale-110' : ''
                  }`}
                  style={{ background: `linear-gradient(135deg, ${val.primary}, ${val.secondary})` }}
                  title={key}
                />
              ))}
            </div>
            <button
              onClick={exportCSV}
              className="p-2 rounded-lg bg-slate-900/80 text-slate-500 hover:text-emerald-400 transition-all border border-slate-800"
              title="Export CSV"
            >
              <Download size={14} />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="hidden lg:block p-2 rounded-lg bg-slate-900/80 text-slate-500 hover:text-slate-300 transition-all border border-slate-800"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <MiniStat label="Total" value={stats.total.toLocaleString()} icon={Users} color="blue" />
          <MiniStat label="Average" value={stats.avg.toLocaleString()} icon={BarChart3} color="purple" />
          <MiniStat label="Peak" value={stats.max.toLocaleString()} icon={TrendingUp} color="emerald" />
          <MiniStat 
            label="vs Previous" 
            value={comparison.change !== 0 ? `${comparison.change >= 0 ? '+' : ''}${comparison.change.toFixed(1)}%` : 'N/A'} 
            icon={comparison.change >= 0 ? TrendingUp : TrendingDown} 
            color={comparison.change >= 0 ? 'emerald' : 'rose'} 
          />
        </div>

        {bestPeriods && (bestPeriods.bestDay || bestPeriods.bestMonth || bestPeriods.bestYear) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
            {bestPeriods.bestDay && (
              <div className="flex items-center gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-2">
                <Crown size={14} className="text-yellow-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] text-yellow-500/70 font-bold uppercase tracking-wider">Best Day</p>
                  <p className="text-xs text-white font-semibold truncate">
                    {bestPeriods.bestDay.label} <span className="text-yellow-400">({bestPeriods.bestDay.value.toLocaleString()})</span>
                  </p>
                </div>
              </div>
            )}
            {bestPeriods.bestMonth && (
              <div className="flex items-center gap-2 bg-amber-500/5 border border-amber-500/20 rounded-lg p-2">
                <Award size={14} className="text-amber-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] text-amber-500/70 font-bold uppercase tracking-wider">Best Month</p>
                  <p className="text-xs text-white font-semibold truncate">
                    {bestPeriods.bestMonth.label} <span className="text-amber-400">({bestPeriods.bestMonth.value.toLocaleString()})</span>
                  </p>
                </div>
              </div>
            )}
            {bestPeriods.bestYear && (
              <div className="flex items-center gap-2 bg-orange-500/5 border border-orange-500/20 rounded-lg p-2">
                <Trophy size={14} className="text-orange-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] text-orange-500/70 font-bold uppercase tracking-wider">Best Year</p>
                  <p className="text-xs text-white font-semibold truncate">
                    {bestPeriods.bestYear.label} <span className="text-orange-400">({bestPeriods.bestYear.value.toLocaleString()})</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {chartData.length > 0 ? (
          <div className={`w-full bg-gradient-to-b from-slate-900/30 to-transparent rounded-xl p-2 border border-slate-800/50 transition-all duration-500 ${
            isExpanded ? 'h-[450px]' : 'h-[300px]'
          }`}>
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center border border-slate-800/50 rounded-xl bg-slate-900/30">
            <Calendar size={40} className="text-slate-700 mb-3" />
            <p className="text-slate-500 font-semibold">No data in this range</p>
            <p className="text-slate-600 text-xs mt-1">Try a different time period</p>
          </div>
        )}
      </div>
    </Card>
  );
};

const Analytics = () => {
  const [preset, setPreset] = useState('30d');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [granularity, setGranularity] = useState('daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [globalSettings, setGlobalSettings] = useState({
    defaultChartType: 'area',
    defaultColorTheme: 'indigo',
  });

  const API = process.env.REACT_APP_API || 'http://localhost:3000';
  const { data: analyticsData, status, errorMessage, retry } = useAnalytics(API);

  const availableYears = useMemo(() => {
    if (!analyticsData.length) return [];
    const years = new Set();
    analyticsData.forEach(page => {
      (page.dailyVisits || []).forEach(([d]) => {
        const year = new Date(d).getFullYear();
        if (!isNaN(year)) years.add(year.toString());
      });
    });
    return Array.from(years).sort().reverse();
  }, [analyticsData]);

  const aggregateStats = useMemo(() => {
    if (!analyticsData.length) return null;

    let totalInRange = 0;
    let peakInRange = 0;
    let peakPage = '';
    let totalAllTime = 0;

    analyticsData.forEach(page => {
      totalAllTime += (page.totalVisits || 0);
      const rawSource = granularity === 'daily' ? page.dailyVisits 
        : granularity === 'weekly' ? page.weeklyVisits 
        : page.monthlyVisits;
      const filtered = filterByTimeRange(rawSource || [], preset, customRange, granularity);
      const pageTotal = filtered.reduce((sum, e) => sum + e.visits, 0);
      totalInRange += pageTotal;
      if (pageTotal > peakInRange) {
        peakInRange = pageTotal;
        peakPage = page.pageType;
      }
    });

    return {
      totalInRange,
      totalAllTime,
      totalPages: analyticsData.length,
      peakPage,
      peakValue: peakInRange,
    };
  }, [analyticsData, preset, customRange, granularity]);

  const displayData = useMemo(() => {
    let result = [...analyticsData];
    if (searchQuery) {
      result = result.filter(p => p.pageType?.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (sortBy === 'highest') result.sort((a, b) => (b.totalVisits || 0) - (a.totalVisits || 0));
    else if (sortBy === 'lowest') result.sort((a, b) => (a.totalVisits || 0) - (b.totalVisits || 0));
    else if (sortBy === 'az') result.sort((a, b) => (a.pageType || '').localeCompare(b.pageType || ''));
    return result;
  }, [analyticsData, searchQuery, sortBy]);

  if (status === 'loading') return <DashboardSkeleton />;
  if (status === 'admin_restricted') return <AdminOnly />;
  
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-gradient-to-br from-red-950/40 to-slate-900/40 backdrop-blur-md border border-red-900/30 p-8 rounded-2xl text-center max-w-md">
          <div className="inline-flex p-4 bg-red-500/10 rounded-2xl mb-4 border border-red-500/20">
            <AlertCircle className="w-12 h-12 text-red-400" />
          </div>
          <h3 className="text-2xl font-black text-white mb-2">Failed to Load</h3>
          <p className="text-slate-400 mb-6">{errorMessage}</p>
          <button onClick={retry} className="flex items-center justify-center gap-2 mx-auto bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-2.5 rounded-xl font-bold">
            <RefreshCw size={18} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]" />
        <div className="absolute top-[30%] right-[20%] w-[25%] h-[25%] bg-purple-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 lg:px-8 max-w-7xl">
        
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/30">
              <BarChart3 size={24} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                Analytics Dashboard
              </h1>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mt-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                Real-time Traffic Overview
              </p>
            </div>
          </div>

          <Card hover={false} className="mb-6">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Time Range</h3>
                </div>
                <GranularitySelector value={granularity} onChange={setGranularity} />
              </div>
              <TimeRangeSelector
                preset={preset}
                setPreset={setPreset}
                customRange={customRange}
                setCustomRange={setCustomRange}
                availableYears={availableYears}
              />
            </div>
          </Card>

          {aggregateStats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard 
                label={`Visits (${TIME_PRESETS.find(p => p.id === preset)?.label || 'Selected'})`}
                value={aggregateStats.totalInRange.toLocaleString()}
                icon={Users}
                color="indigo"
                badge="In Range"
              />
              <StatCard 
                label="All Time Total" 
                value={aggregateStats.totalAllTime.toLocaleString()}
                icon={Sparkles}
                color="cyan"
              />
              <StatCard 
                label="Pages Tracked" 
                value={aggregateStats.totalPages}
                icon={Target}
                color="amber"
              />
              <StatCard 
                label="Top Page (Range)" 
                value={aggregateStats.peakPage?.toUpperCase() || 'N/A'}
                subValue={`${aggregateStats.peakValue.toLocaleString()} visits`}
                icon={Crown}
                color="yellow"
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="default">Default order</option>
              <option value="highest">Most visited</option>
              <option value="lowest">Least visited</option>
              <option value="az">Alphabetical</option>
            </select>
          </div>
        </header>

        {displayData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <Calendar size={64} className="mb-4 opacity-50" />
            <p className="text-lg">No analytics data available.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Showing <span className="text-white">{displayData.length}</span> of <span className="text-white">{analyticsData.length}</span> pages
              </p>
            </div>
            <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
              {displayData.map((page, index) => (
                <ChartSection 
                  key={page.pageType || index} 
                  pageData={page} 
                  granularity={granularity}
                  preset={preset}
                  customRange={customRange}
                  globalSettings={globalSettings}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;
