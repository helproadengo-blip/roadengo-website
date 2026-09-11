/**
 * Shared building blocks for the admin and partner panels, drawn from the
 * client's panel designs: white rounded cards on a light grey page, a coloured
 * icon tile on each stat, pill badges for status, and red as the one accent.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, RotateCcw, Search, MoreVertical, TrendingUp, TrendingDown } from "lucide-react";

export const API_ORIGIN = "https://api.roadengo.com";

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export const money = (n) => "₹" + Math.round(Number(n || 0)).toLocaleString("en-IN");
export const money2 = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtDate = (d) => {
  if (!d) return "—";
  const x = new Date(d);
  return `${String(x.getDate()).padStart(2, "0")} ${"Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ")[x.getMonth()]} ${x.getFullYear()}`;
};

export const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase() : "";

export const photoUrl = (p) => (p ? (p.startsWith("http") ? p : API_ORIGIN + p) : null);

// ---------------------------------------------------------------------------
// Date ranges
// ---------------------------------------------------------------------------

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

export const RANGE_PRESETS = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "month", label: "This month" },
  { key: "30d", label: "Last 30 days" },
  { key: "year", label: "This year" },
  { key: "all", label: "All time" },
];

export function rangeFor(key) {
  const now = new Date();
  switch (key) {
    case "today":
      return { key, from: startOfDay(now), to: endOfDay(now) };
    case "7d": {
      const f = new Date(now);
      f.setDate(f.getDate() - 6);
      return { key, from: startOfDay(f), to: endOfDay(now) };
    }
    case "30d": {
      const f = new Date(now);
      f.setDate(f.getDate() - 29);
      return { key, from: startOfDay(f), to: endOfDay(now) };
    }
    case "year":
      return { key, from: new Date(now.getFullYear(), 0, 1), to: endOfDay(now) };
    case "all":
      return { key, from: new Date(2020, 0, 1), to: endOfDay(now) };
    case "month":
    default:
      return { key: "month", from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfDay(now) };
  }
}

/** The same-length window immediately before `range`, for trend arrows. */
export function previousRange(range) {
  const len = range.to - range.from;
  const to = new Date(range.from.getTime() - 1);
  return { from: new Date(to.getTime() - len), to };
}

export const inRange = (d, range) => {
  if (!d) return false;
  const t = new Date(d).getTime();
  return t >= range.from.getTime() && t <= range.to.getTime();
};

export const isToday = (d) => d && new Date(d).toDateString() === new Date().toDateString();

/** Percentage change, or null when there's nothing to compare against. */
export function pctChange(now, before) {
  if (!before) return now ? null : 0;
  return Math.round(((now - before) / before) * 100);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// "01 Sep 2026" — spelled out by hand because some browsers print "Sept".
const fmtRangeDate = (d) => {
  const x = new Date(d);
  return `${String(x.getDate()).padStart(2, "0")} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`;
};

export function DateRangePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState({ from: "", to: "" });
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const label = value.key === "all" ? "All time" : `${fmtRangeDate(value.from)} - ${fmtRangeDate(value.to)}`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 hover:border-gray-300 shadow-sm"
      >
        <Calendar className="w-4 h-4 text-gray-600" />
        <span className="whitespace-nowrap">{label}</span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-2">
          {RANGE_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                onChange(rangeFor(p.key));
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                value.key === p.key ? "bg-red-50 text-red-700 font-semibold" : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              {p.label}
            </button>
          ))}
          <div className="border-t border-gray-100 mt-2 pt-2 px-1">
            <p className="text-xs font-semibold text-gray-500 mb-1.5">Custom range</p>
            <div className="flex gap-1.5">
              <input
                type="date"
                aria-label="From date"
                value={custom.from}
                onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
              />
              <input
                type="date"
                aria-label="To date"
                value={custom.to}
                onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
              />
            </div>
            <button
              type="button"
              disabled={!custom.from || !custom.to}
              onClick={() => {
                onChange({ key: "custom", from: startOfDay(custom.from), to: endOfDay(custom.to) });
                setOpen(false);
              }}
              className="mt-2 w-full bg-red-600 disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg py-2"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout pieces
// ---------------------------------------------------------------------------

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export function PrimaryButton({ icon: Icon, children, className = "", ...rest }) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex items-center gap-2 bg-red-700 hover:bg-red-800 disabled:bg-gray-300 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm ${className}`}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
}

const TONES = {
  red: { tile: "bg-red-500", soft: "bg-red-50", text: "text-red-600", border: "border-red-100" },
  green: { tile: "bg-emerald-500", soft: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
  amber: { tile: "bg-amber-500", soft: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
  purple: { tile: "bg-violet-500", soft: "bg-violet-50", text: "text-violet-600", border: "border-violet-100" },
  blue: { tile: "bg-blue-500", soft: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" },
  teal: { tile: "bg-teal-500", soft: "bg-teal-50", text: "text-teal-600", border: "border-teal-100" },
  gray: { tile: "bg-gray-500", soft: "bg-gray-50", text: "text-gray-600", border: "border-gray-100" },
};

/**
 * @param variant  "solid" (white card, solid icon tile — the headline row) or
 *                 "soft" (tinted card — the "today" row under it).
 * @param trend    % change vs the previous period; null hides the arrow.
 */
export function StatCard({ icon: Icon, tone = "red", label, value, trend, trendLabel = "vs previous period", sub, variant = "solid", onClick, active }) {
  const t = TONES[tone] || TONES.red;
  const soft = variant === "soft";
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`text-left rounded-2xl p-4 flex items-start gap-3 min-w-0 transition-all ${
        soft ? `${t.soft} border ${t.border}` : "bg-white border border-gray-100 shadow-sm"
      } ${onClick ? "hover:shadow-md" : ""} ${active ? "ring-2 ring-red-500" : ""}`}
    >
      {Icon && (
        <span className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${t.tile}`}>
          <Icon className="w-5 h-5 text-white" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-sm text-gray-700 font-medium leading-snug line-clamp-2">{label}</span>
        <span className="block text-2xl font-bold text-gray-900 leading-tight mt-0.5">{value}</span>
        {trend !== undefined && trend !== null && (
          <span className="flex items-center gap-1 mt-1">
            {trend >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-red-600" />
            )}
            <span className={`text-xs font-semibold ${trend >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {trend >= 0 ? "+" : ""}
              {trend}%
            </span>
          </span>
        )}
        {(trend !== undefined || sub) && (
          <span className="block text-xs text-gray-500 mt-0.5">{sub || trendLabel}</span>
        )}
      </span>
    </Tag>
  );
}

export function FilterBar({ children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-4 flex flex-wrap items-center gap-3">
      {children}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder, className = "" }) {
  return (
    <div className={`relative flex-1 min-w-[220px] ${className}`}>
      <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300"
      />
    </div>
  );
}

export function SelectBox({ value, onChange, options, label, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none border border-gray-200 rounded-xl pl-3.5 pr-9 py-2.5 text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-100 min-w-[140px]"
      >
        {options.map((o) =>
          typeof o === "string" ? (
            <option key={o} value={o}>
              {o}
            </option>
          ) : (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          )
        )}
      </select>
      <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

export function ClearButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
    >
      <RotateCcw className="w-4 h-4" />
      Clear
    </button>
  );
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export function TableCard({ children, footer }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">{children}</div>
      {footer}
    </div>
  );
}

export function Th({ children, className = "" }) {
  return (
    <th className={`text-left text-xs font-semibold text-gray-700 px-4 py-3 bg-gray-50 whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
}

// Two text colours on one element fight over CSS order, so the default grey
// only applies when the caller hasn't asked for a colour of its own.
const HAS_COLOR = /(^|\s)text-(gray|red|emerald|green|blue|amber|violet|purple|sky|pink|teal)-\d/;

export function Td({ children, className = "" }) {
  const color = HAS_COLOR.test(className) ? "" : "text-gray-800";
  return <td className={`px-4 py-3 text-sm ${color} whitespace-nowrap ${className}`}>{children}</td>;
}

export function EmptyRow({ colSpan, children }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-gray-500">
        {children}
      </td>
    </tr>
  );
}

const PILL = {
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  blue: "bg-blue-50 text-blue-700",
  purple: "bg-violet-50 text-violet-700",
  gray: "bg-gray-100 text-gray-600",
  sky: "bg-sky-50 text-sky-700",
  pink: "bg-pink-50 text-pink-700",
};

export function Pill({ tone = "gray", children, dot }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-md px-2.5 py-1 ${PILL[tone] || PILL.gray}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full bg-current`} />}
      {children}
    </span>
  );
}

export function Avatar({ name, src, size = 34 }) {
  const url = photoUrl(src);
  if (url) {
    return <img src={url} alt="" className="rounded-full object-cover flex-shrink-0 bg-gray-100" style={{ width: size, height: size }} />;
  }
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className="rounded-full bg-gray-200 text-gray-700 font-bold flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export function usePaged(rows, perPage = 10, resetKey) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [resetKey]);
  const pages = Math.max(1, Math.ceil(rows.length / perPage));
  const safe = Math.min(page, pages);
  const slice = useMemo(() => rows.slice((safe - 1) * perPage, safe * perPage), [rows, safe, perPage]);
  return { page: safe, pages, setPage, slice, start: rows.length ? (safe - 1) * perPage + 1 : 0, end: Math.min(safe * perPage, rows.length), total: rows.length };
}

export function Pagination({ paged, noun = "records" }) {
  const { page, pages, setPage, start, end, total } = paged;

  // 1 2 3 4 5 … 15 — the design's compact page strip.
  const nums = [];
  if (pages <= 7) {
    for (let i = 1; i <= pages; i++) nums.push(i);
  } else {
    const lo = Math.max(1, Math.min(page - 2, pages - 6));
    for (let i = lo; i < lo + 5; i++) nums.push(i);
    if (lo + 5 < pages) nums.push("…");
    nums.push(pages);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 border-t border-gray-100">
      <p className="text-sm text-gray-600">
        Showing {start} to {end} of {total} {noun}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:bg-gray-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {nums.map((n, i) =>
          n === "…" ? (
            <span key={`e${i}`} className="px-1 text-gray-400">
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => setPage(n)}
              className={`w-9 h-9 rounded-lg text-sm font-semibold ${
                n === page ? "bg-red-700 text-white" : "border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {n}
            </button>
          )
        )}
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= pages}
          onClick={() => setPage(page + 1)}
          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:bg-gray-50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row actions menu (the ⋮ button)
// ---------------------------------------------------------------------------

/**
 * @param items  [{ label, onClick, icon?, danger?, heading?, children? }]
 *   An item with `children` renders as a labelled group.
 */
export function RowMenu({ items }) {
  const [pos, setPos] = useState(null); // where the open menu sits, or null
  const btn = useRef(null);
  const menu = useRef(null);

  useEffect(() => {
    if (!pos) return undefined;
    const close = (e) => {
      if (menu.current?.contains(e.target) || btn.current?.contains(e.target)) return;
      setPos(null);
    };
    const onScroll = () => setPos(null);
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [pos]);

  // The menu is positioned against the viewport, not the table: tables scroll
  // horizontally (overflow) and would otherwise clip it — especially on the
  // last rows or a one-row table.
  const toggle = () => {
    if (pos) return setPos(null);
    const r = btn.current.getBoundingClientRect();
    const height = 60 + items.reduce((n, it) => n + (it.children ? it.children.length + 1 : 1), 0) * 36;
    const below = window.innerHeight - r.bottom;
    const up = below < height && r.top > below;
    setPos({ right: window.innerWidth - r.right, ...(up ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }) });
  };

  const run = (fn) => {
    setPos(null);
    fn();
  };

  return (
    <div className="inline-block">
      <button
        ref={btn}
        type="button"
        aria-label="More actions"
        aria-expanded={!!pos}
        onClick={toggle}
        className="w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 flex items-center justify-center"
      >
        <MoreVertical className="w-4 h-4 text-gray-700" />
      </button>
      {pos && (
        <div ref={menu} role="menu" style={{ position: "fixed", ...pos }} className="w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-[90] py-1.5 text-left">
          {items.map((it, i) =>
            it.children ? (
              <div key={i} className={i > 0 ? "border-t border-gray-100 mt-1 pt-1" : ""}>
                <p className="px-3 py-1.5 text-xs font-semibold text-gray-500 flex items-center gap-2">
                  {it.icon && <it.icon className="w-3.5 h-3.5" />}
                  {it.label}
                </p>
                {it.children.map((c, j) => (
                  <button
                    key={j}
                    type="button"
                    role="menuitem"
                    disabled={c.disabled}
                    onClick={() => run(c.onClick)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 flex items-center gap-2"
                  >
                    {c.dot && <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.dot }} />}
                    {c.label}
                  </button>
                ))}
              </div>
            ) : (
              <button
                key={i}
                type="button"
                role="menuitem"
                onClick={() => run(it.onClick)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${it.danger ? "text-red-600" : "text-gray-700"}`}
              >
                {it.icon && <it.icon className="w-4 h-4" />}
                {it.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export function Modal({ title, onClose, children, width = "max-w-2xl" }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-2xl w-full ${width} max-h-[90vh] overflow-y-auto shadow-2xl`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-700 text-2xl leading-none">
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, required, children, htmlFor }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-gray-800 mb-1.5">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {children}
    </div>
  );
}

export const inputCls =
  "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300";

// ---------------------------------------------------------------------------
// Download a table as CSV (the ledger's "Download" button)
// ---------------------------------------------------------------------------

export function downloadCsv(filename, header, rows) {
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------------------------------------------------------------------------
// Domain helpers shared by several screens
// ---------------------------------------------------------------------------

const KNOWN_CITIES = [
  ["Haridwar", ["haridwar", "jwalapur", "kankhal", "bhel", "ranipur", "shivalik", "bahadrabad", "sidcul", "jagjeetpur", "har ki pauri", "gurukul", "katarpur", "shyampur", "laksar", "jwalapur"]],
  ["Rudki", ["roorkee", "rudki", "rurki", "bhagwanpur", "manglaur"]],
  ["Rishikesh", ["rishikesh", "raiwala", "shyampur"]],
  ["Dehradun", ["dehradun", "doiwala"]],
];

/** Best-effort city from a free-text address. */
export function cityOf(address) {
  const a = String(address || "").toLowerCase();
  for (const [city, keys] of KNOWN_CITIES) {
    if (keys.some((k) => a.includes(k))) return city;
  }
  return "Others";
}

const SERVICE_LABELS = {
  "general-service": "General Service",
  "oil-change": "Oil Change",
  "brake-service": "Brake Repair",
  "chain-cleaning": "Chain Set Change",
  "complete-overhaul": "Complete Overhaul",
  maintenance: "Maintenance",
  inspection: "Engine Checkup",
  "emergency-repair": "Emergency Repair",
  "puncture-repair": "Tyre Puncture",
  "tyre-replace": "Tyre Replacement",
  "battery-change": "Battery Service",
  "starting-problem": "Starting Problem",
  "engine-repair": "Engine Repair",
  "electrical-repair": "Electrical Issue",
  "parts-inquiry": "Parts Inquiry",
};

export const serviceLabel = (v) =>
  SERVICE_LABELS[v] || (v ? String(v).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Service");

/** A bill line that is labour / a visit rather than a part. */
export function isServiceLine(line) {
  if (line?.part) return false;
  // Mechanics type these freely, so match the words that mean work done rather
  // than a part supplied ("Normal Service", "Starting Problem", "Puncture repair").
  return /visit|inspection|labou?r|service|servicing|problem|check ?-?up|repair|wash|charge|fitting|installation|tuning|adjust/i.test(
    line?.label || ""
  );
}

/** Parts value on a bill (lines that aren't labour/visit). */
export const partsTotal = (bill) =>
  (bill?.lines || []).filter((l) => !isServiceLine(l)).reduce((s, l) => s + (l.amount || 0), 0);
