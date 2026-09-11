import React, { useCallback, useEffect, useState } from "react";
import { apiService } from "../routing/apiClient";

const money = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

/**
 * The parts the admin has issued to this mechanic, and how many are left.
 * Quantities drop automatically when the mechanic uses a part on a bill, so
 * this always shows what is actually in their bag — same list as the app's
 * "My Parts" tab.
 */
export default function MechanicMyParts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiService.getMyStock();
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load your parts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = data?.stock || [];
  const inHand = rows.filter((r) => r.quantity > 0);
  const usedUp = rows.filter((r) => r.quantity === 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">🔩 My Parts Inventory</h3>
          <p className="text-sm text-gray-500">Parts issued to you by the admin</p>
        </div>
        <button
          onClick={load}
          className="text-sm font-semibold text-red-600 hover:text-red-800"
          disabled={loading}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      <div className="p-6">
        {error && <p className="text-red-600 text-sm">{error}</p>}

        {!error && !loading && rows.length === 0 && (
          <p className="text-gray-500 text-sm">
            No parts have been issued to you yet. Once the admin bills parts to your ID, they will show
            here.
          </p>
        )}

        {rows.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Part types</p>
                <p className="text-xl font-bold text-gray-900">{inHand.length}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Items in hand</p>
                <p className="text-xl font-bold text-gray-900">{data.totalItems}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Value</p>
                <p className="text-xl font-bold text-gray-900">{money(data.totalValue)}</p>
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    {["Part", "SKU", "Qty left", "Rate"].map((h) => (
                      <th key={h} className="text-left font-semibold px-4 py-2 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...inHand, ...usedUp].map((r) => (
                    <tr key={r._id} className={r.quantity === 0 ? "text-gray-400" : ""}>
                      <td className="px-4 py-2 font-medium">{r.name}</td>
                      <td className="px-4 py-2">{r.sku || "—"}</td>
                      <td className="px-4 py-2 font-semibold">
                        {r.quantity === 0 ? "Used up" : r.quantity}
                      </td>
                      <td className="px-4 py-2">{money(r.rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
