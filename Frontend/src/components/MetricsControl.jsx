import React from 'react';

const MetricsControl = ({ allMetrics, visibleMetrics, setVisibleMetrics, metricConfig }) => {
  const toggleMetric = (metric) => {
    setVisibleMetrics((prev) =>
      prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric]
    );
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      {allMetrics.map((metric) => {
        const isVisible = visibleMetrics.includes(metric);
        const color = metricConfig[metric].color;
        
        return (
          <button
            key={metric}
            onClick={() => toggleMetric(metric)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ease-in-out border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900`}
            style={{
              borderColor: color,
              backgroundColor: isVisible ? color : 'transparent',
              color: isVisible ? '#18181b' : color,
            }}
          >
            {metric}
          </button>
        );
      })}
    </div>
  );
};

export default MetricsControl;
