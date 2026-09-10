import React, { useCallback, useEffect, useMemo, useState } from "react";
import { apiService } from "../routing/apiClient";

const API_BASE = "https://api.roadengo.com";

const STATUS_STYLE = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
  suspended: "bg-red-100 text-red-700",
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const EMPTY = {
  name: "",
  city: "",
  mobile: "",
  email: "",
  contactPerson: "",
  address: "",
  commissionPercent: "",
  status: "active",
  notes: "",
};

/**
 * Partners are the garages and franchises Roadengo works with in each city.
 * Bookings and revenue come from bookings actually tagged to the partner, so a
 * new partner honestly reads zero until work flows through them.
 */
const PartnersManager = ({ showNotification }) => {
  const [partners, setPartners] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiService.getPartners();
      setPartners(res.data?.partners || []);
      setSummary(res.data?.summary || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load partners.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setLogoFile(null);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name || "",
      city: p.city || "",
      mobile: p.mobile || "",
      email: p.email || "",
      contactPerson: p.contactPerson || "",
      address: p.address || "",
      commissionPercent: p.commissionPercent ?? "",
      status: p.status || "active",
      notes: p.notes || "",
    });
    setLogoFile(null);
    setShowForm(true);
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.city.trim() || !/^[0-9]{10}$/.test(form.mobile.trim())) {
      showNotification?.("Name, city and a 10-digit mobile are required.", "error");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
      if (logoFile) fd.append("logo", logoFile);

      if (editing) {
        await apiService.updatePartner(editing._id, fd);
        showNotification?.(`${form.name} updated.`, "success");
      } else {
        await apiService.createPartner(fd);
        showNotification?.(`${form.name} added as a partner.`, "success");
      }
      setShowForm(false);
      await load();
    } catch (err) {
      showNotification?.(err?.response?.data?.message || "Could not save the partner.", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Remove ${p.name}? This cannot be undone.`)) return;
    try {
      await apiService.deletePartner(p._id);
      showNotification?.(`${p.name} removed.`, "success");
      await load();
    } catch (err) {
      showNotification?.(err?.response?.data?.message || "Could not remove the partner.", "error");
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return partners.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      return [p.partnerId, p.name, p.city, p.mobile].filter(Boolean).some((f) =>
        String(f).toLowerCase().includes(q)
      );
    });
  }, [partners, search, statusFilter]);

  const cards = [
    { label: "Total Partners", value: summary?.totalPartners ?? 0, tone: "text-gray-900" },
    { label: "Total Cities", value: summary?.totalCities ?? 0, tone: "text-blue-700" },
    { label: "Active Partners", value: summary?.activePartners ?? 0, tone: "text-green-700" },
    { label: "Total Bookings", value: summary?.totalBookings ?? 0, tone: "text-purple-700" },
    { label: "Partner Revenue", value: money(summary?.partnerRevenue), tone: "text-red-700" },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Partners</h2>
          <p className="text-gray-500 text-sm mt-1">Garages and franchises working with Roadengo.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={load}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold px-5 py-2.5 rounded-lg"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={openAdd}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-lg"
          >
            + Add Partner
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{c.label}</p>
            <p className={`text-2xl font-bold mt-1 ${c.tone}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mt-6">
        <select
          aria-label="Filter partners by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2.5"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <input
          aria-label="Search partners"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ID, name, city or mobile"
          className="flex-1 min-w-[240px] border border-gray-300 rounded-lg px-4 py-2.5"
        />
      </div>

      {error && (
        <p className="mt-5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">{error}</p>
      )}

      {/* Partner list */}
      <div className="mt-5 overflow-x-auto border border-gray-200 rounded-xl bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              {["Partner ID", "Logo", "Name", "City", "Mobile", "Bookings", "Revenue", "Status", "Join Date", ""].map(
                (h) => (
                  <th key={h} className="text-left font-semibold px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-gray-500">
                  Loading partners…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-gray-500">
                  {partners.length === 0 ? "No partners yet — add your first one." : "No partners match this filter."}
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{p.partnerId}</td>
                  <td className="px-4 py-3">
                    {p.logo ? (
                      <img
                        src={`${API_BASE}${p.logo}`}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-500 font-bold flex items-center justify-center">
                        {(p.name || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    {p.contactPerson && <p className="text-gray-500">{p.contactPerson}</p>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{p.city}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <a href={`tel:${p.mobile}`} className="text-gray-700 hover:text-red-600">
                      {p.mobile}
                    </a>
                  </td>
                  <td className="px-4 py-3 font-semibold">{p.bookings}</td>
                  <td className="px-4 py-3 font-semibold whitespace-nowrap">{money(p.revenue)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-bold rounded-md px-2.5 py-1 ${STATUS_STYLE[p.status] || ""}`}>
                      {(p.status || "").toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">{formatDate(p.joinDate)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="text-blue-600 hover:text-blue-800 font-semibold mr-3"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(p)}
                      className="text-red-600 hover:text-red-800 font-semibold"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Add / edit */}
      {showForm && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
          onClick={() => !saving && setShowForm(false)}
        >
          <form
            onSubmit={save}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold text-gray-900">
              {editing ? `Edit ${editing.name}` : "Add a partner"}
            </h3>

            <div className="grid sm:grid-cols-2 gap-4 mt-5">
              <div>
                <label htmlFor="pt-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Partner name *
                </label>
                <input id="pt-name" value={form.name} onChange={set("name")} className="w-full border border-gray-300 rounded-lg px-3 py-2.5" />
              </div>
              <div>
                <label htmlFor="pt-city" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  City *
                </label>
                <input id="pt-city" value={form.city} onChange={set("city")} className="w-full border border-gray-300 rounded-lg px-3 py-2.5" />
              </div>
              <div>
                <label htmlFor="pt-mobile" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Mobile *
                </label>
                <input
                  id="pt-mobile"
                  inputMode="numeric"
                  value={form.mobile}
                  onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value.replace(/[^0-9]/g, "").slice(0, 10) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
                />
              </div>
              <div>
                <label htmlFor="pt-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email
                </label>
                <input id="pt-email" value={form.email} onChange={set("email")} className="w-full border border-gray-300 rounded-lg px-3 py-2.5" />
              </div>
              <div>
                <label htmlFor="pt-contact" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Contact person
                </label>
                <input id="pt-contact" value={form.contactPerson} onChange={set("contactPerson")} className="w-full border border-gray-300 rounded-lg px-3 py-2.5" />
              </div>
              <div>
                <label htmlFor="pt-comm" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Commission %
                </label>
                <input
                  id="pt-comm"
                  inputMode="decimal"
                  value={form.commissionPercent}
                  onChange={set("commissionPercent")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
                />
              </div>
              <div>
                <label htmlFor="pt-status" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Status
                </label>
                <select id="pt-status" value={form.status} onChange={set("status")} className="w-full border border-gray-300 rounded-lg px-3 py-2.5">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label htmlFor="pt-logo" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Logo
                </label>
                <input
                  id="pt-logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="pt-address" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Address
              </label>
              <textarea id="pt-address" rows={2} value={form.address} onChange={set("address")} className="w-full border border-gray-300 rounded-lg px-3 py-2.5" />
            </div>
            <div className="mt-4">
              <label htmlFor="pt-notes" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Notes
              </label>
              <textarea id="pt-notes" rows={2} value={form.notes} onChange={set("notes")} className="w-full border border-gray-300 rounded-lg px-3 py-2.5" />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl"
              >
                {saving ? "Saving…" : editing ? "Save changes" : "Add partner"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={saving}
                className="px-6 py-3 rounded-xl border border-gray-300 font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PartnersManager;
