import React, { useMemo, useState } from "react";
import { STATUS } from "../routing/apiClient";

const PAGE_SIZE = 10;

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function bookingIdOf(item) {
  return `BK-${(item._id || "").slice(-4).toUpperCase()}`;
}

function paymentStatusOf(item) {
  if (item.status === "cancelled") return "—";
  if (item.status === "completed") return item.cost ? "Paid" : "Pending";
  return "Pending";
}

const STATUS_BADGE = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  "in-progress": "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const PAYMENT_BADGE = {
  Paid: "bg-green-100 text-green-800",
  Pending: "bg-orange-100 text-orange-800",
  "—": "bg-gray-100 text-gray-500",
};

export default function AllBookingsTable({ appointments = [], emergencies = [], onViewBill }) {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const a = appointments.map((x) => ({ ...x, isEmergency: false, serviceTypeLabel: x.serviceType || "General Service" }));
    const e = emergencies.map((x) => ({
      ...x,
      isEmergency: true,
      address: x.location,
      serviceTypeLabel: "Emergency Service",
    }));
    return [...a, ...e].sort((x, y) => new Date(y.createdAt || 0) - new Date(x.createdAt || 0));
  }, [appointments, emergencies]);

  const serviceTypes = useMemo(() => {
    const set = new Set(rows.map((r) => r.serviceTypeLabel).filter(Boolean));
    return Array.from(set);
  }, [rows]);

  const stats = useMemo(() => {
    const total = rows.length;
    const completed = rows.filter((r) => r.status === "completed").length;
    const pending = rows.filter((r) => r.status === "pending").length;
    const assigned = rows.filter((r) => r.status === "confirmed" || r.status === "in-progress").length;
    const cancelled = rows.filter((r) => r.status === "cancelled").length;
    const pct = (n) => (total ? `${((n / total) * 100).toFixed(2)}%` : "0%");
    return [
      { label: "Total Bookings", value: total, sub: "All Time", icon: "📅", color: "text-blue-600", bg: "bg-blue-100" },
      { label: "Completed", value: completed, sub: pct(completed), icon: "✅", color: "text-green-600", bg: "bg-green-100" },
      { label: "Pending", value: pending, sub: pct(pending), icon: "⏱️", color: "text-orange-600", bg: "bg-orange-100" },
      { label: "Assigned", value: assigned, sub: pct(assigned), icon: "👤", color: "text-purple-600", bg: "bg-purple-100" },
      { label: "Cancelled", value: cancelled, sub: pct(cancelled), icon: "❌", color: "text-red-600", bg: "bg-red-100" },
    ];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q) {
        const hay = `${bookingIdOf(r)} ${r.name || ""} ${r.phone || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (dateFrom && new Date(r.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(r.createdAt) > new Date(`${dateTo}T23:59:59`)) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (serviceFilter !== "all" && r.serviceTypeLabel !== serviceFilter) return false;
      if (paymentFilter !== "all" && paymentStatusOf(r) !== paymentFilter) return false;
      return true;
    });
  }, [rows, search, dateFrom, dateTo, statusFilter, serviceFilter, paymentFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setStatusFilter("all");
    setServiceFilter("all");
    setPaymentFilter("all");
    setPage(1);
  };

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-lg shadow border border-gray-100 p-4 flex items-center gap-3">
            <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${s.bg}`}>{s.icon}</span>
            <div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs font-medium text-gray-600">{s.label}</p>
              <p className="text-[10px] text-gray-400">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-100 p-4 mb-4 grid sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
        <div className="lg:col-span-2">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Search Booking</label>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Booking ID, Name or Mobile…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">From</label>
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">To</label>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Status</label>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="all">All Status</option>
            <option value={STATUS.PENDING}>Pending</option>
            <option value={STATUS.CONFIRMED}>Assigned</option>
            <option value={STATUS.IN_PROGRESS}>In Progress</option>
            <option value={STATUS.COMPLETED}>Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Service Type</label>
          <select value={serviceFilter} onChange={(e) => { setServiceFilter(e.target.value); setPage(1); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="all">All Service</option>
            {serviceTypes.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Payment Status</label>
            <select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="all">All Payment Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <button onClick={resetFilters} className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 whitespace-nowrap">
            ↺ Reset
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Booking ID", "Customer Name", "Mobile Number", "Vehicle", "Service Type", "Address", "Booking Time", "Scheduled Time", "Bill Amount", "Payment Status", "Status", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pageRows.map((r) => {
                const payment = paymentStatusOf(r);
                return (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-red-600">{bookingIdOf(r)}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{r.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{r.phone}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{r.bikeModel || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{r.serviceTypeLabel}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{r.address}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-xs">{formatDateTime(r.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-xs">
                      {r.isEmergency ? "ASAP" : r.serviceDate ? `${formatDateTime(r.serviceDate).split(",")[0]} ${r.serviceTime || ""}` : "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-900">₹{r.cost || 0}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${PAYMENT_BADGE[payment]}`}>{payment}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_BADGE[r.status] || "bg-gray-100 text-gray-700"}`}>
                        {(r.status || "").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => onViewBill && onViewBill(r)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg px-2 py-1"
                      >
                        View Bill
                      </button>
                    </td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-gray-400 text-sm">No bookings match these filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} bookings
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg border border-gray-200 text-sm disabled:opacity-40"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .reduce((acc, n, idx, arr) => {
                if (idx > 0 && n - arr[idx - 1] > 1) acc.push("…");
                acc.push(n);
                return acc;
              }, [])
              .map((n, i) =>
                n === "…" ? (
                  <span key={`e${i}`} className="px-1 text-gray-400 text-sm">…</span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded-lg text-sm font-semibold ${n === page ? "bg-red-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                  >
                    {n}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg border border-gray-200 text-sm disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
