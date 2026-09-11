import React, { useEffect, useMemo, useState } from "react";
import { Star, ShoppingCart, KeyRound, Check } from "lucide-react";
import { apiService } from "../routing/apiClient";
import {
  FilterBar, SearchInput, SelectBox, ClearButton, TableCard, Th, Td, EmptyRow, Pill, Avatar, Pagination,
  usePaged, money, money2, fmtDate, inRange, serviceLabel, Field, inputCls, photoUrl,
} from "../admin/ui";
import { mechanicStatus } from "../admin/MechanicsPage";

const titleCase = (s) => String(s || "").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const BOOKING_STATUS = {
  pending: ["amber", "Pending"],
  confirmed: ["blue", "Assigned"],
  assigned: ["blue", "Assigned"],
  "in-progress": ["purple", "In Progress"],
  completed: ["green", "Completed"],
  cancelled: ["red", "Cancelled"],
};

// ---------------------------------------------------------------------------

export function PartnerBookings({ data, range }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Status");
  const [kind, setKind] = useState("All Types");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.bookings
      .filter((b) => inRange(b.serviceDate || b.createdAt, range))
      .filter((b) => status === "All Status" || (BOOKING_STATUS[b.status]?.[1] || b.status) === status)
      .filter((b) => kind === "All Types" || (kind === "Emergency" ? b.kind === "emergency" : b.kind !== "emergency"))
      .filter((b) => !q || [b.name, b.phone, b.address, b.assignedMechanic?.name].filter(Boolean).some((f) => String(f).toLowerCase().includes(q)))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [data.bookings, range, search, status, kind]);

  const paged = usePaged(rows, 10, `${search}|${status}|${kind}|${range.from}`);

  return (
    <div>
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by customer, mobile, address or mechanic" />
        <SelectBox label="Type" value={kind} onChange={setKind} options={["All Types", "Doorstep", "Emergency"]} />
        <SelectBox label="Status" value={status} onChange={setStatus} options={["All Status", "Pending", "Assigned", "In Progress", "Completed", "Cancelled"]} />
        <ClearButton onClick={() => { setSearch(""); setStatus("All Status"); setKind("All Types"); }} />
      </FilterBar>
      <TableCard footer={<Pagination paged={paged} noun="bookings" />}>
        <table className="min-w-full">
          <thead>
            <tr><Th>#</Th><Th>Customer</Th><Th>Service</Th><Th>Mechanic</Th><Th>Date</Th><Th>Type</Th><Th className="text-right">Bill</Th><Th>Status</Th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.slice.length === 0 && <EmptyRow colSpan={8}>No bookings in this period.</EmptyRow>}
            {paged.slice.map((b, i) => {
              const [tone, label] = BOOKING_STATUS[b.status] || ["gray", b.status];
              return (
                <tr key={b._id} className="hover:bg-gray-50">
                  <Td className="text-gray-500">{paged.start + i}</Td>
                  <Td>
                    <div className="font-medium text-gray-900">{b.name}</div>
                    <div className="text-xs text-gray-500">{b.phone}</div>
                  </Td>
                  <Td>{b.serviceType ? serviceLabel(b.serviceType) : "Emergency Repair"}</Td>
                  <Td>{b.assignedMechanic?.name || "—"}</Td>
                  <Td>{fmtDate(b.serviceDate || b.createdAt)}</Td>
                  <Td><Pill tone={b.kind === "emergency" ? "red" : "sky"}>{b.kind === "emergency" ? "Emergency" : "Doorstep"}</Pill></Td>
                  <Td className="text-right font-semibold">{b.bill ? money(b.bill.total) : "—"}</Td>
                  <Td><Pill tone={tone}>{label}</Pill></Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function PartnerMechanics({ data, range }) {
  const [search, setSearch] = useState("");

  const perf = useMemo(() => {
    const m = {};
    data.bookings.forEach((b) => {
      const id = String(b.assignedMechanic?._id || "");
      if (!id) return;
      m[id] = m[id] || { jobs: 0, revenue: 0, period: 0 };
      m[id].jobs++;
      m[id].revenue += b.bill?.total || 0;
      if (inRange(b.serviceDate || b.createdAt, range)) m[id].period++;
    });
    return m;
  }, [data.bookings, range]);

  const rows = data.mechanics
    .filter((m) => !search || `${m.name} ${m.phone} ${m.mechanicId}`.toLowerCase().includes(search.toLowerCase()))
    .map((m) => ({ ...m, status: mechanicStatus(m), ...(perf[String(m._id)] || { jobs: 0, revenue: 0, period: 0 }) }));

  return (
    <div>
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, mobile or ID" />
      </FilterBar>
      <TableCard>
        <table className="min-w-full">
          <thead>
            <tr><Th>#</Th><Th>Name</Th><Th>ID</Th><Th>Phone</Th><Th>Status</Th><Th className="text-center">Jobs (period)</Th><Th className="text-center">Total Jobs</Th><Th className="text-right">Revenue</Th><Th>Rating</Th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <EmptyRow colSpan={9}>No mechanics are linked to your garage yet. Ask Roadengo to add them.</EmptyRow>
            )}
            {rows.map((m, i) => (
              <tr key={m._id} className="hover:bg-gray-50">
                <Td className="text-gray-500">{i + 1}</Td>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} src={m.location?.photo} />
                    <span className="font-medium text-gray-900">{m.name}</span>
                  </div>
                </Td>
                <Td className="text-gray-600">{m.mechanicId || "—"}</Td>
                <Td><a href={`tel:${m.phone}`} className="hover:text-red-600">{m.phone}</a></Td>
                <Td><Pill tone={m.status.tone} dot>{m.status.label}</Pill></Td>
                <Td className="text-center">{m.period}</Td>
                <Td className="text-center">{m.jobs}</Td>
                <Td className="text-right">{money(m.revenue)}</Td>
                <Td>
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {m.rating ? Number(m.rating).toFixed(1) : "—"}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function PartnerSpareParts({ onOrder }) {
  const [parts, setParts] = useState([]);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All Categories");

  useEffect(() => {
    apiService
      .getParts()
      .then((r) => setParts((Array.isArray(r.data) ? r.data : r.data?.parts || []).filter((p) => p.isActive !== false)))
      .catch(() => setParts([]));
  }, []);

  const cats = ["All Categories", ...Array.from(new Set(parts.map((p) => p.category).filter(Boolean))).sort()];
  const rows = parts.filter((p) => {
    if (cat !== "All Categories" && p.category !== cat) return false;
    return !search || `${p.name} ${p.brand} ${p.sku}`.toLowerCase().includes(search.toLowerCase());
  });
  const paged = usePaged(rows, 10, `${search}|${cat}`);

  return (
    <div>
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search parts by name, brand or SKU" />
        <SelectBox label="Category" value={cat} onChange={setCat} options={cats} />
        <button type="button" onClick={onOrder} className="inline-flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white font-semibold px-5 py-2.5 rounded-xl">
          <ShoppingCart className="w-4 h-4" /> Order parts
        </button>
      </FilterBar>
      <TableCard footer={<Pagination paged={paged} noun="parts" />}>
        <table className="min-w-full">
          <thead>
            <tr><Th>#</Th><Th>Part</Th><Th>Category</Th><Th>Brand</Th><Th className="text-right">Price (₹)</Th><Th>Availability</Th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.slice.length === 0 && <EmptyRow colSpan={6}>No parts found.</EmptyRow>}
            {paged.slice.map((p, i) => {
              const price = p.discount ? Math.round(p.price * (1 - p.discount / 100)) : p.price;
              const stock = Number(p.stock || 0);
              return (
                <tr key={p._id} className="hover:bg-gray-50">
                  <Td className="text-gray-500">{paged.start + i}</Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      {p.photo ? (
                        <img src={photoUrl(p.photo)} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-50" />
                      ) : (
                        <span className="w-10 h-10 rounded-lg bg-gray-100" />
                      )}
                      <span className="font-medium text-gray-900 whitespace-normal">{p.name}</span>
                    </div>
                  </Td>
                  <Td>{p.category}</Td>
                  <Td>{p.brand || "—"}</Td>
                  <Td className="text-right">
                    {p.discount ? <span className="text-xs text-gray-400 line-through mr-1.5">{money2(p.price)}</span> : null}
                    <b>{money2(price)}</b>
                  </Td>
                  <Td>
                    <Pill tone={stock <= 0 ? "red" : stock < 5 ? "amber" : "green"}>
                      {stock <= 0 ? "Out of Stock" : stock < 5 ? "Low Stock" : "In Stock"}
                    </Pill>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function PartnerSubscription() {
  const [plans, setPlans] = useState([]);
  useEffect(() => {
    apiService.getAllSubscriptionPlans().then((r) => setPlans(r.data?.plans || [])).catch(() => setPlans([]));
  }, []);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {plans.map((p) => (
        <div key={p.code} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <Pill tone={p.tier === "Gold" ? "amber" : "sky"}>{p.tier || p.name}</Pill>
            <span className="text-sm text-gray-500">{p.durationMonths} months</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mt-3">{p.name}</h3>
          <p className="text-gray-500">{p.tagline}</p>
          <p className="mt-4">
            <span className="text-3xl font-extrabold text-red-700">{money(p.price)}</span>
            {p.worth ? <span className="ml-2 text-gray-400 line-through">{money(p.worth)}</span> : null}
          </p>
          <ul className="mt-4 space-y-2">
            {(p.features || []).map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" /> {f}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="md:col-span-2 text-sm text-gray-500">
        Customers subscribe from the Roadengo app or website; Roadengo activates the plan once payment is received.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function PartnerSettings({ partner, notify }) {
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  const change = async (e) => {
    e.preventDefault();
    if (pw.next.length < 6) return notify?.("New password must be at least 6 characters.", "error");
    if (pw.next !== pw.confirm) return notify?.("The two new passwords don't match.", "error");
    setSaving(true);
    try {
      await apiService.changePartnerPassword(pw.current, pw.next);
      notify?.("Password changed.", "success");
      setPw({ current: "", next: "", confirm: "" });
    } catch (err) {
      notify?.(err?.response?.data?.message || "Could not change the password.", "error");
    } finally {
      setSaving(false);
    }
  };

  const info = [
    ["Partner ID", partner.partnerId],
    ["Garage name", titleCase(partner.name)],
    ["City", titleCase(partner.city)],
    ["Mobile (login)", partner.mobile],
    ["Email", partner.email || "—"],
    ["Contact person", partner.contactPerson || "—"],
    ["Address", partner.address || "—"],
    ["Commission", `${partner.commissionPercent || 0}%`],
    ["Joined", fmtDate(partner.joinDate || partner.createdAt)],
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-4 items-start">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Garage profile</h3>
        <dl className="grid grid-cols-[140px_1fr] gap-y-3 text-sm">
          {info.map(([k, v]) => (
            <React.Fragment key={k}>
              <dt className="text-gray-500">{k}</dt>
              <dd className="text-gray-900 font-medium">{v}</dd>
            </React.Fragment>
          ))}
        </dl>
        <p className="text-xs text-gray-500 mt-5">To change these details, contact Roadengo.</p>
      </div>
      <form onSubmit={change} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><KeyRound className="w-5 h-5" /> Change password</h3>
        <Field label="Current password" htmlFor="ps-cur"><input id="ps-cur" type="password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} className={inputCls} /></Field>
        <Field label="New password" htmlFor="ps-new"><input id="ps-new" type="password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} className={inputCls} /></Field>
        <Field label="Confirm new password" htmlFor="ps-conf"><input id="ps-conf" type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} className={inputCls} /></Field>
        <button type="submit" disabled={saving} className="w-full bg-red-700 hover:bg-red-800 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl">
          {saving ? "Saving…" : "Change password"}
        </button>
      </form>
    </div>
  );
}
