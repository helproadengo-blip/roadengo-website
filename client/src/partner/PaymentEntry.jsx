import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, ScanBarcode, CreditCard, Smartphone, Landmark, ArrowLeftRight, RotateCcw, Save, Info, Search } from "lucide-react";
import { apiService } from "../routing/apiClient";
import { TableCard, Th, Td, EmptyRow, Pill, Pagination, usePaged, money2, fmtDate, fmtTime, inputCls } from "../admin/ui";

const TYPES = [
  "Service Payment",
  "Payment Received",
  "Parts Purchase",
  "Spare Parts Order",
  "Mechanic Salary",
  "Workshop Expense",
  "Tool & Equipment",
  "Other Expense",
];

const METHODS = [
  { key: "Online", icon: CreditCard },
  { key: "UPI", icon: Smartphone },
  { key: "NEFT", icon: Landmark },
  { key: "RTGS", icon: ArrowLeftRight },
];

// Local calendar date — toISOString() is UTC and would show yesterday in
// India before 5:30 am.
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const EMPTY = { date: today(), externalTxnId: "", paymentType: "Service Payment", amount: "", method: "Online", reference: "", notes: "" };

/**
 * The partner records a payment here; it waits in "Pending Payment Entries"
 * until a Roadengo admin approves it, then moves into the Payment Ledger.
 */
export default function PaymentEntry({ notify }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dates, setDates] = useState({ from: "", to: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.getPartnerPayments("pending");
      setPending(res.data?.payments || []);
    } catch {
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.date) errs.date = "Pick a date";
    if (!form.externalTxnId.trim()) errs.externalTxnId = "Enter the transaction ID";
    if (!(Number(form.amount) > 0)) errs.amount = "Enter an amount";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const res = await apiService.createPartnerPayment({ ...form, amount: Number(form.amount) });
      notify?.(res.data?.message || "Payment saved.", "success");
      setForm({ ...EMPTY, date: today() });
      load();
    } catch (err) {
      notify?.(err?.response?.data?.message || "Could not save the payment.", "error");
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const from = dates.from ? new Date(dates.from + "T00:00:00") : null;
    const to = dates.to ? new Date(dates.to + "T23:59:59") : null;
    return pending.filter((p) => {
      const d = new Date(p.date);
      if (from && d < from) return false;
      if (to && d > to) return false;
      if (!q) return true;
      return [p.txnId, p.externalTxnId, p.paymentType, p.reference, p.notes].filter(Boolean).some((f) => String(f).toLowerCase().includes(q));
    });
  }, [pending, search, dates]);

  const paged = usePaged(filtered, 8, `${search}|${dates.from}|${dates.to}`);

  const label = (text, req) => (
    <span className="block text-sm font-semibold text-gray-800 mb-1.5">
      {text} {req ? <span className="text-red-600">*</span> : <span className="font-normal text-gray-500">(Optional)</span>}
    </span>
  );

  return (
    <div className="grid xl:grid-cols-[420px_1fr] gap-4 items-start">
      {/* Form */}
      <form onSubmit={save} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Add Payment Entry</h3>

        <label className="block">
          {label("Date", true)}
          <div className="relative">
            <Calendar className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input type="date" value={form.date} max={today()} onChange={set("date")} className={`${inputCls} pl-10`} />
          </div>
          {errors.date && <span className="text-xs text-red-600">{errors.date}</span>}
        </label>

        <label className="block">
          {label("Transaction ID", true)}
          <div className="relative">
            <input value={form.externalTxnId} onChange={set("externalTxnId")} placeholder="Enter transaction ID" className={`${inputCls} pr-11`} />
            <button
              type="button"
              title="Generate an ID for a cash payment"
              aria-label="Generate a transaction ID"
              onClick={() => setForm((f) => ({ ...f, externalTxnId: `CASH-${Date.now().toString().slice(-8)}` }))}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-600 hover:text-gray-900"
            >
              <ScanBarcode className="w-5 h-5" />
            </button>
          </div>
          {errors.externalTxnId && <span className="text-xs text-red-600">{errors.externalTxnId}</span>}
        </label>

        <label className="block">
          {label("Payment Type", true)}
          <select value={form.paymentType} onChange={set("paymentType")} className={inputCls}>
            {TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>

        <label className="block">
          {label("Amount (₹)", true)}
          <div className="flex">
            <span className="px-3.5 flex items-center border border-r-0 border-gray-200 rounded-l-xl bg-gray-50 text-gray-600">₹</span>
            <input inputMode="decimal" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value.replace(/[^0-9.]/g, "") }))} placeholder="Enter amount" className={`${inputCls} rounded-l-none`} />
          </div>
          {errors.amount && <span className="text-xs text-red-600">{errors.amount}</span>}
        </label>

        <div>
          {label("Payment Method", true)}
          <div className="grid grid-cols-4 gap-2">
            {METHODS.map((m) => {
              const on = form.method === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, method: m.key }))}
                  aria-pressed={on}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-semibold ${
                    on ? "border-red-600 bg-red-50 text-red-700" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <m.icon className="w-5 h-5" />
                  {m.key}
                </button>
              );
            })}
          </div>
        </div>

        <label className="block">
          {label("Reference No.")}
          <input value={form.reference} onChange={set("reference")} placeholder="Enter reference number (UTR / Cheque No. etc.)" className={inputCls} />
        </label>

        <label className="block">
          {label("Notes")}
          <textarea rows={3} value={form.notes} onChange={set("notes")} placeholder="Add any notes..." className={inputCls} />
        </label>

        <div className="grid grid-cols-[1fr_1.4fr] gap-3 pt-1">
          <button type="button" onClick={() => { setForm({ ...EMPTY, date: today() }); setErrors({}); }} className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-xl">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl">
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Payment"}
          </button>
        </div>
      </form>

      {/* Pending */}
      <TableCard footer={<Pagination paged={paged} noun="pending payments" />}>
        <div className="px-4 pt-4 pb-3">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            Pending Payment Entries
            <span className="bg-amber-100 text-amber-800 text-sm font-bold rounded-lg px-2 py-0.5">{pending.length}</span>
          </h3>
          <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
            <Info className="w-4 h-4" /> Only pending payments are shown. Once approved, the entry is automatically removed from this list.
          </p>
          <div className="flex flex-wrap gap-3 mt-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by transaction ID, customer name, reference..." aria-label="Search pending payments" className={`${inputCls} pl-10`} />
            </div>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-1.5">
              <input type="date" aria-label="From date" value={dates.from} onChange={(e) => setDates((d) => ({ ...d, from: e.target.value }))} className="text-sm outline-none" />
              <span className="text-gray-400">–</span>
              <input type="date" aria-label="To date" value={dates.to} onChange={(e) => setDates((d) => ({ ...d, to: e.target.value }))} className="text-sm outline-none" />
            </div>
            <button type="button" onClick={() => { setSearch(""); setDates({ from: "", to: "" }); }} className="inline-flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <RotateCcw className="w-4 h-4" /> Clear
            </button>
          </div>
        </div>
        <table className="min-w-full">
          <thead>
            <tr><Th>#</Th><Th>Date &amp; Time</Th><Th>Transaction ID</Th><Th>Payment Type</Th><Th className="text-right">Amount (₹)</Th><Th>Method</Th><Th>Status</Th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <EmptyRow colSpan={7}>Loading…</EmptyRow>}
            {!loading && paged.slice.length === 0 && <EmptyRow colSpan={7}>No payments waiting for approval.</EmptyRow>}
            {!loading && paged.slice.map((p, i) => (
              <tr key={p._id} className="hover:bg-gray-50">
                <Td className="text-gray-500">{paged.start + i}</Td>
                <Td><div>{fmtDate(p.date)}</div><div className="text-xs text-gray-500">{fmtTime(p.createdAt)}</div></Td>
                <Td className="font-medium">{p.externalTxnId || p.txnId}</Td>
                <Td>{p.paymentType}</Td>
                <Td className={`text-right font-bold ${p.type === "credit" ? "text-emerald-600" : "text-red-600"}`}>{money2(p.amount)}</Td>
                <Td>{p.method}</Td>
                <Td><Pill tone="amber">Pending</Pill></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}
