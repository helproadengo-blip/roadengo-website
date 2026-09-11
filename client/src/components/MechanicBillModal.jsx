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
    {
      label: "Visit / Inspection Charge",
      quantity: 1,
      rate: job?.cost || 349,
      discountMode: "none",
      discountValue: "",
    },
  ]);
  // Which line's discount editor is open.
  const [discountOpen, setDiscountOpen] = useState(null);
  const [label, setLabel] = useState("");
  const [qty, setQty] = useState("1");
  const [rate, setRate] = useState("");
  // The catalogue part the typed line came from, if any — sent with the bill so
  // the mechanic's issued stock is drawn down automatically.
  const [pickedPart, setPickedPart] = useState(null);
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

  // Every part or service can be discounted on its own. `gross` is before its
  // discount, `amount` after — the bill's sub-total is the sum of `amount`, so
  // the figures on screen always add up to what the customer pays.
  const priced = useMemo(
    () =>
      lines.map((l) => {
        const gross = Number(l.rate || 0) * Number(l.quantity || 1);
        const v = parseFloat(l.discountValue);
        let lineDiscount = 0;
        if (v > 0) {
          if (l.discountMode === "percent") lineDiscount = Math.round((gross * Math.min(v, 100)) / 100);
          else if (l.discountMode === "amount") lineDiscount = Math.min(gross, Math.round(v));
        }
        return { ...l, gross, lineDiscount, amount: Math.max(0, gross - lineDiscount) };
      }),
    [lines]
  );

  const lineDiscountTotal = useMemo(
    () => priced.reduce((s, l) => s + l.lineDiscount, 0),
    [priced]
  );

  const subTotal = useMemo(() => priced.reduce((s, l) => s + l.amount, 0), [priced]);

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
    setLines((prev) => [
      ...prev,
      {
        label: label.trim(),
        quantity: q,
        rate: r,
        discountMode: "none",
        discountValue: "",
        part: pickedPart,
      },
    ]);
    setPickedPart(null);
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
        priced.map((l) => ({
          label: l.label,
          amount: l.amount,
          quantity: l.quantity,
          rate: l.rate,
          discountMode: l.discountMode,
          discountValue: parseFloat(l.discountValue) || 0,
          part: l.part || undefined,
        })),
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
          {priced.map((l, i) => (
            <div key={i} className="bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{l.label}</p>
                  <p className="text-xs text-gray-500">
                    {l.quantity} × ₹{l.rate}
                    {l.lineDiscount > 0 && (
                      <span className="text-green-700 font-semibold">
                        {" "}
                        · −₹{l.lineDiscount}
                        {l.discountMode === "percent" ? ` (${l.discountValue}%)` : ""}
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  {l.lineDiscount > 0 && (
                    <p className="text-xs text-gray-400 line-through">₹{l.gross}</p>
                  )}
                  <span className="font-semibold text-gray-900">₹{l.amount}</span>
                </div>
                <button
                  onClick={() => setDiscountOpen(discountOpen === i ? null : i)}
                  className={`text-xs font-semibold px-2 py-1 rounded border ${
                    l.lineDiscount > 0
                      ? "border-green-300 text-green-700 bg-green-50"
                      : "border-gray-300 text-gray-600 hover:bg-white"
                  }`}
                  title="Discount this item"
                >
                  %
                </button>
                <button
                  onClick={() => {
                    setLines((prev) => prev.filter((_, x) => x !== i));
                    setDiscountOpen(null);
                  }}
                  className="text-red-600 hover:text-red-800 text-lg leading-none px-1"
                  title="Remove"
                >
                  ×
                </button>
              </div>

              {/* This item's own discount */}
              {discountOpen === i && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex gap-1.5">
                    {["none", "percent", "amount"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() =>
                          setLines((prev) =>
                            prev.map((x, n) =>
                              n === i
                                ? { ...x, discountMode: mode, discountValue: mode === "none" ? "" : x.discountValue }
                                : x
                            )
                          )
                        }
                        className={`flex-1 text-xs font-semibold py-1.5 rounded border ${
                          l.discountMode === mode
                            ? "bg-gray-900 text-white border-gray-900"
                            : "bg-white text-gray-600 border-gray-300"
                        }`}
                      >
                        {mode === "none" ? "No discount" : mode === "percent" ? "%" : "₹"}
                      </button>
                    ))}
                  </div>

                  {l.discountMode !== "none" && (
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-1.5">
                        {(l.discountMode === "percent" ? [5, 10, 15, 20] : [10, 50, 100, 200]).map((v) => (
                          <button
                            key={v}
                            onClick={() =>
                              setLines((prev) =>
                                prev.map((x, n) => (n === i ? { ...x, discountValue: String(v) } : x))
                              )
                            }
                            className={`text-xs font-semibold px-3 py-1.5 rounded border ${
                              String(l.discountValue) === String(v)
                                ? "bg-red-600 text-white border-red-600"
                                : "bg-white text-gray-700 border-gray-300"
                            }`}
                          >
                            {l.discountMode === "percent" ? `${v}%` : `₹${v}`}
                          </button>
                        ))}
                      </div>
                      <input
                        aria-label={`Custom discount for ${l.label}`}
                        inputMode="decimal"
                        value={l.discountValue}
                        onChange={(e) =>
                          setLines((prev) =>
                            prev.map((x, n) =>
                              n === i ? { ...x, discountValue: e.target.value.replace(/[^0-9.]/g, "") } : x
                            )
                          )
                        }
                        placeholder={l.discountMode === "percent" ? "Custom %" : "Custom ₹"}
                        className="mt-2 w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Add a line — search the catalogue or just type a part name */}
          <div className="relative pt-2">
            <div className="flex gap-2">
              <input
                value={label}
                onChange={(e) => {
                  setLabel(e.target.value);
                  // Typing a different name breaks the link to the picked part.
                  setPickedPart(null);
                }}
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
                        setPickedPart(p._id);
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
            {lineDiscountTotal > 0 && (
              <>
                <div className="flex justify-between text-gray-500">
                  <span>Items before discount</span>
                  <span>₹{subTotal + lineDiscountTotal}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Item discounts</span>
                  <span>− ₹{lineDiscountTotal}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Sub Total</span>
              <span>₹{subTotal}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Bill discount</span>
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
