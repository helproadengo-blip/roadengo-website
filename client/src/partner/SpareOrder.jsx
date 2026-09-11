import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronDown, Plus, Trash2, RotateCcw, ShoppingCart, FileText, Clock, CircleCheck, Truck } from "lucide-react";
import { apiService } from "../routing/apiClient";
import { TableCard, Th, Td, EmptyRow, Pill, Pagination, usePaged, money2, fmtDate, inputCls } from "../admin/ui";

const STATUS = { pending: ["amber", "Pending"], approved: ["green", "Approved"], dispatched: ["purple", "Dispatch"], cancelled: ["red", "Cancelled"] };

const salePrice = (p) => (p.discount ? Math.round(p.price * (1 - p.discount / 100)) : p.price);

/** Searchable catalogue picker — the design's "Search spare part" dropdown. */
function PartPicker({ parts, value, onPick }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const shown = parts
    .filter((p) => !q || `${p.name} ${p.brand || ""} ${p.category || ""} ${p.sku || ""}`.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 40);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${inputCls} flex items-center gap-3 text-left`}
      >
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <span className={`flex-1 truncate ${value ? "text-gray-900" : "text-gray-400"}`}>
          {value ? value.name : "Search spare part (e.g. Brake Pad, Air Filter, Chain Set...)"}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>
      {open && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl">
          <div className="p-2 border-b border-gray-100">
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type to search…" aria-label="Search parts" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {shown.length === 0 && <li className="px-4 py-3 text-sm text-gray-500">No parts found.</li>}
            {shown.map((p) => (
              <li key={p._id}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(p);
                    setOpen(false);
                    setQ("");
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between gap-3"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-gray-900 truncate">{p.name}</span>
                    <span className="block text-xs text-gray-500">{[p.brand, p.category].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">₹{money2(salePrice(p))}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function SpareOrder({ notify }) {
  const [parts, setParts] = useState([]);
  const [picked, setPicked] = useState(null);
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const [lines, setLines] = useState([]);
  const [placing, setPlacing] = useState(false);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dates, setDates] = useState({ from: "", to: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.getPartnerSpareOrders();
      setOrders(res.data?.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    apiService
      .getParts()
      .then((r) => setParts((Array.isArray(r.data) ? r.data : r.data?.parts || []).filter((p) => p.isActive !== false)))
      .catch(() => setParts([]));
  }, [load]);

  const add = () => {
    if (!picked) return notify?.("Choose a part first.", "error");
    const q = Math.max(1, parseInt(qty, 10) || 0);
    const unit = Number(price) || 0;
    setLines((prev) => {
      const existing = prev.find((l) => l.part === picked._id);
      if (existing) return prev.map((l) => (l.part === picked._id ? { ...l, quantity: l.quantity + q } : l));
      return [...prev, { part: picked._id, name: picked.name, quantity: q, unitPrice: unit }];
    });
    setPicked(null);
    setQty("1");
    setPrice("");
  };

  const total = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

  const place = async () => {
    if (!lines.length) return notify?.("Add at least one part.", "error");
    setPlacing(true);
    try {
      const res = await apiService.createPartnerSpareOrder(lines);
      notify?.(res.data?.message || "Order placed.", "success");
      setLines([]);
      load();
    } catch (err) {
      notify?.(err?.response?.data?.message || "Could not place the order.", "error");
    } finally {
      setPlacing(false);
    }
  };

  const counts = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    approved: orders.filter((o) => o.status === "approved").length,
    dispatched: orders.filter((o) => o.status === "dispatched").length,
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const from = dates.from ? new Date(dates.from + "T00:00:00") : null;
    const to = dates.to ? new Date(dates.to + "T23:59:59") : null;
    return orders.filter((o) => {
      const d = new Date(o.createdAt);
      if (from && d < from) return false;
      if (to && d > to) return false;
      if (!q) return true;
      return [o.orderId, ...o.items.map((i) => i.name)].some((f) => String(f).toLowerCase().includes(q));
    });
  }, [orders, search, dates]);

  const paged = usePaged(filtered, 10, `${search}|${dates.from}|${dates.to}`);

  const Tile = ({ icon: Icon, tone, tint, label, value }) => (
    <div className={`rounded-xl ${tint} p-3 flex items-center gap-3`}>
      <span className={`w-10 h-10 rounded-xl ${tone} flex items-center justify-center`}><Icon className="w-5 h-5 text-white" /></span>
      <span><span className="block text-sm text-gray-700">{label}</span><span className="block text-xl font-bold text-gray-900">{value}</span></span>
    </div>
  );

  return (
    <div className="grid xl:grid-cols-[440px_1fr] gap-4 items-start">
      {/* Build an order */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col min-h-[640px]">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Add Spare Parts to Order</h3>
        <PartPicker
          parts={parts}
          value={picked}
          onPick={(p) => {
            setPicked(p);
            setPrice(String(salePrice(p)));
          }}
        />
        <div className="grid grid-cols-[1fr_1.3fr_auto] gap-3 mt-3 items-end">
          <label className="block">
            <span className="block text-sm font-semibold text-gray-800 mb-1.5">Quantity</span>
            <input inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value.replace(/[^0-9]/g, ""))} className={inputCls} />
          </label>
          <label className="block">
            <span className="block text-sm font-semibold text-gray-800 mb-1.5">Unit Price (₹)</span>
            <input value={price ? money2(price) : ""} readOnly placeholder="0.00" title="Roadengo catalogue price" className={`${inputCls} bg-gray-50`} />
          </label>
          <button type="button" onClick={add} className="inline-flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white font-semibold px-5 py-2.5 rounded-xl">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        <div className="mt-4 border border-gray-100 rounded-xl overflow-hidden flex-1">
          <table className="min-w-full">
            <thead>
              <tr><Th>#</Th><Th>Part Name</Th><Th className="text-center">Quantity</Th><Th className="text-right">Unit Price (₹)</Th><Th className="text-right">Total (₹)</Th><Th /></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lines.length === 0 && <EmptyRow colSpan={6}>Pick parts above to build your order.</EmptyRow>}
              {lines.map((l, i) => (
                <tr key={l.part}>
                  <Td className="text-gray-500">{i + 1}</Td>
                  <Td className="whitespace-normal">{l.name}</Td>
                  <Td className="text-center">{l.quantity}</Td>
                  <Td className="text-right">{money2(l.unitPrice)}</Td>
                  <Td className="text-right">{money2(l.quantity * l.unitPrice)}</Td>
                  <Td>
                    <button type="button" aria-label={`Remove ${l.name}`} onClick={() => setLines((prev) => prev.filter((x) => x.part !== l.part))} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 bg-red-50 rounded-xl px-4 py-3.5 flex items-center justify-between">
          <span className="font-bold text-gray-900">Total Amount (₹)</span>
          <span className="text-xl font-bold text-gray-900">{money2(total)}</span>
        </div>
        <div className="grid grid-cols-[1fr_1.5fr] gap-3 mt-3">
          <button type="button" onClick={() => setLines([])} disabled={!lines.length} className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-800 font-semibold py-3 rounded-xl">
            <RotateCcw className="w-4 h-4" /> Clear All
          </button>
          <button type="button" onClick={place} disabled={placing || !lines.length} className="inline-flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl">
            <ShoppingCart className="w-4 h-4" /> {placing ? "Placing…" : "Place Spare Order"}
          </button>
        </div>
      </div>

      {/* Order list */}
      <TableCard footer={<Pagination paged={paged} noun="orders" />}>
        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Spare Order List</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Tile icon={FileText} tone="bg-blue-500" tint="bg-blue-50" label="Total Orders" value={counts.total} />
            <Tile icon={Clock} tone="bg-amber-500" tint="bg-amber-50" label="Pending" value={counts.pending} />
            <Tile icon={CircleCheck} tone="bg-emerald-500" tint="bg-emerald-50" label="Approved" value={counts.approved} />
            <Tile icon={Truck} tone="bg-violet-500" tint="bg-violet-50" label="Dispatch" value={counts.dispatched} />
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by Order ID or Part Name..." aria-label="Search orders" className={`${inputCls} pl-10`} />
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
            <tr><Th>#</Th><Th>Order ID</Th><Th>Date</Th><Th className="text-center">Total Items</Th><Th className="text-right">Total Amount (₹)</Th><Th>Status</Th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <EmptyRow colSpan={6}>Loading orders…</EmptyRow>}
            {!loading && paged.slice.length === 0 && <EmptyRow colSpan={6}>No orders yet.</EmptyRow>}
            {!loading && paged.slice.map((o, i) => {
              const [tone, label] = STATUS[o.status] || ["gray", o.status];
              return (
                <tr key={o._id} className="hover:bg-gray-50" title={o.items.map((it) => `${it.name} × ${it.quantity}`).join(", ")}>
                  <Td className="text-gray-500">{paged.start + i}</Td>
                  <Td className="font-semibold">{o.orderId}</Td>
                  <Td>{fmtDate(o.createdAt)}</Td>
                  <Td className="text-center">{o.totalItems}</Td>
                  <Td className="text-right font-medium">{money2(o.totalAmount)}</Td>
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
