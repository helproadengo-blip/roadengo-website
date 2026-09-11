import React, { useEffect, useMemo, useState } from "react";
import { Users, UserCheck, UserCog, UserMinus, UserX, Plus, Star, Phone, Eye, Trash2, Power } from "lucide-react";
import { apiService } from "../routing/apiClient";
import {
  PageHeader, PrimaryButton, StatCard, FilterBar, SearchInput, SelectBox, TableCard, Th, Td,
  EmptyRow, Pill, Avatar, Pagination, usePaged, RowMenu, money, isToday,
} from "./ui";

// A live location ping within this window means the app is open right now.
const ONLINE_WINDOW_MS = 15 * 60 * 1000;

/**
 * The status shown for a mechanic. The backend only stores
 * available / busy / offline, so "Online" is an available mechanic whose app
 * has sent a location in the last few minutes, and "Inactive" is an account
 * the admin has switched off.
 */
export function mechanicStatus(m) {
  if (m.isActive === false) return { key: "inactive", label: "Inactive", tone: "red" };
  const a = m.availability || "offline";
  if (a === "busy") return { key: "busy", label: "Busy", tone: "amber" };
  if (a === "available") {
    const seen = m.currentLocation?.lastUpdated ? new Date(m.currentLocation.lastUpdated).getTime() : 0;
    if (Date.now() - seen < ONLINE_WINDOW_MS) return { key: "online", label: "Online", tone: "green" };
    return { key: "available", label: "Available", tone: "blue" };
  }
  return { key: "offline", label: "Offline", tone: "gray" };
}

const SORTS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "name", label: "Name A–Z" },
  { value: "jobs", label: "Most Jobs" },
  { value: "revenue", label: "Top Revenue" },
  { value: "rating", label: "Top Rated" },
];

export default function MechanicsPage({ mechanics, appointments, emergencies, onAddMechanic, onView, onRefresh, showNotification }) {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("All Cities");
  const [status, setStatus] = useState("All Status");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    apiService.getBills().then((r) => setBills(r.data?.bills || [])).catch(() => setBills([]));
  }, []);

  // Jobs and revenue per mechanic, from real bookings and bills.
  const perf = useMemo(() => {
    const map = {};
    const bump = (id, key, n = 1) => {
      if (!id) return;
      const k = String(id);
      map[k] = map[k] || { today: 0, total: 0, revenue: 0 };
      map[k][key] += n;
    };
    [...appointments, ...emergencies].forEach((b) => {
      const id = b.assignedMechanic?._id || b.assignedMechanic;
      if (!id || b.status === "cancelled") return;
      bump(id, "total");
      if (isToday(b.serviceDate || b.createdAt)) bump(id, "today");
    });
    bills.forEach((b) => bump(b.mechanic?._id || b.mechanic, "revenue", b.total || 0));
    return map;
  }, [appointments, emergencies, bills]);

  const rows = useMemo(
    () =>
      mechanics.map((m) => ({
        ...m,
        status: mechanicStatus(m),
        city: m.location?.city || "—",
        ...(perf[String(m._id)] || { today: 0, total: 0, revenue: 0 }),
      })),
    [mechanics, perf]
  );

  const counts = useMemo(() => {
    const c = { total: rows.length, active: 0, available: 0, busy: 0, inactive: 0 };
    rows.forEach((r) => {
      if (r.status.key === "inactive") c.inactive++;
      if (["online", "available", "busy"].includes(r.status.key)) c.active++;
      if (["online", "available"].includes(r.status.key)) c.available++;
      if (r.status.key === "busy") c.busy++;
    });
    return c;
  }, [rows]);

  const cities = useMemo(
    () => ["All Cities", ...Array.from(new Set(rows.map((r) => r.city).filter((c) => c && c !== "—"))).sort()],
    [rows]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (city !== "All Cities" && r.city !== city) return false;
      if (status !== "All Status" && r.status.label !== status) return false;
      if (!q) return true;
      return [r.name, r.phone, r.mechanicId].filter(Boolean).some((f) => String(f).toLowerCase().includes(q));
    });
    const by = {
      newest: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      oldest: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
      name: (a, b) => (a.name || "").localeCompare(b.name || ""),
      jobs: (a, b) => b.total - a.total,
      revenue: (a, b) => b.revenue - a.revenue,
      rating: (a, b) => (b.rating || 0) - (a.rating || 0),
    };
    return [...list].sort(by[sort]);
  }, [rows, search, city, status, sort]);

  const paged = usePaged(filtered, 10, `${search}|${city}|${status}|${sort}`);

  const toggleActive = async (m) => {
    try {
      await apiService.updateMechanic(m._id, { isActive: m.isActive === false });
      showNotification?.(`${m.name} is now ${m.isActive === false ? "active" : "inactive"}.`, "success");
      onRefresh?.();
    } catch (e) {
      showNotification?.(e?.response?.data?.message || "Could not update the mechanic.", "error");
    }
  };

  const remove = async (m) => {
    if (!window.confirm(`Delete ${m.name}? Their past jobs stay on record.`)) return;
    try {
      await apiService.deleteMechanic(m._id);
      showNotification?.(`${m.name} deleted.`, "success");
      onRefresh?.();
    } catch (e) {
      showNotification?.(e?.response?.data?.message || "Could not delete the mechanic.", "error");
    }
  };

  return (
    <div>
      <PageHeader title="Mechanics" subtitle="Manage your mechanics, view details, track performance and status." />

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
        <StatCard icon={Users} tone="gray" label="Total Mechanics" value={counts.total} />
        <StatCard icon={UserCheck} tone="green" label="Active Mechanics" value={counts.active} />
        <StatCard icon={UserCog} tone="blue" label="Available Mechanics" value={counts.available} />
        <StatCard icon={UserMinus} tone="amber" label="Busy Mechanics" value={counts.busy} />
        <StatCard icon={UserX} tone="red" label="Inactive Mechanics" value={counts.inactive} />
        <button
          type="button"
          onClick={onAddMechanic}
          className="col-span-2 lg:col-span-1 flex items-center justify-center gap-2 rounded-2xl bg-red-700 hover:bg-red-800 text-white font-semibold text-base shadow-sm min-h-[76px]"
        >
          <Plus className="w-6 h-6" />
          Add Mechanic
        </button>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, mobile number or ID..." />
        <SelectBox label="City" value={city} onChange={setCity} options={cities} />
        <SelectBox
          label="Status"
          value={status}
          onChange={setStatus}
          options={["All Status", "Online", "Available", "Busy", "Offline", "Inactive"]}
        />
        <SelectBox label="Sort" value={sort} onChange={setSort} options={SORTS} />
      </FilterBar>

      <TableCard footer={<Pagination paged={paged} noun="mechanics" />}>
        <table className="min-w-full">
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Name</Th>
              <Th>ID</Th>
              <Th>Phone</Th>
              <Th>City</Th>
              <Th>Status</Th>
              <Th className="text-center">Today&rsquo;s Jobs</Th>
              <Th className="text-center">Total Jobs</Th>
              <Th className="text-right">Total Revenue</Th>
              <Th>Rating</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.slice.length === 0 && <EmptyRow colSpan={11}>No mechanics match these filters.</EmptyRow>}
            {paged.slice.map((m, i) => (
              <tr key={m._id} className="hover:bg-gray-50">
                <Td className="text-gray-500">{paged.start + i}</Td>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} src={m.location?.photo} />
                    <span className="font-medium text-gray-900">{m.name}</span>
                  </div>
                </Td>
                <Td className="text-gray-600">{m.mechanicId || "—"}</Td>
                <Td>{m.phone ? `+91 ${m.phone}` : "—"}</Td>
                <Td className="capitalize">{String(m.city).toLowerCase()}</Td>
                <Td>
                  <Pill tone={m.status.tone} dot>
                    {m.status.label}
                  </Pill>
                </Td>
                <Td className="text-center">{m.today}</Td>
                <Td className="text-center">{m.total}</Td>
                <Td className="text-right">{money(m.revenue)}</Td>
                <Td>
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {m.rating ? Number(m.rating).toFixed(1) : "—"}
                  </span>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onView(m._id)}
                      className="px-4 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-800"
                    >
                      View
                    </button>
                    <RowMenu
                      items={[
                        { label: "View profile", icon: Eye, onClick: () => onView(m._id) },
                        { label: "Call", icon: Phone, onClick: () => (window.location.href = `tel:${m.phone}`) },
                        {
                          label: m.isActive === false ? "Mark active" : "Mark inactive",
                          icon: Power,
                          onClick: () => toggleActive(m),
                        },
                        { label: "Delete", icon: Trash2, danger: true, onClick: () => remove(m) },
                      ]}
                    />
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}
