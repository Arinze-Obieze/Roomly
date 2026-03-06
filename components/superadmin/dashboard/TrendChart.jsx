"use client";

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const formatY = (n) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
};

export default function TrendChart({ title, subtitle, data = [], lines = [], loading = false }) {
  const width = 800;
  const height = 280;
  const padding = { top: 16, right: 20, bottom: 30, left: 44 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const values = data.flatMap((point) => lines.map((line) => Number(point?.[line.key] || 0)));
  const maxVal = Math.max(1, ...values);

  const xFor = (index) => {
    if (data.length <= 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (data.length - 1)) * innerWidth;
  };

  const yFor = (value) => padding.top + innerHeight - (Number(value || 0) / maxVal) * innerHeight;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => Math.round(maxVal * p));

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          {subtitle ? <p className="text-sm text-slate-500 mt-1">{subtitle}</p> : null}
        </div>

        <div className="flex flex-wrap gap-3 text-xs">
          {lines.map((line, idx) => (
            <span key={line.key} className="inline-flex items-center gap-1.5 text-slate-600">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: line.color || COLORS[idx % COLORS.length] }}
              />
              {line.label}
            </span>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
      ) : data.length === 0 ? (
        <div className="h-64 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-sm text-slate-500">
          No chart data available.
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[640px]">
            {yTicks.map((tick, idx) => {
              const y = yFor(tick);
              return (
                <g key={`y-${idx}-${tick}`}>
                  <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                  <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">
                    {formatY(tick)}
                  </text>
                </g>
              );
            })}

            {lines.map((line, idx) => {
              const color = line.color || COLORS[idx % COLORS.length];
              const points = data.map((point, index) => `${xFor(index)},${yFor(point[line.key])}`).join(' ');

              return (
                <g key={line.key}>
                  <polyline fill="none" stroke={color} strokeWidth="2.5" points={points} />
                  {data.map((point, index) => (
                    <circle key={`${line.key}-${point.date}-${index}`} cx={xFor(index)} cy={yFor(point[line.key])} r="2.8" fill={color} />
                  ))}
                </g>
              );
            })}

            {data.map((point, index) => {
              const showLabel = index === 0 || index === data.length - 1 || index % Math.ceil(data.length / 6) === 0;
              if (!showLabel) return null;
              return (
                <text
                  key={`x-${point.date}-${index}`}
                  x={xFor(index)}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#64748b"
                >
                  {point.date.slice(5)}
                </text>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}
