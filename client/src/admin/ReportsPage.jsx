import React, { useEffect, useMemo, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { apiService } from "../routing/apiClient";
import { PageHeader, DateRangePicker, rangeFor, previousRange, inRange, pctChange, money, cityOf, serviceLabel, isServiceLine } from "./ui";
import { Donut, HBars, TrendChart, topN, dailyBuckets, bucketIndex } from "./charts";

const CITY_COLORS = ["#dc2626", "#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#9ca3af"];

/** Normalise free-typed part names so "engine oil", "Engine Oil 1L" group together. */
function partKey(label) {
  const l = String(label || "").trim().toLowerCase();
  const known = [
    ["Engine Oil", /oil/],
    ["Brake Pad", /brake/],
    ["Air Filter", /air ?filter/],
    ["Tyre", /tyre|tire|tube/],
    ["Battery", /battery/],
    ["Chain Set", /chain/],
    ["Spark Plug", /plug/],
    ["Clutch", /clutch/],
    ["Seat Cover", /seat/],
    ["Bulb / Light", /bulb|light|indicator/],
    ["Cable", /cable|wire/],
  ];
  const hit = known.find(([, re]) => re.test(l));
  if (hit) return hit[0];
  return l ? l.replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 22) : "Other";
}

/** Reports over bookings and bills. Used by the admin panel and (scoped) by partners. */
export function ReportsView({ bookings, bills, range }) {
  const booked = useMemo(() => bookings.filter((b) => b.status !== "cancelled" && inRange(b.serviceDate || b.createdAt, range)), [bookings, range]);

  const byService = useMemo(() => {
    const m = {};
    booked.forEach((b) => {
      const k = b.serviceType ? serviceLabel(b.serviceType) : b.issueDescription ? "Emergency Repair" : "Others";
      m[k] = (m[k] || 0) + 1;
    });
    return topN(Object.entries(m).map(([label, value]) => ({ label, value })), 6);
  }, [booked]);

  const byCity = useMemo(() => {
    const m = {};
    booked.forEach((b) => {
      const k = cityOf(b.address || b.location);
      m[k] = (m[k] || 0) + 1;
    });
    const entries = Object.entries(m).map(([label, value]) => ({ label, value }));
    // Keep "Others" last whatever its size.
    const others = entries.filter((e) => e.label === "Others");
    return [...entries.filter((e) => e.label !== "Others").sort((a, b) => b.value - a.value), ...others];
  }, [booked]);

  const billsIn = useMemo(() => bills.filter((b) => inRange(b.createdAt, range)), [bills, range]);

  const partsSales = useMemo(() => {
    const m = {};
    billsIn.forEach((b) =>
      (b.lines || []).forEach((l) => {
        if (isServiceLine(l)) return;
        const k = partKey(l.label);
        m[k] = (m[k] || 0) + (l.quantity || 1);
      })
    );
    return topN(Object.entries(m).map(([label, value]) => ({ label, value })), 7);
  }, [billsIn]);

  const revenue = useMemo(() => {
    const split = (list) => {
      let service = 0;
      let parts = 0;
      list.forEach((b) => {
        const lineSum = (b.lines || []).reduce((s, l) => s + (l.amount || 0), 0) || 1;
        // Spread the bill-level discount across its lines so the two halves
        // still add up to what was actually charged.
        const scale = (b.total || 0) / lineSum;
        (b.lines || []).forEach((l) => {
          if (isServiceLine(l)) service += (l.amount || 0) * scale;
          else parts += (l.amount || 0) * scale;
        });
      });
      return { service, parts, total: service + parts };
    };

    const buckets = dailyBuckets(range);
    const svc = buckets.map(() => 0);
    const prt = buckets.map(() => 0);
    billsIn.forEach((b) => {
      const i = bucketIndex(buckets, b.createdAt);
      if (i < 0) return;
      const s = split([b]);
      svc[i] += s.service;
      prt[i] += s.parts;
    });

    const prevRange = previousRange(range);
    return {
      labels: buckets.map((b) => b.label),
      service: svc,
      parts: prt,
      total: svc.map((v, i) => v + prt[i]),
      now: split(billsIn),
      before: split(bills.filter((b) => inRange(b.createdAt, prevRange))),
    };
  }, [billsIn, bills, range]);

  const showTrend = range.key !== "all";
  const Tile = ({ color, label, value, before }) => {
    const t = pctChange(value, before);
    return (
      <div className="bg-gray-50 rounded-xl p-3.5">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span className="w-3 h-3 rounded" style={{ background: color }} />
          {label}
        </div>
        <p className="text-xl font-bold text-gray-900 mt-1">{money(value)}</p>
        {showTrend && t !== null && (
          <p className={`text-xs font-semibold flex items-center gap-1 ${t >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {t >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {t >= 0 ? "+" : ""}
            {t}% <span className="text-gray-500 font-normal">vs previous period</span>
          </p>
        )}
      </div>
    );
  };

  const Card = ({ title, right, children }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card title="Bookings by Service Type" right={<span className="text-sm text-gray-600">Total Bookings: <b className="text-gray-900">{booked.length}</b></span>}>
        <Donut data={byService} />
      </Card>
      <Card title="Bookings by City" right={<span className="text-sm text-gray-600">Total Bookings: <b className="text-gray-900">{booked.length}</b></span>}>
        <Donut data={byCity} colors={CITY_COLORS} />
      </Card>
      <Card
        title="Parts Sales by Item"
        right={<span className="text-sm text-gray-600">Total Parts Sales: <b className="text-gray-900">{partsSales.reduce((s, p) => s + p.value, 0)}</b></span>}
      >
        <HBars data={partsSales} />
      </Card>
      <Card
        title="Revenue Trend"
        right={
          <div className="flex flex-wrap gap-3 text-xs text-gray-600">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Service Revenue</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" />Parts Revenue</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600" />Total Revenue</span>
          </div>
        }
      >
        <TrendChart
          labels={revenue.labels}
          series={[
            { name: "Total Revenue", color: "#dc2626", values: revenue.total },
            { name: "Service Revenue", color: "#10b981", values: revenue.service },
            { name: "Parts Revenue", color: "#2563eb", values: revenue.parts },
          ]}
        />
        <div className="grid grid-cols-3 gap-3 mt-3">
          <Tile color="#dc2626" label="Total Revenue" value={revenue.now.total} before={revenue.before.total} />
          <Tile color="#10b981" label="Service Revenue" value={revenue.now.service} before={revenue.before.service} />
          <Tile color="#2563eb" label="Parts Revenue" value={revenue.now.parts} before={revenue.before.parts} />
        </div>
      </Card>
    </div>
  );
}

export default function ReportsPage({ appointments, emergencies }) {
  const [range, setRange] = useState(() => rangeFor("month"));
  const [bills, setBills] = useState([]);

  useEffect(() => {
    apiService.getBills().then((r) => setBills(r.data?.bills || [])).catch(() => setBills([]));
  }, []);

  const bookings = useMemo(() => [...appointments, ...emergencies], [appointments, emergencies]);

  return (
    <div>
      <PageHeader title="Reports" subtitle="Analytics and insights about your business">
        <DateRangePicker value={range} onChange={setRange} />
      </PageHeader>
      <ReportsView bookings={bookings} bills={bills} range={range} />
    </div>
  );
}
