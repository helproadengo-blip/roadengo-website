import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiService } from "../routing/apiClient";

/**
 * The website twin of the app's billing screen: search the spare-parts
 * catalogue (or type a part that isn't in it), set quantity and rate, apply a
 * percentage or flat discount, and save. Same endpoint as the app, so the bill
 * and its invoice number are shared.
 */
export default function MechanicBillModal({ job, onClose, onSaved, notify }) {
  const [lines, setLines] = useState([
    { label: "Visit / Inspection Charge", quantity: 1, rate: job?.cost || 349, amount: job?.cost || 349 },
  ]);
  const [label, setLabel] = useState("");
  const [qty, setQty] = useState("1");
  const [rate, setRate] = useState("");
  const [results, setResults] = useState([]);
  const [saving, setSaving] = useState(false);

  const [discountMode, setDiscountMode] = useState("none"); // none | percent | amount
  const [discountValue, setDiscountValue] = useState("");

  const timer = useRef(null);

  // Debounced catalogue search — picking a result fills name and rate.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = label.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(() => {
      apiService
        .getParts({ search: q })
        .then((res) => setResults((res.data || []).slice(0, 6)))
        .catch(() => setResults([]));
    }, 300);
    return () => timer.current && clearTimeout(timer.current);
  }, [label]);

  const subTotal = useMemo(() => lines.reduce((s, l) => s + l.amount, 0), [lines]);

  const discount = useMemo(() => {
    const v = parseFloat(discountValue);
    if (!v || v <= 0) return 0;
    if (discountMode === "percent") return Math.min(subTotal, Math.round((subTotal * v) / 100));
    if (discountMode === "amount") return Math.min(subTotal, Math.round(v));
    return 0;
  }, [discountMode, discountValue, subTotal]);

  const total = Math.max(0, subTotal - discount);

  const addLine = () => {
    const r = parseFloat(rate);
    if (!label.trim() || isNaN(r)) return;
    const q = Math.max(1, parseInt(qty, 10) || 1);
    setLines((prev) => [...prev, { label: label.trim(), quantity: q, rate: r, amount: r * q }]);
    setLabel("");
    setQty("1");
    setRate("");
    setResults([]);
  };

  const save = async () => {
    if (!job?._id) return;
    setSaving(true);
    try {
      const res = await apiService.sendBillAsMechanic(
        job._id,
        lines.map((l) => ({ label: l.label, amount: l.amount, quantity: l.quantity, rate: l.rate })),
        discount
      );
      const invoiceNo = res.data?.bill?.invoiceNumber;
      notify?.(`Bill saved${invoiceNo ? ` (Invoice #${invoiceNo})` : ""}.`, "success");
      onSaved?.();
      onClose?.();
    } catch (err) {
      notify?.(err.response?.data?.message || "Could not save the bill", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Generate Bill</h3>
          <p className="text-sm text-gray-500">
            {job?.name} · {job?.serviceType || job?.taskType}
          </p>
        </div>

        <div className="p-5 space-y-2">
          {lines.map((l, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{l.label}</p>
                {l.quantity > 1 && (
                  <p className="text-xs text-gray-500">
                    {l.quantity} × ₹{l.rate}
                  </p>
                )}
              </div>
              <span className="font-semibold text-gray-900">₹{l.amount}</span>
              <button
                onClick={() => setLines((prev) => prev.filter((_, x) => x !== i))}
                className="text-red-600 hover:text-red-800 text-lg leading-none px-1"
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}

          {/* Add a line — search the catalogue or just type a part name */}
          <div className="relative pt-2">
            <div className="flex gap-2">
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Part / labour name"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="Qty"
                inputMode="numeric"
                className="w-16 border border-gray-200 rounded-lg px-2 py-2 text-sm"
              />
              <input
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="₹ rate"
                inputMode="decimal"
                className="w-24 border border-gray-200 rounded-lg px-2 py-2 text-sm"
              />
              <button
                onClick={addLine}
                className="bg-gray-900 text-white px-3 rounded-lg text-lg leading-none"
                title="Add line"
              >
                +
              </button>
            </div>

            {results.length > 0 && (
              <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                {results.map((p) => {
                  const price = p.discount ? Math.round(p.price * (1 - p.discount / 100)) : p.price;
                  return (
                    <button
                      key={p._id}
                      onClick={() => {
                        setLabel(p.name);
                        setRate(String(price));
                        setResults([]);
                      }}
                      className="w-full flex justify-between px-3 py-2 text-sm hover:bg-gray-50 text-left"
                    >
                      <span className="truncate mr-2">{p.name}</span>
                      <span className="font-semibold text-red-600 whitespace-nowrap">₹{price}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Discount */}
          <div className="pt-4 border-t border-gray-100 mt-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Discount</p>
            <div className="flex gap-2 mb-2">
              {[
                ["none", "None"],
                ["percent", "%"],
                ["amount", "₹"],
              ].map(([mode, text]) => (
                <button
                  key={mode}
                  onClick={() => {
                    setDiscountMode(mode);
                    setDiscountValue("");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                    discountMode === mode
                      ? "bg-red-600 text-white border-red-600"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {text}
                </button>
              ))}
            </div>

            {discountMode !== "none" && (
              <>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(discountMode === "percent" ? [5, 10, 15, 20] : [10, 50, 100, 200]).map((v) => (
                    <button
                      key={v}
                      onClick={() => setDiscountValue(String(v))}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        discountValue === String(v)
                          ? "bg-red-50 border-red-300 text-red-700"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {discountMode === "percent" ? `${v}%` : `₹${v}`}
                    </button>
                  ))}
                </div>
                <input
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountMode === "percent" ? "Custom %" : "Custom ₹"}
                  inputMode="decimal"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </>
            )}
          </div>

          {/* Totals */}
          <div className="pt-4 border-t border-gray-100 mt-4 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Sub Total</span>
              <span>₹{subTotal}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount</span>
                <span>− ₹{discount}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-1">
              <span>Total Payable</span>
              <span>₹{total}</span>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium text-sm hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || lines.length === 0}
            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm"
          >
            {saving ? "Saving…" : `Save Bill · ₹${total}`}
          </button>
        </div>
      </div>
    </div>
  );
}
