import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Users, MapPin, UserCheck, CalendarRange, Coins, Plus, Pencil, Trash2, KeyRound, Check, X, Truck } from "lucide-react";
import { apiService } from "../routing/apiClient";
import {
  PageHeader, PrimaryButton, StatCard, FilterBar, SearchInput, SelectBox, ClearButton, TableCard, Th, Td,
  EmptyRow, Pill, Pagination, usePaged, DateRangePicker, rangeFor, previousRange, inRange, pctChange,
  money, money2, fmtDate, fmtTime, RowMenu, Modal, Field, inputCls, photoUrl,
} from "./ui";

const STATUS = { active: ["green", "Active"], inactive: ["red", "Inactive"], suspended: ["gray", "Suspended"] };
const CITY_TONES = ["sky", "purple", "green", "amber", "pink", "blue"];
const cityTone = (c) => CITY_TONES[[...String(c || "").toLowerCase()].reduce((s, ch) => s + ch.charCodeAt(0), 0) % CITY_TONES.length];
const titleCase = (s) => String(s || "").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const ORDER_STATUS = { pending: ["amber", "Pending"], approved: ["green", "Approved"], dispatched: ["purple", "Dispatch"], cancelled: ["red", "Cancelled"] };

const EMPTY = { name: "", city: "", mobile: "", email: "", contactPerson: "", address: "", commissionPercent: "", status: "active", notes: "", password: "" };

export default function PartnersPage({ mechanics = [], showNotification }) {
  const [tab, setTab] = useState("partners");
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(() => rangeFor("month"));
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("All Cities");
  const [status, setStatus] = useState("All Status");

  const [editing, setEditing] = useState(null); // partner | "new" | null
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, pay, ord] = await Promise.all([
        apiService.getPartners(),
        apiService.getPendingPartnerPayments().catch(() => ({ data: { payments: [] } })),
        apiService.getAllPartnerSpareOrders().catch(() => ({ data: { orders: [] } })),
      ]);
      setPartners(p.data?.partners || []);
      setPayments(pay.data?.payments || []);
      setOrders(ord.data?.orders || []);
    } catch (e) {
      showNotification?.(e?.response?.data?.message || "Could not load partners.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    load();
  }, [load]);

  const joined = (r) => partners.filter((p) => inRange(p.joinDate || p.createdAt, r));
  const prev = previousRange(range);
  const showTrend = range.key !== "all";
  const totals = {
    partners: partners.length,
    cities: new Set(partners.map((p) => (p.city || "").trim().toLowerCase()).filter(Boolean)).size,
    active: partners.filter((p) => p.status === "active").length,
    bookings: partners.reduce((s, p) => s + (p.bookings || 0), 0),
    revenue: partners.reduce((s, p) => s + (p.revenue || 0), 0),
  };

  const cities = useMemo(() => ["All Cities", ...Array.from(new Set(partners.map((p) => titleCase(p.city)).filter(Boolean))).sort()], [partners]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return partners.filter((p) => {
      if (city !== "All Cities" && titleCase(p.city) !== city) return false;
      if (status !== "All Status" && STATUS[p.status]?.[1] !== status) return false;
      if (!q) return true;
      return [p.name, p.city, p.mobile, p.partnerId].filter(Boolean).some((f) => String(f).toLowerCase().includes(q));
    });
  }, [partners, search, city, status]);

  const paged = usePaged(filtered, 10, `${search}|${city}|${status}`);

  const remove = async (p) => {
    if (!window.confirm(`Remove ${p.name}? Their mechanics will be unlinked.`)) return;
    try {
      await apiService.deletePartner(p._id);
      showNotification?.(`${p.name} removed.`, "success");
      load();
    } catch (e) {
      showNotification?.(e?.response?.data?.message || "Could not remove the partner.", "error");
    }
  };

  const decide = async (pay, st) => {
    let reason = "";
    if (st === "rejected") {
      reason = window.prompt("Reason for rejecting this payment?") ?? null;
      if (reason === null) return;
    }
    try {
      await apiService.decidePartnerPayment(pay._id, st, reason);
      showNotification?.(st === "completed" ? "Payment approved — it's now in the partner's ledger." : "Payment rejected.", "success");
      setPayments((l) => l.filter((x) => x._id !== pay._id));
    } catch (e) {
      showNotification?.(e?.response?.data?.message || "Could not update the payment.", "error");
    }
  };

  const moveOrder = async (o, st) => {
    try {
      const res = await apiService.updatePartnerSpareOrder(o._id, st);
      showNotification?.(res.data?.message || "Order updated.", "success");
      setOrders((l) => l.map((x) => (x._id === o._id ? { ...x, ...res.data.order, partner: x.partner } : x)));
    } catch (e) {
      showNotification?.(e?.response?.data?.message || "Could not update the order.", "error");
    }
  };

  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  return (
    <div>
      <PageHeader title="Partners" subtitle="Manage your partner garages, view their performance and details.">
        <DateRangePicker value={range} onChange={setRange} />
        <PrimaryButton icon={Plus} onClick={() => setEditing("new")}>
          Add Partner
        </PrimaryButton>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <StatCard icon={Users} tone="red" label="Total Partners" value={totals.partners}
          trend={showTrend ? pctChange(joined(range).length, joined(prev).length) : undefined} sub={showTrend ? undefined : "all time"} />
        <StatCard icon={MapPin} tone="blue" label="Total Cities" value={totals.cities} sub="with partners" />
        <StatCard icon={UserCheck} tone="green" label="Active Partners" value={totals.active} sub={`of ${totals.partners} partners`} />
        <StatCard icon={CalendarRange} tone="amber" label="Total Bookings" value={totals.bookings} sub="all time" />
        <StatCard icon={Coins} tone="purple" label="Partner Revenue" value={money(totals.revenue)} sub="all time" />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {[
          ["partners", "Partners", 0],
          ["payments", "Payment Approvals", payments.length],
          ["orders", "Spare Orders", pendingOrders],
        ].map(([k, l, n]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${
              tab === k ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {l}
            {n > 0 && <span className="bg-red-600 text-white text-[11px] rounded-full px-2 py-0.5">{n}</span>}
          </button>
        ))}
      </div>

      {tab === "partners" && (
        <>
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search by partner name, city or mobile number..." />
            <SelectBox label="City" value={city} onChange={setCity} options={cities} />
            <SelectBox label="Status" value={status} onChange={setStatus} options={["All Status", "Active", "Inactive", "Suspended"]} />
            <ClearButton onClick={() => { setSearch(""); setCity("All Cities"); setStatus("All Status"); }} />
          </FilterBar>

          <TableCard footer={<Pagination paged={paged} noun="partners" />}>
            <table className="min-w-full">
              <thead>
                <tr>
                  <Th>#</Th><Th>Partner ID</Th><Th>Partner Name</Th><Th>City</Th><Th>Contact Number</Th>
                  <Th>Total Bookings</Th><Th>Total Revenue</Th><Th>Status</Th><Th>Join Date</Th><Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && <EmptyRow colSpan={10}>Loading partners…</EmptyRow>}
                {!loading && paged.slice.length === 0 && (
                  <EmptyRow colSpan={10}>{partners.length ? "No partners match these filters." : "No partners yet — add your first one."}</EmptyRow>
                )}
                {!loading && paged.slice.map((p, i) => {
                  const [tone, label] = STATUS[p.status] || ["gray", p.status];
                  return (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <Td className="text-gray-500">{paged.start + i}</Td>
                      <Td className="font-semibold">{p.partnerId}</Td>
                      <Td>
                        <div className="flex items-center gap-3">
                          {p.logo ? (
                            <img src={photoUrl(p.logo)} alt="" className="w-11 h-11 rounded-lg object-contain border border-gray-100 bg-white" />
                          ) : (
                            <span className="w-11 h-11 rounded-lg bg-red-50 text-red-700 font-bold flex items-center justify-center">
                              {(p.name || "?").charAt(0)}
                            </span>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{titleCase(p.name)}</div>
                            <div className="text-xs text-gray-500">
                              {p.mechanicsCount || 0} mechanic(s){p.hasLogin ? " · can log in" : ""}
                            </div>
                          </div>
                        </div>
                      </Td>
                      <Td><Pill tone={cityTone(p.city)}>{titleCase(p.city)}</Pill></Td>
                      <Td>{p.mobile}</Td>
                      <Td className="font-medium">{p.bookings}</Td>
                      <Td className="font-bold">{money(p.revenue)}</Td>
                      <Td><Pill tone={tone}>{label}</Pill></Td>
                      <Td>{fmtDate(p.joinDate || p.createdAt)}</Td>
                      <Td>
                        <RowMenu
                          items={[
                            { label: "Edit partner", icon: Pencil, onClick: () => setEditing(p) },
                            { label: p.hasLogin ? "Reset login password" : "Give panel login", icon: KeyRound, onClick: () => setEditing({ ...p, focusPassword: true }) },
                            { label: "Delete", icon: Trash2, danger: true, onClick: () => remove(p) },
                          ]}
                        />
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableCard>
        </>
      )}

      {tab === "payments" && (
        <TableCard>
          <table className="min-w-full">
            <thead>
              <tr>
                <Th>#</Th><Th>Partner</Th><Th>Date &amp; Time</Th><Th>Transaction ID</Th><Th>Payment Type</Th>
                <Th>Amount (₹)</Th><Th>Method</Th><Th>Reference</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.length === 0 && <EmptyRow colSpan={9}>No payments waiting for approval.</EmptyRow>}
              {payments.map((pay, i) => (
                <tr key={pay._id} className="hover:bg-gray-50">
                  <Td className="text-gray-500">{i + 1}</Td>
                  <Td className="font-medium">{titleCase(pay.partner?.name)}</Td>
                  <Td><div>{fmtDate(pay.date)}</div><div className="text-xs text-gray-500">{fmtTime(pay.createdAt)}</div></Td>
                  <Td>{pay.externalTxnId || pay.txnId}</Td>
                  <Td>{pay.paymentType}</Td>
                  <Td className={`font-bold ${pay.type === "credit" ? "text-emerald-600" : "text-red-600"}`}>{money2(pay.amount)}</Td>
                  <Td>{pay.method}</Td>
                  <Td className="text-gray-600">{pay.reference || "—"}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => decide(pay, "completed")} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">
                        <Check className="w-4 h-4" /> Approve
                      </button>
                      <button type="button" onClick={() => decide(pay, "rejected")} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-sm font-semibold">
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}

      {tab === "orders" && (
        <TableCard>
          <table className="min-w-full">
            <thead>
              <tr>
                <Th>#</Th><Th>Order ID</Th><Th>Partner</Th><Th>Date</Th><Th>Items</Th>
                <Th>Total Amount (₹)</Th><Th>Status</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 && <EmptyRow colSpan={8}>No spare-part orders from partners yet.</EmptyRow>}
              {orders.map((o, i) => {
                const [tone, label] = ORDER_STATUS[o.status] || ["gray", o.status];
                return (
                  <tr key={o._id} className="hover:bg-gray-50 align-top">
                    <Td className="text-gray-500">{i + 1}</Td>
                    <Td className="font-semibold">{o.orderId}</Td>
                    <Td>{titleCase(o.partner?.name)}</Td>
                    <Td>{fmtDate(o.createdAt)}</Td>
                    <Td className="whitespace-normal min-w-[220px]">
                      {o.items.map((it) => `${it.name} × ${it.quantity}`).join(", ")}
                    </Td>
                    <Td className="font-bold">{money2(o.totalAmount)}</Td>
                    <Td><Pill tone={tone}>{label}</Pill></Td>
                    <Td>
                      <div className="flex flex-wrap gap-2">
                        {o.status === "pending" && (
                          <button type="button" onClick={() => moveOrder(o, "approved")} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">Approve</button>
                        )}
                        {o.status === "approved" && (
                          <button type="button" onClick={() => moveOrder(o, "dispatched")} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold">
                            <Truck className="w-4 h-4" /> Dispatch
                          </button>
                        )}
                        {["pending", "approved"].includes(o.status) && (
                          <button type="button" onClick={() => window.confirm(`Cancel ${o.orderId}?`) && moveOrder(o, "cancelled")} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-sm font-semibold">Cancel</button>
                        )}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableCard>
      )}

      {editing && (
        <PartnerForm
          partner={editing === "new" ? null : editing}
          mechanics={mechanics}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
          showNotification={showNotification}
        />
      )}
    </div>
  );
}

function PartnerForm({ partner, mechanics, onClose, onSaved, showNotification }) {
  const [form, setForm] = useState(() =>
    partner
      ? { ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, partner[k] ?? ""])), password: "" }
      : EMPTY
  );
  const [mechIds, setMechIds] = useState(() => new Set(partner?.mechanicIds || []));
  const [logo, setLogo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [mechSearch, setMechSearch] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.city.trim() || !/^[0-9]{10}$/.test(form.mobile.trim())) {
      showNotification?.("Name, city and a 10-digit mobile are required.", "error");
      return;
    }
    if (form.password && form.password.length < 6) {
      showNotification?.("Login password must be at least 6 characters.", "error");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "password" && !v) return;
        fd.append(k, v ?? "");
      });
      fd.append("mechanicIds", JSON.stringify([...mechIds]));
      if (logo) fd.append("logo", logo);
      if (partner) await apiService.updatePartner(partner._id, fd);
      else await apiService.createPartner(fd);
      showNotification?.(partner ? `${form.name} updated.` : `${form.name} added.`, "success");
      onSaved();
    } catch (err) {
      showNotification?.(err?.response?.data?.message || "Could not save the partner.", "error");
    } finally {
      setSaving(false);
    }
  };

  const shownMechs = mechanics.filter((m) => !mechSearch || `${m.name} ${m.mechanicId} ${m.phone}`.toLowerCase().includes(mechSearch.toLowerCase()));

  return (
    <Modal title={partner ? `Edit ${titleCase(partner.name)}` : "Add Partner"} onClose={onClose} width="max-w-3xl">
      <form onSubmit={save}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Partner name" required htmlFor="pf-name"><input id="pf-name" value={form.name} onChange={set("name")} className={inputCls} /></Field>
          <Field label="City" required htmlFor="pf-city"><input id="pf-city" value={form.city} onChange={set("city")} className={inputCls} /></Field>
          <Field label="Mobile (login ID)" required htmlFor="pf-mobile">
            <input id="pf-mobile" inputMode="numeric" value={form.mobile}
              onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value.replace(/[^0-9]/g, "").slice(0, 10) }))} className={inputCls} />
          </Field>
          <Field label={partner?.hasLogin ? "New login password (leave blank to keep)" : "Login password"} htmlFor="pf-pass">
            <input id="pf-pass" type="text" autoFocus={!!partner?.focusPassword} value={form.password} onChange={set("password")}
              placeholder="At least 6 characters" className={inputCls} />
          </Field>
          <Field label="Contact person" htmlFor="pf-contact"><input id="pf-contact" value={form.contactPerson} onChange={set("contactPerson")} className={inputCls} /></Field>
          <Field label="Email" htmlFor="pf-email"><input id="pf-email" value={form.email} onChange={set("email")} className={inputCls} /></Field>
          <Field label="Commission %" htmlFor="pf-comm"><input id="pf-comm" inputMode="decimal" value={form.commissionPercent} onChange={set("commissionPercent")} className={inputCls} /></Field>
          <Field label="Status" htmlFor="pf-status">
            <select id="pf-status" value={form.status} onChange={set("status")} className={inputCls}>
              <option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option>
            </select>
          </Field>
          <Field label="Logo" htmlFor="pf-logo">
            <input id="pf-logo" type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] || null)} className={inputCls} />
          </Field>
          <Field label="Address" htmlFor="pf-addr"><input id="pf-addr" value={form.address} onChange={set("address")} className={inputCls} /></Field>
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold text-gray-800 mb-1.5">
            Mechanics working for this partner <span className="font-normal text-gray-500">({mechIds.size} selected)</span>
          </p>
          <p className="text-xs text-gray-500 mb-2">Their jobs count as this partner's bookings and revenue.</p>
          <input value={mechSearch} onChange={(e) => setMechSearch(e.target.value)} placeholder="Search mechanics…" aria-label="Search mechanics" className={`${inputCls} mb-2`} />
          <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-gray-50">
            {shownMechs.map((m) => (
              <label key={m._id} className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mechIds.has(String(m._id))}
                  onChange={(e) =>
                    setMechIds((s) => {
                      const n = new Set(s);
                      e.target.checked ? n.add(String(m._id)) : n.delete(String(m._id));
                      return n;
                    })
                  }
                  className="w-4 h-4 accent-red-600"
                />
                <span className="flex-1">{m.name}</span>
                <span className="text-xs text-gray-400">{m.mechanicId}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={saving} className="flex-1 bg-red-700 hover:bg-red-800 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl">
            {saving ? "Saving…" : partner ? "Save changes" : "Add Partner"}
          </button>
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl border border-gray-200 font-semibold text-gray-700">Cancel</button>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          The partner logs in at <b>roadengo.com/partner/login</b> with this mobile number and password.
        </p>
      </form>
    </Modal>
  );
}
