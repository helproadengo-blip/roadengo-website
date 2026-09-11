import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Wallet, Clock, RefreshCw, Files, CalendarDays, Plus, Printer } from "lucide-react";
import { apiService } from "../routing/apiClient";
import {
  PageHeader, PrimaryButton, StatCard, FilterBar, SearchInput, SelectBox, ClearButton, TableCard, Th, Td,
  EmptyRow, Pill, Avatar, Pagination, usePaged, DateRangePicker, rangeFor, previousRange, inRange, isToday,
  pctChange, money, fmtDate, fmtTime, serviceLabel, partsTotal, Modal, Field, inputCls, RANGE_PRESETS,
} from "./ui";
import BillToMechanic from "../components/BillToMechanic";
import MechanicBillModal from "../components/MechanicBillModal";

const STATUS_PILL = { paid: ["green", "Paid"], pending: ["amber", "Pending"], refunded: ["red", "Refunded"] };
const MODES = ["UPI", "Cash", "Card", "Online"];

export default function BillingPage({ mechanics, appointments, showNotification }) {
  const [tab, setTab] = useState("invoices");
  const [bills, setBills] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(() => rangeFor("month"));

  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("Payment Mode");
  const [status, setStatus] = useState("Status");
  const [mech, setMech] = useState("Mechanic");

  const [viewing, setViewing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [billFor, setBillFor] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, s] = await Promise.all([
        apiService.getBills(),
        apiService.getSubscriptions().catch(() => ({ data: [] })),
      ]);
      setBills(b.data?.bills || []);
      setSubs(Array.isArray(s.data) ? s.data : []);
    } catch (e) {
      showNotification?.("Could not load invoices.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    load();
  }, [load]);

  // --- headline numbers for the chosen period, and the one before it -------
  const summarise = useCallback(
    (r) => {
      const inR = bills.filter((b) => inRange(b.createdAt, r));
      const sum = (list) => list.reduce((s, b) => s + (b.total || 0), 0);
      const subsIn = subs.filter((s) => s.status === "active" && inRange(s.startedAt || s.createdAt, r));
      return {
        total: sum(inR),
        paid: sum(inR.filter((b) => b.paymentStatus === "paid")),
        pending: sum(inR.filter((b) => b.paymentStatus === "pending")),
        subRevenue: subsIn.reduce((s, x) => s + (x.price || 0), 0),
        invoices: inR.length,
      };
    },
    [bills, subs]
  );

  const now = useMemo(() => summarise(range), [summarise, range]);
  const before = useMemo(() => summarise(previousRange(range)), [summarise, range]);
  const today = useMemo(() => summarise(rangeFor("today")), [summarise]);
  const showTrend = range.key !== "all";

  const mechanicOptions = useMemo(
    () => ["Mechanic", ...Array.from(new Set(bills.map((b) => b.mechanic?.name).filter(Boolean))).sort()],
    [bills]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bills.filter((b) => {
      if (!inRange(b.createdAt, range)) return false;
      if (mode !== "Payment Mode" && (b.paymentMode || "") !== mode) return false;
      if (status !== "Status" && b.paymentStatus !== status.toLowerCase()) return false;
      if (mech !== "Mechanic" && b.mechanic?.name !== mech) return false;
      if (!q) return true;
      return [`rd${b.invoiceNumber}`, b.appointment?.name, b.appointment?.phone]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q));
    });
  }, [bills, range, search, mode, status, mech]);

  const paged = usePaged(filtered, 10, `${search}|${mode}|${status}|${mech}|${range.from}`);

  const clear = () => {
    setSearch("");
    setMode("Payment Mode");
    setStatus("Status");
    setMech("Mechanic");
  };

  const savePayment = async (bill, patch) => {
    try {
      const res = await apiService.updateBillPayment(bill._id, patch);
      const updated = res.data?.bill;
      setBills((list) => list.map((b) => (b._id === bill._id ? { ...b, ...updated } : b)));
      setViewing((v) => (v && v._id === bill._id ? { ...v, ...updated } : v));
      showNotification?.("Payment updated.", "success");
    } catch (e) {
      showNotification?.(e?.response?.data?.message || "Could not update the payment.", "error");
    }
  };

  // Bookings that are done (or under way) but have no bill yet.
  const billedIds = useMemo(() => new Set(bills.map((b) => String(b.appointment?._id || b.appointment))), [bills]);
  const unbilled = useMemo(
    () =>
      appointments.filter(
        (a) => ["completed", "in-progress"].includes(a.status) && !billedIds.has(String(a._id))
      ),
    [appointments, billedIds]
  );

  return (
    <div>
      <PageHeader title="Billing" subtitle="Manage all invoices, payments and billing records">
        <DateRangePicker value={range} onChange={setRange} />
        <PrimaryButton icon={Plus} onClick={() => setCreating(true)}>
          Create Bill
        </PrimaryButton>
      </PageHeader>

      <div className="flex gap-2 mb-4">
        {[
          ["invoices", "Invoices"],
          ["mechanic", "Bill to Mechanic"],
        ].map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              tab === k ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "mechanic" ? (
        <BillToMechanic mechanics={mechanics} showNotification={showNotification} />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
            <StatCard icon={FileText} tone="red" label="Total Billing" value={money(now.total)} trend={showTrend ? pctChange(now.total, before.total) : undefined} />
            <StatCard icon={Wallet} tone="green" label="Paid Amount" value={money(now.paid)} trend={showTrend ? pctChange(now.paid, before.paid) : undefined} />
            <StatCard icon={Clock} tone="amber" label="Pending Amount" value={money(now.pending)} trend={showTrend ? pctChange(now.pending, before.pending) : undefined} />
            <StatCard icon={RefreshCw} tone="purple" label="Subscription Revenue" value={money(now.subRevenue)} trend={showTrend ? pctChange(now.subRevenue, before.subRevenue) : undefined} />
            <StatCard icon={Files} tone="blue" label="Total Invoices" value={now.invoices} trend={showTrend ? pctChange(now.invoices, before.invoices) : undefined} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
            <StatCard variant="soft" icon={CalendarDays} tone="red" label="Today Billing" value={money(today.total)} />
            <StatCard variant="soft" icon={CalendarDays} tone="green" label="Today Paid Amount" value={money(today.paid)} />
            <StatCard variant="soft" icon={CalendarDays} tone="amber" label="Today Pending Amount" value={money(today.pending)} />
            <StatCard variant="soft" icon={CalendarDays} tone="purple" label="Today Subscription Revenue" value={money(today.subRevenue)} />
            <StatCard variant="soft" icon={CalendarDays} tone="blue" label="Today Invoices" value={today.invoices} />
          </div>

          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search by Invoice ID, Customer name or Mobile" />
            <SelectBox
              label="Date Range"
              value={range.key}
              onChange={(k) => k !== "custom" && setRange(rangeFor(k))}
              options={[...RANGE_PRESETS.map((p) => ({ value: p.key, label: p.label })), ...(range.key === "custom" ? [{ value: "custom", label: "Custom" }] : [])]}
            />
            <SelectBox label="Payment Mode" value={mode} onChange={setMode} options={["Payment Mode", ...MODES]} />
            <SelectBox label="Status" value={status} onChange={setStatus} options={["Status", "Paid", "Pending", "Refunded"]} />
            <SelectBox label="Mechanic" value={mech} onChange={setMech} options={mechanicOptions} />
            <ClearButton onClick={clear} />
          </FilterBar>

          <TableCard footer={<Pagination paged={paged} noun="invoices" />}>
            <table className="min-w-full">
              <thead>
                <tr>
                  <Th>#</Th>
                  <Th>Invoice ID</Th>
                  <Th>Date &amp; Time</Th>
                  <Th>Customer</Th>
                  <Th>Mechanic</Th>
                  <Th>Service Details</Th>
                  <Th>Parts</Th>
                  <Th>Total Amount</Th>
                  <Th>Payment Mode</Th>
                  <Th>Status</Th>
                  <Th>View Bill</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && <EmptyRow colSpan={11}>Loading invoices…</EmptyRow>}
                {!loading && paged.slice.length === 0 && <EmptyRow colSpan={11}>No invoices in this period.</EmptyRow>}
                {!loading &&
                  paged.slice.map((b, i) => {
                    const [tone, label] = STATUS_PILL[b.paymentStatus] || ["gray", b.paymentStatus || "—"];
                    return (
                      <tr key={b._id} className="hover:bg-gray-50">
                        <Td className="text-gray-500">{paged.start + i}</Td>
                        <Td className="font-semibold">RD{b.invoiceNumber || "—"}</Td>
                        <Td>
                          <div>{fmtDate(b.createdAt)}</div>
                          <div className="text-xs text-gray-500">{fmtTime(b.createdAt)}</div>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2.5">
                            <Avatar name={b.appointment?.name} size={32} />
                            <div>
                              <div className="font-medium text-gray-900">{b.appointment?.name || "—"}</div>
                              <div className="text-xs text-gray-500">{b.appointment?.phone}</div>
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2.5">
                            <Avatar name={b.mechanic?.name} src={b.mechanic?.location?.photo} size={30} />
                            <span>{b.mechanic?.name?.split(" ")[0] || "—"}</span>
                          </div>
                        </Td>
                        <Td>{serviceLabel(b.appointment?.serviceType)}</Td>
                        <Td>{money(partsTotal(b))}</Td>
                        <Td className="font-bold">{money(b.total)}</Td>
                        <Td>{b.paymentMode || "—"}</Td>
                        <Td>
                          <Pill tone={tone}>{label}</Pill>
                        </Td>
                        <Td>
                          <button
                            type="button"
                            onClick={() => setViewing(b)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-800"
                          >
                            <FileText className="w-4 h-4" />
                            View Bill
                          </button>
                        </Td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </TableCard>
        </>
      )}

      {viewing && <BillView bill={viewing} onClose={() => setViewing(null)} onSave={savePayment} />}

      {creating && (
        <Modal title="Create Bill" onClose={() => setCreating(false)} width="max-w-xl">
          <p className="text-sm text-gray-600 mb-4">
            Pick a booking that has been worked on but not billed yet.
          </p>
          {unbilled.length === 0 ? (
            <p className="text-sm text-gray-500">Every completed or in-progress booking already has a bill.</p>
          ) : (
            <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl max-h-96 overflow-y-auto">
              {unbilled.map((a) => (
                <li key={a._id}>
                  <button
                    type="button"
                    onClick={() => {
                      setCreating(false);
                      setBillFor(a);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between gap-3"
                  >
                    <span>
                      <span className="block font-medium text-gray-900">{a.name}</span>
                      <span className="block text-xs text-gray-500">
                        {serviceLabel(a.serviceType)} · {fmtDate(a.serviceDate || a.createdAt)} · {a.status}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-red-700">Bill →</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}

      {billFor && (
        <MechanicBillModal
          job={billFor}
          onClose={() => setBillFor(null)}
          onSaved={load}
          notify={showNotification}
        />
      )}
    </div>
  );
}

function BillView({ bill, onClose, onSave }) {
  const [status, setStatus] = useState(bill.paymentStatus || "pending");
  const [mode, setMode] = useState(bill.paymentMode || "");
  const changed = status !== (bill.paymentStatus || "pending") || mode !== (bill.paymentMode || "");

  return (
    <Modal title={`Invoice RD${bill.invoiceNumber || ""}`} onClose={onClose} width="max-w-lg">
      <div id="print-bill">
        <div className="flex justify-between text-sm">
          <div>
            <p className="font-semibold text-gray-900">{bill.appointment?.name}</p>
            <p className="text-gray-500">{bill.appointment?.phone}</p>
            <p className="text-gray-500 max-w-[16rem]">{bill.appointment?.address}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500">{fmtDate(bill.createdAt)}</p>
            <p className="text-gray-500">{fmtTime(bill.createdAt)}</p>
            <p className="text-gray-700 mt-1">Mechanic: {bill.mechanic?.name || "—"}</p>
          </div>
        </div>

        <table className="w-full text-sm mt-5">
          <thead>
            <tr className="text-gray-500 border-b border-gray-200">
              <th className="text-left py-2 font-semibold">Item</th>
              <th className="text-right py-2 font-semibold">Qty</th>
              <th className="text-right py-2 font-semibold">Rate</th>
              <th className="text-right py-2 font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(bill.lines || []).map((l, i) => (
              <tr key={i} className="border-b border-gray-50">
                <td className="py-2">
                  {l.label}
                  {l.lineDiscount > 0 && <span className="text-emerald-700 text-xs"> (−₹{l.lineDiscount})</span>}
                </td>
                <td className="py-2 text-right">{l.quantity || 1}</td>
                <td className="py-2 text-right">{money(l.rate ?? l.amount)}</td>
                <td className="py-2 text-right font-medium">{money(l.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Sub Total</span>
            <span>{money(bill.subTotal ?? bill.total)}</span>
          </div>
          {bill.discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Discount</span>
              <span>− {money(bill.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold text-gray-900 pt-1">
            <span>Total</span>
            <span>{money(bill.total)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Field label="Payment status" htmlFor="bv-status">
          <select id="bv-status" value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
          </select>
        </Field>
        <Field label="Payment mode" htmlFor="bv-mode">
          <select id="bv-mode" value={mode} onChange={(e) => setMode(e.target.value)} className={inputCls}>
            <option value="">Not recorded</option>
            {MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex gap-3 mt-5">
        <button
          type="button"
          disabled={!changed}
          onClick={() => onSave(bill, { paymentStatus: status, paymentMode: mode })}
          className="flex-1 bg-red-700 hover:bg-red-800 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-xl"
        >
          Save payment
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 font-semibold text-gray-700 hover:bg-gray-50"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>
    </Modal>
  );
}
