import React, { useCallback, useEffect, useMemo, useState } from "react";
import { apiService } from "../routing/apiClient";

const STATUSES = ["pending", "active", "expired", "cancelled"];

const STATUS_STYLE = {
  active: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  expired: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

/**
 * Admin view of subscriptions. A subscription is created as `pending` when the
 * customer signs up; marking it `active` here is what starts the 12 months, so
 * only do it once the payment is actually confirmed.
 */
const SubscriptionsManager = ({ showNotification }) => {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiService.getSubscriptions();
      setSubs(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load subscriptions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (sub, status) => {
    if (status === sub.status) return;
    if (
      status === "active" &&
      !window.confirm(
        `Activate ${sub.name}'s plan? This starts the ${sub.durationMonths}-month validity from today. Only do this once the ₹${sub.price} payment is confirmed.`
      )
    ) {
      return;
    }
    setSavingId(sub._id);
    try {
      const res = await apiService.updateSubscription(sub._id, { status });
      setSubs((list) => list.map((s) => (s._id === sub._id ? res.data.subscription : s)));
      showNotification?.(`Subscription #${sub.subscriptionNumber} marked ${status}.`, "success");
    } catch (err) {
      showNotification?.(err?.response?.data?.message || "Could not update the subscription.", "error");
    } finally {
      setSavingId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subs.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!q) return true;
      return [s.name, s.phone, s.vehicleNumber, String(s.subscriptionNumber)]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q));
    });
  }, [subs, statusFilter, search]);

  const counts = useMemo(() => {
    const c = { all: subs.length };
    STATUSES.forEach((s) => {
      c[s] = subs.filter((x) => x.status === s).length;
    });
    return c;
  }, [subs]);

  const revenue = useMemo(
    () => subs.filter((s) => s.status === "active").reduce((sum, s) => sum + (s.price || 0), 0),
    [subs]
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Subscriptions</h2>
          <p className="text-gray-500 text-sm mt-1">
            Confirm the payment, then mark a plan active to start its validity.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="bg-gray-900 hover:bg-black text-white font-semibold px-5 py-2.5 rounded-lg"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
        {[
          { label: "Total", value: counts.all },
          { label: "Pending", value: counts.pending },
          { label: "Active", value: counts.active },
          { label: "Expired", value: counts.expired },
          { label: "Active revenue", value: `₹${revenue.toLocaleString("en-IN")}` },
        ].map((c) => (
          <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{c.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mt-6">
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2.5"
        >
          <option value="all">All statuses ({counts.all})</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)} ({counts[s]})
            </option>
          ))}
        </select>
        <input
          aria-label="Search subscriptions"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, phone, vehicle or number"
          className="flex-1 min-w-[240px] border border-gray-300 rounded-lg px-4 py-2.5"
        />
      </div>

      {error && (
        <p className="mt-5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">{error}</p>
      )}

      <div className="mt-5 overflow-x-auto border border-gray-200 rounded-xl bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              {["#", "Customer", "Vehicle", "Plan", "Amount", "Created", "Valid till", "Status", "Action"].map((h) => (
                <th key={h} className="text-left font-semibold px-4 py-3 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-gray-500">
                  Loading subscriptions…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-gray-500">
                  No subscriptions match this filter.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((s) => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{s.subscriptionNumber}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{s.name}</p>
                    <a href={`tel:${s.phone}`} className="text-gray-500 hover:text-red-600">
                      {s.phone}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{s.vehicleNumber}</p>
                    {s.vehicleModel && <p className="text-gray-500">{s.vehicleModel}</p>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{s.planName}</td>
                  <td className="px-4 py-3 font-semibold whitespace-nowrap">₹{s.price}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">{formatDate(s.createdAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">{formatDate(s.expiresAt)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[11px] font-bold rounded-md px-2.5 py-1 ${STATUS_STYLE[s.status] || ""}`}
                    >
                      {s.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      aria-label={`Change status for subscription ${s.subscriptionNumber}`}
                      value={s.status}
                      disabled={savingId === s._id}
                      onChange={(e) => changeStatus(s, e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 disabled:opacity-50"
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st[0].toUpperCase() + st.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubscriptionsManager;
