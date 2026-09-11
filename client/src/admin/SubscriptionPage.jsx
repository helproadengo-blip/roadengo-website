import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, FileCheck, Clock3, IndianRupee, FileX, Plus, Crown } from "lucide-react";
import { apiService } from "../routing/apiClient";
import {
  PageHeader, PrimaryButton, StatCard, FilterBar, SearchInput, SelectBox, ClearButton, TableCard, Th, Td,
  EmptyRow, Pill, Pagination, usePaged, DateRangePicker, rangeFor, previousRange, inRange, pctChange,
  money, fmtDate, RowMenu, Modal, Field, inputCls, RANGE_PRESETS,
} from "./ui";

const STATUS = {
  active: ["green", "Active"],
  pending: ["amber", "Pending"],
  cancelled: ["red", "Cancelled"],
  expired: ["gray", "Expired"],
};

// Active subscriptions ending within this many days count as "expiring soon".
const EXPIRING_DAYS = 30;

const tierOf = (plans, code) => plans.find((p) => p.code === code)?.tier || code;

export default function SubscriptionPage({ showNotification }) {
  const [subs, setSubs] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(() => rangeFor("year"));

  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("All Plans");
  const [status, setStatus] = useState("All Status");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([apiService.getSubscriptions(), apiService.getAllSubscriptionPlans()]);
      setSubs(Array.isArray(s.data) ? s.data : []);
      setPlans(p.data?.plans || []);
    } catch {
      showNotification?.("Could not load subscriptions.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    load();
  }, [load]);

  const summarise = useCallback(
    (r) => {
      const inR = subs.filter((s) => inRange(s.createdAt, r));
      const soon = Date.now() + EXPIRING_DAYS * 86400000;
      return {
        total: inR.length,
        active: inR.filter((s) => s.status === "active").length,
        expiring: subs.filter(
          (s) => s.status === "active" && s.expiresAt && new Date(s.expiresAt).getTime() <= soon
        ).length,
        revenue: inR.filter((s) => s.status === "active").reduce((t, s) => t + (s.price || 0), 0),
        cancelled: inR.filter((s) => s.status === "cancelled").length,
      };
    },
    [subs]
  );

  const now = useMemo(() => summarise(range), [summarise, range]);
  const before = useMemo(() => summarise(previousRange(range)), [summarise, range]);
  const trend = (a, b) => (range.key === "all" ? undefined : pctChange(a, b));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subs.filter((s) => {
      if (!inRange(s.createdAt, range)) return false;
      if (plan !== "All Plans" && tierOf(plans, s.planCode) !== plan) return false;
      if (status !== "All Status" && (STATUS[s.status]?.[1] || s.status) !== status) return false;
      if (!q) return true;
      return [`sub${s.subscriptionNumber}`, s.name, s.phone].filter(Boolean).some((f) => String(f).toLowerCase().includes(q));
    });
  }, [subs, plans, range, search, plan, status]);

  const paged = usePaged(filtered, 10, `${search}|${plan}|${status}|${range.from}`);

  const update = async (s, body, msg) => {
    try {
      const res = await apiService.updateSubscription(s._id, body);
      const updated = res.data?.subscription;
      setSubs((list) => list.map((x) => (x._id === s._id ? { ...x, ...updated } : x)));
      showNotification?.(msg, "success");
    } catch (e) {
      showNotification?.(e?.response?.data?.message || "Could not update the subscription.", "error");
    }
  };

  const changeStatus = (s, st) => {
    if (st === "active" && s.status !== "active" &&
      !window.confirm(`Activate ${s.name}'s plan? This starts the validity from today — only do this once payment is confirmed.`)) return;
    update(s, { status: st }, `SUB${s.subscriptionNumber} marked ${st}.`);
  };

  return (
    <div>
      <PageHeader title="Subscription" subtitle="Manage subscription customers and revenue">
        <DateRangePicker value={range} onChange={setRange} />
        <PrimaryButton icon={Plus} onClick={() => setAdding(true)}>
          Add Subscription
        </PrimaryButton>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <StatCard icon={RefreshCw} tone="red" label="Total Subscribers" value={now.total} trend={trend(now.total, before.total)} />
        <StatCard icon={FileCheck} tone="green" label="Active Subscriptions" value={now.active} trend={trend(now.active, before.active)} />
        <StatCard icon={Clock3} tone="amber" label="Expiring Soon" value={now.expiring} sub={`within ${EXPIRING_DAYS} days`} />
        <StatCard icon={IndianRupee} tone="purple" label="Subscription Revenue" value={money(now.revenue)} trend={trend(now.revenue, before.revenue)} />
        <StatCard icon={FileX} tone="blue" label="Cancelled" value={now.cancelled} trend={trend(now.cancelled, before.cancelled)} />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by Subscription ID, customer name or mobile" />
        <SelectBox label="Plan" value={plan} onChange={setPlan} options={["All Plans", ...plans.map((p) => p.tier || p.name)]} />
        <SelectBox label="Status" value={status} onChange={setStatus} options={["All Status", "Active", "Pending", "Cancelled", "Expired"]} />
        <SelectBox
          label="Date Range"
          value={range.key}
          onChange={(k) => k !== "custom" && setRange(rangeFor(k))}
          options={[...RANGE_PRESETS.map((p) => ({ value: p.key, label: p.label })), ...(range.key === "custom" ? [{ value: "custom", label: "Custom" }] : [])]}
        />
        <ClearButton
          onClick={() => {
            setSearch("");
            setPlan("All Plans");
            setStatus("All Status");
          }}
        />
      </FilterBar>

      <TableCard footer={<Pagination paged={paged} noun="subscriptions" />}>
        <table className="min-w-full">
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Subscription ID</Th>
              <Th>Customer Name</Th>
              <Th>Mobile</Th>
              <Th>Plan</Th>
              <Th>Start Date</Th>
              <Th>End Date</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <EmptyRow colSpan={10}>Loading subscriptions…</EmptyRow>}
            {!loading && paged.slice.length === 0 && <EmptyRow colSpan={10}>No subscriptions in this period.</EmptyRow>}
            {!loading &&
              paged.slice.map((s, i) => {
                const tier = tierOf(plans, s.planCode);
                const [tone, label] = STATUS[s.status] || ["gray", s.status];
                return (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <Td className="text-gray-500">{paged.start + i}</Td>
                    <Td className="font-semibold">SUB{s.subscriptionNumber}</Td>
                    <Td className="font-medium text-gray-900">{s.name}</Td>
                    <Td>{s.phone}</Td>
                    <Td>
                      <Pill tone={tier === "Gold" ? "amber" : "sky"}>{tier}</Pill>
                    </Td>
                    <Td>{s.startedAt ? fmtDate(s.startedAt) : "—"}</Td>
                    <Td>{s.expiresAt ? fmtDate(s.expiresAt) : "—"}</Td>
                    <Td className="font-semibold">{money(s.price)}</Td>
                    <Td>
                      <Pill tone={tone}>{label}</Pill>
                    </Td>
                    <Td className="text-right">
                      <RowMenu
                        items={[
                          {
                            label: "Change Plan",
                            icon: RefreshCw,
                            children: plans.map((p) => ({
                              label: `${p.tier || p.name} Plan (${money(p.price)})`,
                              disabled: p.code === s.planCode,
                              onClick: () => update(s, { planCode: p.code }, `SUB${s.subscriptionNumber} moved to ${p.tier || p.name}.`),
                            })),
                          },
                          {
                            label: "Change Status",
                            icon: Crown,
                            children: [
                              { label: "Active", dot: "#10b981", disabled: s.status === "active", onClick: () => changeStatus(s, "active") },
                              { label: "Pending", dot: "#f59e0b", disabled: s.status === "pending", onClick: () => changeStatus(s, "pending") },
                              { label: "Cancelled", dot: "#dc2626", disabled: s.status === "cancelled", onClick: () => changeStatus(s, "cancelled") },
                            ],
                          },
                        ]}
                      />
                    </Td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </TableCard>

      {adding && (
        <AddSubscription
          plans={plans}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            load();
          }}
          showNotification={showNotification}
        />
      )}
    </div>
  );
}

function AddSubscription({ plans, onClose, onSaved, showNotification }) {
  const [f, setF] = useState({ planCode: plans[0]?.code || "", name: "", phone: "", vehicleNumber: "", vehicleModel: "", address: "" });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!f.name.trim() || !/^[0-9]{10}$/.test(f.phone.trim()) || !f.vehicleNumber.trim() || !f.address.trim()) {
      showNotification?.("Name, 10-digit mobile, vehicle number and address are required.", "error");
      return;
    }
    setSaving(true);
    try {
      await apiService.createSubscription({ ...f, name: f.name.trim(), phone: f.phone.trim() });
      showNotification?.("Subscription added as Pending. Mark it Active once paid.", "success");
      onSaved();
    } catch (err) {
      showNotification?.(err?.response?.data?.message || "Could not add the subscription.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add Subscription" onClose={onClose}>
      <form onSubmit={save} className="grid sm:grid-cols-2 gap-4">
        <Field label="Plan" required htmlFor="as-plan">
          <select id="as-plan" value={f.planCode} onChange={set("planCode")} className={inputCls}>
            {plans.map((p) => (
              <option key={p.code} value={p.code}>
                {p.tier || p.name} — {money(p.price)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Customer name" required htmlFor="as-name">
          <input id="as-name" value={f.name} onChange={set("name")} className={inputCls} />
        </Field>
        <Field label="Mobile" required htmlFor="as-phone">
          <input
            id="as-phone"
            inputMode="numeric"
            value={f.phone}
            onChange={(e) => setF((x) => ({ ...x, phone: e.target.value.replace(/[^0-9]/g, "").slice(0, 10) }))}
            className={inputCls}
          />
        </Field>
        <Field label="Vehicle number" required htmlFor="as-veh">
          <input id="as-veh" value={f.vehicleNumber} onChange={(e) => setF((x) => ({ ...x, vehicleNumber: e.target.value.toUpperCase() }))} className={inputCls} />
        </Field>
        <Field label="Bike model" htmlFor="as-model">
          <input id="as-model" value={f.vehicleModel} onChange={set("vehicleModel")} className={inputCls} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Address" required htmlFor="as-addr">
            <textarea id="as-addr" rows={2} value={f.address} onChange={set("address")} className={inputCls} />
          </Field>
        </div>
        <div className="sm:col-span-2 flex gap-3 pt-1">
          <button type="submit" disabled={saving} className="flex-1 bg-red-700 hover:bg-red-800 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl">
            {saving ? "Saving…" : "Add Subscription"}
          </button>
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl border border-gray-200 font-semibold text-gray-700">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
