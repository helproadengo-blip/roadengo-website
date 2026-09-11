import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  House, CalendarDays, UsersRound, Package, CreditCard, BookText, CirclePlus, ShoppingCart, BarChart3, Settings,
  Bell, ChevronDown, Menu, CalendarRange, CircleCheck, Ban, IndianRupee, Users, List, Clock, User, Truck, Wrench,
  BadgeCheck, LogOut,
} from "lucide-react";
import { apiService } from "../routing/apiClient";
import Sidebar from "../admin/Sidebar";
import {
  StatCard, DateRangePicker, rangeFor, previousRange, inRange, isToday, pctChange, money, photoUrl, Avatar,
  SelectBox,
} from "../admin/ui";
import { Donut, TrendChart, topN, dailyBuckets, bucketIndex } from "../admin/charts";
import { serviceLabel } from "../admin/ui";
import { ReportsView } from "../admin/ReportsPage";
import PaymentLedger from "./PaymentLedger";
import PaymentEntry from "./PaymentEntry";
import SpareOrder from "./SpareOrder";
import { PartnerBookings, PartnerMechanics, PartnerSpareParts, PartnerSubscription, PartnerSettings } from "./PartnerSections";

const ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: House },
  { key: "bookings", label: "Bookings", icon: CalendarDays },
  { key: "mechanics", label: "Mechanics", icon: UsersRound },
  { key: "spare-parts", label: "Spare Parts", icon: Package },
  { key: "subscription", label: "Subscription", icon: CreditCard },
  { key: "ledger", label: "Payment Ledger", icon: BookText },
  { key: "payment-entry", label: "Payment Entry", icon: CirclePlus },
  { key: "spare-order", label: "Spare Order", icon: ShoppingCart },
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: "settings", label: "Settings", icon: Settings },
];

const titleCase = (s) => String(s || "").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

/** Unified status for an appointment or an emergency. */
export function bookingStatus(b) {
  const s = b.status === "assigned" ? "confirmed" : b.status;
  return s || "pending";
}

export default function PartnerPanel() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const active = ITEMS.some((i) => i.key === params.get("tab")) ? params.get("tab") : "dashboard";
  const setActive = (k) => setParams(k === "dashboard" ? {} : { tab: k });

  const [data, setData] = useState({ partner: JSON.parse(localStorage.getItem("partnerData") || "null"), mechanics: [], bookings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState(() => rangeFor("month"));
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiService.getPartnerOverview();
      setData(res.data);
      localStorage.setItem("partnerData", JSON.stringify(res.data.partner));
    } catch (e) {
      setError(e?.response?.data?.message || "Could not load your garage data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const logout = () => {
    localStorage.removeItem("partnerToken");
    localStorage.removeItem("partnerData");
    navigate("/partner/login", { replace: true });
  };

  const partner = data.partner || {};
  const person = partner.contactPerson || titleCase(partner.name);
  const pendingCount = data.bookings.filter((b) => bookingStatus(b) === "pending").length;

  const brand = (
    <div className="flex flex-col items-center text-center px-4 pb-3">
      {partner.logo ? (
        <img src={photoUrl(partner.logo)} alt="" className="w-20 h-20 rounded-full object-cover bg-white border-4 border-white/20" />
      ) : (
        <span className="w-20 h-20 rounded-full bg-white text-red-700 text-3xl font-extrabold flex items-center justify-center">
          {(partner.name || "P").charAt(0)}
        </span>
      )}
      <p className="font-bold text-lg mt-2 leading-tight">{titleCase(partner.name)}</p>
      <p className="text-sm text-white/80">{titleCase(partner.city)}</p>
      <div className="w-full border-t border-white/15 mt-3" />
    </div>
  );

  const sectionProps = { data, range, reload: load, notify, partner };

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex">
      <Sidebar
        items={ITEMS}
        active={active}
        onSelect={setActive}
        user={{ name: person, role: "Partner" }}
        onLogout={logout}
        brand={brand}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="flex-1 min-w-0">
        <div className="md:hidden bg-[#c1121f] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <img src="/images/logo-sidebar.png" alt="RoadEngo" className="h-8" />
          <span className="w-6" />
        </div>

        <div className="px-3 sm:px-6 py-5 sm:py-6 max-w-[1600px] mx-auto">
          {/* Header row: title on the left, range + alerts + user on the right */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
            <div>
              {active === "dashboard" ? (
                <>
                  <h1 className="text-2xl font-bold text-gray-900">Welcome, {titleCase(partner.name)}!</h1>
                  <p className="text-sm text-gray-500 mt-1">Here&rsquo;s what&rsquo;s happening with your garage today.</p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900">{ITEMS.find((i) => i.key === active)?.label}</h1>
                  <p className="text-sm text-gray-500 mt-1">{SUBTITLES[active]}</p>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              {!["payment-entry", "spare-order", "settings", "subscription", "spare-parts"].includes(active) && (
                <DateRangePicker value={range} onChange={setRange} />
              )}
              <button
                type="button"
                onClick={() => setActive("bookings")}
                aria-label={`${pendingCount} pending bookings`}
                className="relative w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm"
              >
                <Bell className="w-5 h-5 text-gray-700" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenu((o) => !o)}
                  className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl pl-2 pr-3 py-1.5 shadow-sm"
                >
                  <span className="w-9 h-9 rounded-full bg-[#1f2937] text-white text-sm font-bold flex items-center justify-center">
                    {person.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                  <span className="text-left hidden sm:block">
                    <span className="block text-sm font-semibold text-gray-900 leading-tight">{person}</span>
                    <span className="block text-xs text-gray-500">Partner</span>
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                {userMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1.5">
                    <button type="button" onClick={() => { setUserMenu(false); setActive("settings"); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                      <Settings className="w-4 h-4" /> Settings
                    </button>
                    <button type="button" onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <span>{error}</span>
              <button type="button" onClick={load} className="font-semibold underline">Retry</button>
            </div>
          )}

          {loading && !data.bookings.length ? (
            <p className="text-gray-500 py-16 text-center">Loading your garage…</p>
          ) : (
            <>
              {active === "dashboard" && <Dashboard {...sectionProps} />}
              {active === "bookings" && <PartnerBookings {...sectionProps} />}
              {active === "mechanics" && <PartnerMechanics {...sectionProps} />}
              {active === "spare-parts" && <PartnerSpareParts {...sectionProps} onOrder={() => setActive("spare-order")} />}
              {active === "subscription" && <PartnerSubscription {...sectionProps} />}
              {active === "ledger" && <PaymentLedger {...sectionProps} />}
              {active === "payment-entry" && <PaymentEntry {...sectionProps} />}
              {active === "spare-order" && <SpareOrder {...sectionProps} />}
              {active === "reports" && (
                <ReportsView
                  bookings={data.bookings}
                  bills={data.bookings.filter((b) => b.bill).map((b) => ({ ...b.bill, appointment: b }))}
                  range={range}
                />
              )}
              {active === "settings" && <PartnerSettings {...sectionProps} />}
            </>
          )}
        </div>
      </div>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-[120] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold ${
            toast.type === "error" ? "bg-red-600" : "bg-emerald-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

const SUBTITLES = {
  bookings: "Every booking handled by your garage's mechanics.",
  mechanics: "Mechanics working for your garage.",
  "spare-parts": "Roadengo's spare-parts catalogue and prices.",
  subscription: "Roadengo subscription plans you can offer your customers.",
  ledger: "Track all payments, dues and transactions for your garage.",
  "payment-entry": "Record payments received or made for your garage.",
  "spare-order": "Create and manage spare parts orders for your garage.",
  reports: "Analytics and insights about your garage.",
  settings: "Your garage profile and login.",
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

function Dashboard({ data, range }) {
  const { bookings, mechanics } = data;
  const [trendWindow, setTrendWindow] = useState("7d");

  const revenueOf = (list) => list.reduce((s, b) => s + (b.bill?.total || 0), 0);
  const when = (b) => b.serviceDate || b.createdAt;

  const period = (r) => {
    const inR = bookings.filter((b) => inRange(when(b), r));
    return {
      total: inR.length,
      completed: inR.filter((b) => bookingStatus(b) === "completed").length,
      cancelled: inR.filter((b) => bookingStatus(b) === "cancelled").length,
      revenue: revenueOf(inR.filter((b) => bookingStatus(b) === "completed")),
    };
  };
  const now = period(range);
  const before = period(previousRange(range));
  const trend = (a, b) => (range.key === "all" ? undefined : pctChange(a, b));

  const todays = bookings.filter((b) => isToday(when(b)));
  const today = {
    total: todays.length,
    completed: todays.filter((b) => bookingStatus(b) === "completed").length,
    cancelled: todays.filter((b) => bookingStatus(b) === "cancelled").length,
    revenue: revenueOf(todays.filter((b) => bookingStatus(b) === "completed")),
  };

  const available = mechanics.filter((m) => m.isActive !== false && m.availability === "available").length;

  // Job pipeline. The backend has no separate "on the way" state, so a job
  // assigned for today counts as on the way until the mechanic starts it.
  const st = (s) => bookings.filter((b) => bookingStatus(b) === s);
  const pipeline = [
    { label: "Active Bookings", value: bookings.filter((b) => !["completed", "cancelled"].includes(bookingStatus(b))).length, icon: List, tone: "bg-red-500", tint: "bg-red-50" },
    { label: "Pending Bookings", value: st("pending").length, icon: Clock, tone: "bg-amber-500", tint: "bg-amber-50" },
    { label: "Assigned Bookings", value: st("confirmed").length, icon: User, tone: "bg-blue-500", tint: "bg-blue-50" },
    { label: "On the Way", value: st("confirmed").filter((b) => isToday(when(b))).length, icon: Truck, tone: "bg-violet-500", tint: "bg-violet-50" },
    { label: "Service in Progress", value: st("in-progress").length, icon: Wrench, tone: "bg-emerald-500", tint: "bg-emerald-50" },
    { label: "Service Completed", value: st("completed").length, icon: BadgeCheck, tone: "bg-teal-500", tint: "bg-teal-50" },
  ];

  const trendRange = trendWindow === "7d" ? rangeFor("7d") : trendWindow === "30d" ? rangeFor("30d") : range;
  const buckets = dailyBuckets(trendRange);
  const perDay = buckets.map(() => 0);
  bookings.forEach((b) => {
    const i = bucketIndex(buckets, when(b));
    if (i >= 0) perDay[i]++;
  });

  const byService = useMemo(() => {
    const m = {};
    bookings.filter((b) => inRange(when(b), range)).forEach((b) => {
      const k = b.serviceType ? serviceLabel(b.serviceType) : "Emergency Repair";
      m[k] = (m[k] || 0) + 1;
    });
    return topN(Object.entries(m).map(([label, value]) => ({ label, value })), 5);
  }, [bookings, range]);

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
        <StatCard variant="soft" icon={CalendarRange} tone="red" label="Total Bookings" value={now.total} trend={trend(now.total, before.total)} />
        <StatCard variant="soft" icon={CircleCheck} tone="green" label="Completed Bookings" value={now.completed} trend={trend(now.completed, before.completed)} />
        <StatCard variant="soft" icon={Ban} tone="red" label="Total Cancel Bookings" value={now.cancelled} trend={trend(now.cancelled, before.cancelled)} />
        <StatCard variant="soft" icon={IndianRupee} tone="purple" label="Total Revenue" value={money(now.revenue)} trend={trend(now.revenue, before.revenue)} />
        <StatCard variant="soft" icon={Users} tone="blue" label="Total Mechanics" value={mechanics.length} sub="linked to your garage" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <StatCard variant="soft" icon={CalendarDays} tone="blue" label="Today Bookings" value={today.total} />
        <StatCard variant="soft" icon={CircleCheck} tone="green" label="Today Completed Bookings" value={today.completed} />
        <StatCard variant="soft" icon={Ban} tone="red" label="Today Cancel Bookings" value={today.cancelled} />
        <StatCard variant="soft" icon={IndianRupee} tone="purple" label="Today Revenue" value={money(today.revenue)} />
        <StatCard variant="soft" icon={Users} tone="amber" label="Available Mechanics" value={available} sub={`(Out of ${mechanics.length})`} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <h3 className="font-bold text-gray-900 mb-3">Job Status Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {pipeline.map((p) => (
            <div key={p.label} className={`rounded-xl ${p.tint} p-3 flex items-center gap-3`}>
              <span className={`w-10 h-10 rounded-xl ${p.tone} flex items-center justify-center flex-shrink-0`}>
                <p.icon className="w-5 h-5 text-white" />
              </span>
              <span>
                <span className="block text-sm text-gray-700">{p.label}</span>
                <span className="block text-xl font-bold text-gray-900">{p.value}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 text-lg">Booking Trend</h3>
            <SelectBox
              label="Trend window"
              value={trendWindow}
              onChange={setTrendWindow}
              options={[
                { value: "7d", label: "This Week" },
                { value: "30d", label: "Last 30 Days" },
                { value: "range", label: "Selected Range" },
              ]}
            />
          </div>
          <TrendChart labels={buckets.map((b) => b.label)} series={[{ name: "Bookings", color: "#dc2626", values: perDay }]} money={false} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 text-lg mb-3">Bookings by Service Type</h3>
          <Donut data={byService} />
        </div>
      </div>
    </div>
  );
}
