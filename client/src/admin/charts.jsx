/**
 * Small hand-drawn SVG charts for the Reports and Partner dashboards. No chart
 * library — these three shapes are all the designs use, and keeping them here
 * avoids shipping ~100 KB of dependency for them.
 */
import React, { useMemo, useState } from "react";

export const CHART_COLORS = ["#2563eb", "#dc2626", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#9ca3af", "#ec4899"];

/** Group into the top `n` and fold the rest into "Others". */
export function topN(entries, n = 6) {
  const sorted = [...entries].sort((a, b) => b.value - a.value);
  if (sorted.length <= n + 1) return sorted;
  const head = sorted.slice(0, n);
  const rest = sorted.slice(n).reduce((s, e) => s + e.value, 0);
  return [...head, { label: "Others", value: rest }];
}

// ---------------------------------------------------------------------------
// Donut with a centre total and a legend beside it
// ---------------------------------------------------------------------------

export function Donut({ data, centerLabel = "Bookings", size = 190, thickness = 42, colors = CHART_COLORS }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const c = size / 2;
  const [hover, setHover] = useState(null);

  // Build arc paths; a single 100% slice needs two half-arcs to render.
  let angle = -Math.PI / 2;
  const arcs = data.map((d, i) => {
    const frac = total ? d.value / total : 0;
    const start = angle;
    const end = angle + frac * Math.PI * 2;
    angle = end;
    const large = end - start > Math.PI ? 1 : 0;
    const p = (a) => [c + r * Math.cos(a), c + r * Math.sin(a)];
    const [x1, y1] = p(start);
    const [x2, y2] = p(frac >= 0.9999 ? end - 0.0001 : end);
    const mid = (start + end) / 2;
    return {
      d: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`,
      color: colors[i % colors.length],
      pct: Math.round(frac * 100),
      labelPos: [c + r * Math.cos(mid), c + r * Math.sin(mid)],
      frac,
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${total} ${centerLabel}`} className="flex-shrink-0">
        {total === 0 && <circle cx={c} cy={c} r={r} fill="none" stroke="#eef0f3" strokeWidth={thickness} />}
        {arcs.map((a, i) =>
          a.frac > 0 ? (
            <path
              key={i}
              d={a.d}
              fill="none"
              stroke={a.color}
              strokeWidth={hover === i ? thickness + 6 : thickness}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ transition: "stroke-width .15s" }}
            />
          ) : null
        )}
        {arcs.map((a, i) =>
          a.pct >= 6 ? (
            <text key={`t${i}`} x={a.labelPos[0]} y={a.labelPos[1]} textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="700" fill="#fff" pointerEvents="none">
              {a.pct}%
            </text>
          ) : null
        )}
        <text x={c} y={c - 8} textAnchor="middle" fontSize="26" fontWeight="800" fill="#111827">
          {total}
        </text>
        <text x={c} y={c + 16} textAnchor="middle" fontSize="13" fill="#6b7280">
          {centerLabel}
        </text>
      </svg>

      <ul className="flex-1 w-full space-y-2.5">
        {data.map((d, i) => (
          <li
            key={d.label}
            className={`flex items-center gap-3 text-sm rounded-md px-1 ${hover === i ? "bg-gray-50" : ""}`}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: colors[i % colors.length] }} />
            <span className="flex-1 text-gray-800 truncate">{d.label}</span>
            <span className="font-bold text-gray-900 w-10 text-right">{d.value}</span>
            <span className="text-gray-500 w-10 text-right">{total ? Math.round((d.value / total) * 100) : 0}%</span>
          </li>
        ))}
        {data.length === 0 && <li className="text-sm text-gray-500">No data in this period.</li>}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Horizontal bars (Parts Sales by Item)
// ---------------------------------------------------------------------------

const BAR_COLORS = ["#dc2626", "#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#9ca3af", "#ec4899"];

export function HBars({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.length) return <p className="text-sm text-gray-500 py-6">No parts sold in this period.</p>;
  return (
    <ul className="space-y-3.5">
      {data.map((d, i) => (
        <li key={d.label} className="flex items-center gap-3 text-sm">
          <span className="w-28 text-gray-800 truncate" title={d.label}>
            {d.label}
          </span>
          <span className="flex-1 h-5 bg-gray-50 rounded">
            <span
              className="block h-5 rounded"
              style={{ width: `${Math.max(3, (d.value / max) * 100)}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
            />
          </span>
          <span className="font-bold text-gray-900 w-10 text-right">{d.value}</span>
          <span className="text-gray-500 w-10 text-right">{total ? Math.round((d.value / total) * 100) : 0}%</span>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Line / area trend
// ---------------------------------------------------------------------------

/**
 * @param labels  x-axis labels, one per point
 * @param series  [{ name, color, values: number[], fill?: boolean }]
 */
export function TrendChart({ labels, series, height = 220, money = true }) {
  const W = 640;
  const H = height;
  const pad = { l: money ? 62 : 34, r: 14, t: 12, b: 28 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;

  const max = useMemo(() => {
    const m = Math.max(1, ...series.flatMap((s) => s.values));
    // Counts need whole-number gridlines (0,1,2,3,4 — not 0,0,1,1,1), so
    // round their top up to a multiple of 4.
    if (!money) return Math.max(4, Math.ceil(m / 4) * 4);
    // A round top value so the grid lines land on tidy numbers.
    const mag = Math.pow(10, Math.floor(Math.log10(m)));
    return Math.ceil(m / mag) * mag;
  }, [series, money]);

  const n = Math.max(1, labels.length);
  const x = (i) => pad.l + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v) => pad.t + ih - (v / max) * ih;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);

  // Show roughly six x labels however many points there are.
  const every = Math.max(1, Math.ceil(n / 7));
  const fmtY = (v) =>
    money ? "₹" + (v >= 100000 ? `${(v / 100000).toFixed(v % 100000 ? 1 : 0)}L` : v >= 1000 ? `${Math.round(v / 1000)}k` : Math.round(v)) : Math.round(v);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Trend chart">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#eef0f3" />
          <text x={pad.l - 8} y={y(t)} textAnchor="end" dominantBaseline="central" fontSize="11" fill="#6b7280">
            {fmtY(t)}
          </text>
        </g>
      ))}
      {labels.map((l, i) =>
        i % every === 0 || i === n - 1 ? (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#6b7280">
            {l}
          </text>
        ) : null
      )}
      {series.map((s) => {
        const pts = s.values.map((v, i) => `${x(i)},${y(v)}`);
        const line = `M ${pts.join(" L ")}`;
        const area = `${line} L ${x(s.values.length - 1)},${y(0)} L ${x(0)},${y(0)} Z`;
        return (
          <g key={s.name}>
            {s.fill !== false && <path d={area} fill={s.color} opacity="0.10" />}
            <path d={line} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" />
            {s.values.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r={n > 20 ? 2.5 : 4} fill={s.color}>
                <title>{`${s.name} · ${labels[i]}: ${money ? "₹" + Math.round(v).toLocaleString("en-IN") : v}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

/** Bucket dated items into days across a range, for TrendChart. */
export function dailyBuckets(range, maxPoints = 31) {
  const days = [];
  const start = new Date(range.from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(range.to);
  const span = Math.max(1, Math.round((end - start) / 86400000) + 1);
  // For long ranges, group several days per point so the chart stays readable.
  const step = Math.max(1, Math.ceil(span / maxPoints));
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + step)) {
    const from = new Date(d);
    const to = new Date(d);
    to.setDate(to.getDate() + step);
    days.push({
      from,
      to,
      label: `${String(from.getDate()).padStart(2, "0")} ${"Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ")[from.getMonth()]}`,
    });
  }
  return days;
}

export function bucketIndex(buckets, date) {
  const t = new Date(date).getTime();
  return buckets.findIndex((b) => t >= b.from.getTime() && t < b.to.getTime());
}
