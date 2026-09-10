import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiService } from "../routing/apiClient";

const money = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

/**
 * Issue spare parts from the main catalogue to a mechanic.
 *
 * The parts physically move: the quantity leaves the warehouse and lands in
 * that mechanic's own inventory, which then draws down automatically whenever
 * they use a part on a customer's bill.
 */
const BillToMechanic = ({ mechanics = [], showNotification }) => {
  const [mechanicId, setMechanicId] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [lines, setLines] = useState([]);
  const [issuing, setIssuing] = useState(false);

  const [stock, setStock] = useState(null);
  const [loadingStock, setLoadingStock] = useState(false);
  const debounce = useRef(null);

  const loadStock = useCallback(async (id) => {
    if (!id) {
      setStock(null);
      return;
    }
    setLoadingStock(true);
    try {
      const res = await apiService.getMechanicStock(id);
      setStock(res.data);
    } catch {
      setStock(null);
    } finally {
      setLoadingStock(false);
    }
  }, []);

  useEffect(() => {
    loadStock(mechanicId);
  }, [mechanicId, loadStock]);

  // Search the catalogue as the admin types.
  useEffect(() => {
    clearTimeout(debounce.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return undefined;
    }
    debounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiService.getPartsAdmin();
        const all = res.data?.parts || res.data || [];
        const needle = q.toLowerCase();
        setResults(
          all
            .filter((p) =>
              `${p.name} ${p.sku || ""} ${p.brand || ""} ${p.category || ""}`.toLowerCase().includes(needle)
            )
            .slice(0, 8)
        );
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(debounce.current);
  }, [query]);

  const addPart = (part) => {
    setQuery("");
    setResults([]);
    setLines((prev) => {
      if (prev.some((l) => l.part === part._id)) return prev;
      return [
        ...prev,
        {
          part: part._id,
          name: part.name,
          available: Number(part.stock || 0),
          quantity: 1,
          rate: Number(part.purchasePrice ?? part.price ?? 0),
        },
      ];
    });
  };

  const setLine = (id, patch) =>
    setLines((prev) => prev.map((l) => (l.part === id ? { ...l, ...patch } : l)));
  const removeLine = (id) => setLines((prev) => prev.filter((l) => l.part !== id));

  const total = useMemo(
    () => lines.reduce((s, l) => s + Number(l.quantity || 0) * Number(l.rate || 0), 0),
    [lines]
  );

  const overStocked = lines.filter((l) => Number(l.quantity) > l.available);

  const issue = async () => {
    if (!mechanicId) return showNotification?.("Choose a mechanic first.", "error");
    if (lines.length === 0) return showNotification?.("Add at least one part.", "error");
    if (overStocked.length) {
      return showNotification?.(`Not enough stock for ${overStocked[0].name}.`, "error");
    }

    setIssuing(true);
    try {
      const res = await apiService.issuePartsToMechanic(
        mechanicId,
        lines.map((l) => ({ part: l.part, quantity: Number(l.quantity), rate: Number(l.rate) }))
      );
      showNotification?.(res.data?.message || "Parts issued.", "success");
      setLines([]);
      await loadStock(mechanicId);
    } catch (err) {
      showNotification?.(err?.response?.data?.message || "Could not issue the parts.", "error");
    } finally {
      setIssuing(false);
    }
  };

  const selected = mechanics.find((m) => m._id === mechanicId);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mt-6">
      <h3 className="text-lg font-bold text-gray-900">Bill to Mechanic</h3>
      <p className="text-sm text-gray-500 mt-1">
        Issue spare parts to a mechanic. The stock moves into their inventory and comes back down
        automatically when they use a part on a customer's bill.
      </p>

      <div className="mt-5">
        <label htmlFor="btm-mech" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Mechanic
        </label>
        <select
          id="btm-mech"
          value={mechanicId}
          onChange={(e) => setMechanicId(e.target.value)}
          className="w-full sm:max-w-md border border-gray-300 rounded-lg px-3 py-2.5"
        >
          <option value="">Choose a mechanic…</option>
          {mechanics.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name} {m.mechanicId ? `· ${m.mechanicId}` : ""}
            </option>
          ))}
        </select>
      </div>

      {mechanicId && (
        <>
          {/* Part search */}
          <div className="mt-5 relative">
            <label htmlFor="btm-search" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Add parts
            </label>
            <input
              id="btm-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the catalogue by name, SKU or brand"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
            />
            {searching && <p className="text-xs text-gray-400 mt-1">Searching…</p>}
            {results.length > 0 && (
              <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {results.map((p) => (
                  <li key={p._id}>
                    <button
                      type="button"
                      onClick={() => addPart(p)}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex justify-between gap-3"
                    >
                      <span>
                        <span className="font-medium text-gray-900">{p.name}</span>
                        {p.sku && <span className="text-gray-400 text-xs ml-2">{p.sku}</span>}
                      </span>
                      <span className={Number(p.stock) > 0 ? "text-gray-500 text-sm" : "text-red-600 text-sm"}>
                        {Number(p.stock || 0)} left
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Lines to issue */}
          {lines.length > 0 && (
            <div className="mt-5 border border-gray-200 rounded-lg overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    {["Part", "Available", "Qty", "Rate", "Amount", ""].map((h) => (
                      <th key={h} className="text-left font-semibold px-3 py-2 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lines.map((l) => {
                    const over = Number(l.quantity) > l.available;
                    return (
                      <tr key={l.part}>
                        <td className="px-3 py-2 font-medium text-gray-900">{l.name}</td>
                        <td className={`px-3 py-2 ${over ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                          {l.available}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            aria-label={`Quantity for ${l.name}`}
                            inputMode="numeric"
                            value={l.quantity}
                            onChange={(e) =>
                              setLine(l.part, { quantity: e.target.value.replace(/[^0-9]/g, "") })
                            }
                            className={`w-20 border rounded px-2 py-1.5 ${
                              over ? "border-red-400 bg-red-50" : "border-gray-300"
                            }`}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            aria-label={`Rate for ${l.name}`}
                            inputMode="decimal"
                            value={l.rate}
                            onChange={(e) =>
                              setLine(l.part, { rate: e.target.value.replace(/[^0-9.]/g, "") })
                            }
                            className="w-24 border border-gray-300 rounded px-2 py-1.5"
                          />
                        </td>
                        <td className="px-3 py-2 font-semibold whitespace-nowrap">
                          {money(Number(l.quantity || 0) * Number(l.rate || 0))}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => removeLine(l.part)}
                            className="text-red-600 hover:text-red-800 font-semibold"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {lines.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <p className="text-lg font-bold text-gray-900">Total {money(total)}</p>
              <button
                type="button"
                onClick={issue}
                disabled={issuing || overStocked.length > 0}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold px-6 py-3 rounded-xl"
              >
                {issuing ? "Issuing…" : `Issue to ${selected?.name || "mechanic"}`}
              </button>
            </div>
          )}

          {/* What the mechanic already carries */}
          <div className="mt-7">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              {selected?.name}&rsquo;s parts inventory
            </h4>
            {loadingStock ? (
              <p className="text-gray-500 mt-3">Loading…</p>
            ) : !stock || stock.stock.length === 0 ? (
              <p className="text-gray-500 mt-3">This mechanic is not carrying any parts yet.</p>
            ) : (
              <>
                <div className="mt-3 overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        {["Part", "SKU", "Quantity", "Rate", "Value"].map((h) => (
                          <th key={h} className="text-left font-semibold px-3 py-2 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stock.stock.map((r) => (
                        <tr key={r._id} className={r.quantity === 0 ? "text-gray-400" : ""}>
                          <td className="px-3 py-2 font-medium">{r.name}</td>
                          <td className="px-3 py-2">{r.sku || "—"}</td>
                          <td className="px-3 py-2 font-semibold">{r.quantity}</td>
                          <td className="px-3 py-2">{money(r.rate)}</td>
                          <td className="px-3 py-2">{money(r.quantity * r.rate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {stock.totalItems} item(s) in hand · {money(stock.totalValue)} value
                </p>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default BillToMechanic;
