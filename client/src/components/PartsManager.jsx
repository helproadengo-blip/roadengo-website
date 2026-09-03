import React, { useEffect, useMemo, useState } from "react";
import { apiService } from "../routing/apiClient";

const API_ORIGIN = "https://api.roadengo.com";
// A part at or below this many units is flagged for restocking.
const LOW_STOCK_AT = 50;

const emptyForm = {
  name: "", price: "", purchasePrice: "", discount: "", category: "",
  brand: "", sku: "", compatible: "", description: "", stock: "", inStock: true,
};

const money = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

function stockState(p) {
  const s = Number(p.stock || 0);
  if (s <= 0) return { label: "Out of Stock", cls: "text-red-600" };
  if (s <= LOW_STOCK_AT) return { label: "Low Stock", cls: "text-amber-600" };
  return { label: "In Stock", cls: "text-gray-500" };
}

/* Small inline icons — no icon package needed. */
const IconEye = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconPencil = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
  </svg>
);
const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

function StatCard({ icon, tint, label, value, sub, subCls = "text-gray-400" }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start gap-3">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${tint}`}>{icon}</span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 leading-tight mt-0.5">{value}</p>
          <p className={`text-[11px] mt-0.5 ${subCls}`}>{sub}</p>
        </div>
      </div>
    </div>
  );
}

export default function PartsManager({ showNotification }) {
  const [parts, setParts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [brand, setBrand] = useState("All Brands");
  const [stockStatus, setStockStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchParts = async () => {
    setLoading(true);
    try {
      // Admin list — includes purchasePrice, which customer routes never return.
      const res = await apiService.getPartsAdmin();
      setParts(res.data || []);
    } catch (err) {
      showNotification?.(err.response?.data?.message || "Failed to load parts", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
    apiService.getPartCategories().then((r) => setCategories(r.data?.categories || [])).catch(() => {});
    apiService.getPartBrands().then((r) => setBrands(r.data?.brands || [])).catch(() => {});
  }, []);

  // ---- stats across the whole catalogue (not just the current page) ----
  const stats = useMemo(() => {
    const total = parts.length;
    const out = parts.filter((p) => Number(p.stock || 0) <= 0).length;
    const low = parts.filter((p) => {
      const s = Number(p.stock || 0);
      return s > 0 && s <= LOW_STOCK_AT;
    }).length;
    const inStock = total - out - low;
    const value = parts.reduce((s, p) => s + Number(p.price || 0) * Number(p.stock || 0), 0);
    const pct = (n) => (total ? ((n / total) * 100).toFixed(total > 200 ? 2 : 1) + "% of total" : "—");
    return { total, out, low, inStock, value, pct };
  }, [parts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return parts.filter((p) => {
      if (q) {
        const hay = `${p.name} ${p.sku || ""} ${p.category || ""} ${p.brand || ""} ${p.compatible || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (category !== "All Categories" && p.category !== category) return false;
      if (brand !== "All Brands" && (p.brand || "") !== brand) return false;
      if (stockStatus !== "All" && stockState(p).label !== stockStatus) return false;
      return true;
    });
  }, [parts, search, category, brand, stockStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const clearFilters = () => {
    setSearch("");
    setCategory("All Categories");
    setBrand("All Brands");
    setStockStatus("All");
    setPage(1);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setPhotoFile(null);
    setPhotoPreview(null);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditingId(p._id);
    setForm({
      name: p.name || "", price: p.price ?? "", purchasePrice: p.purchasePrice ?? "",
      discount: p.discount ?? "", category: p.category || "", brand: p.brand || "",
      sku: p.sku || "", compatible: p.compatible || "", description: p.description || "",
      stock: p.stock ?? "", inStock: p.inStock !== false,
    });
    setPhotoFile(null);
    setPhotoPreview(p.photo ? `${API_ORIGIN}${p.photo}` : null);
    setShowForm(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.price === "") {
      showNotification?.("Part name and price are required", "error");
      return;
    }
    if (!form.category) {
      showNotification?.("Please choose a category", "error");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries({
        name: form.name.trim(), price: form.price,
        purchasePrice: form.purchasePrice === "" ? "" : form.purchasePrice,
        discount: form.discount || 0, category: form.category, brand: form.brand,
        sku: form.sku, compatible: form.compatible, description: form.description,
        stock: form.stock || 0, inStock: form.inStock,
      }).forEach(([k, v]) => fd.append(k, v));
      if (photoFile) fd.append("photo", photoFile);

      if (editingId) {
        await apiService.updatePart(editingId, fd);
        showNotification?.("Part updated.", "success");
      } else {
        await apiService.createPart(fd);
        showNotification?.("Part added.", "success");
      }
      setShowForm(false);
      fetchParts();
      apiService.getPartBrands().then((r) => setBrands(r.data?.brands || [])).catch(() => {});
    } catch (err) {
      showNotification?.(err.response?.data?.message || "Failed to save part", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try {
      await apiService.deletePart(p._id);
      showNotification?.("Part deleted.", "success");
      fetchParts();
    } catch (err) {
      showNotification?.(err.response?.data?.message || "Failed to delete part", "error");
    }
  };

  const selectCls =
    "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300";

  return (
    <div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
        <StatCard icon="📦" tint="bg-red-50" label="Total Parts" value={stats.total.toLocaleString("en-IN")} sub="All items" />
        <StatCard icon="✅" tint="bg-emerald-50" label="In Stock" value={stats.inStock.toLocaleString("en-IN")}
          sub={stats.pct(stats.inStock)} subCls="text-emerald-600 font-medium" />
        <StatCard icon="⚠️" tint="bg-amber-50" label="Low Stock" value={stats.low.toLocaleString("en-IN")} sub="Need attention" />
        <StatCard icon="🚫" tint="bg-red-50" label="Out of Stock" value={stats.out.toLocaleString("en-IN")} sub={stats.pct(stats.out)} />
        <StatCard icon="₹" tint="bg-blue-50" label="Inventory Value" value={money(stats.value)} sub="Total stock value" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div className="lg:col-span-2">
            <div className="relative">
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search part name, SKU, or vehicle…"
                className={selectCls + " pr-9"}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <IconSearch />
              </span>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Category</label>
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className={selectCls}>
              <option>All Categories</option>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Brand</label>
            <select value={brand} onChange={(e) => { setBrand(e.target.value); setPage(1); }} className={selectCls}>
              <option>All Brands</option>
              {brands.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Stock Status</label>
              <select value={stockStatus} onChange={(e) => { setStockStatus(e.target.value); setPage(1); }} className={selectCls}>
                <option>All</option>
                <option>In Stock</option>
                <option>Low Stock</option>
                <option>Out of Stock</option>
              </select>
            </div>
            <button
              onClick={clearFilters}
              className="px-5 py-2.5 rounded-lg border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 whitespace-nowrap"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Part Details", "Category", "Price", "Discount", "Stock", "Status", "Action"].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pageRows.map((p) => {
                const st = stockState(p);
                const hasDisc = Number(p.discount) > 0;
                const sell = hasDisc ? Math.round(p.price * (1 - p.discount / 100)) : p.price;
                const saved = p.price - sell;
                const margin = p.purchasePrice != null ? sell - p.purchasePrice : null;
                return (
                  <tr key={p._id} className="hover:bg-gray-50/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {p.photo
                            ? <img src={`${API_ORIGIN}${p.photo}`} alt={p.name} className="w-full h-full object-contain" />
                            : <span className="text-gray-300 text-xs">No photo</span>}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">{p.name}</p>
                          {p.sku && <p className="text-xs text-gray-500 mt-0.5">SKU: {p.sku}</p>}
                          {p.compatible && (
                            <p className="text-xs text-gray-500 max-w-[220px]">Compatible: {p.compatible}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{p.category || "—"}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="font-bold text-gray-900">{money(sell)}</p>
                      {hasDisc && <p className="text-xs text-gray-400 line-through">{money(p.price)}</p>}
                      {/* Cost and margin are admin-only — the customer API never returns them. */}
                      {p.purchasePrice != null && (
                        <p className="text-[11px] text-gray-400 mt-1">
                          Cost {money(p.purchasePrice)} ·{" "}
                          <span className={margin >= 0 ? "text-emerald-600" : "text-red-600"}>
                            {margin >= 0 ? "+" : ""}{money(margin)}
                          </span>
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {hasDisc ? (
                        <>
                          <span className="inline-flex px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold">
                            {p.discount}% OFF
                          </span>
                          <p className="text-xs text-emerald-600 mt-1">Save {money(saved)}</p>
                        </>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="font-bold text-gray-900">{Number(p.stock || 0).toLocaleString("en-IN")}</p>
                      <p className={`text-xs ${st.cls}`}>{st.label}</p>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <span className={`w-2 h-2 rounded-full ${p.isActive !== false ? "bg-emerald-500" : "bg-gray-300"}`} />
                        <span className={p.isActive !== false ? "text-emerald-700" : "text-gray-500"}>
                          {p.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setViewing(p)} title="View"
                          className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 flex items-center justify-center">
                          <IconEye />
                        </button>
                        <button onClick={() => openEdit(p)} title="Edit"
                          className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center">
                          <IconPencil />
                        </button>
                        <button onClick={() => handleDelete(p)} title="Delete"
                          className="w-9 h-9 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center">
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {loading && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400">Loading parts…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <p className="text-3xl mb-2">🔩</p>
                    <p className="font-semibold text-gray-700">
                      {parts.length === 0 ? "No parts yet" : "No parts match these filters"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {parts.length === 0 ? 'Click "+ Add Spare Part" to create one.' : "Try clearing the filters."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: range, pagination, page size */}
        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * perPage + 1} to {Math.min(currentPage * perPage, filtered.length)} of{" "}
              {filtered.length.toLocaleString("en-IN")} results
            </p>

            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
                className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50">‹</button>
              {(() => {
                // First pages, an ellipsis, then the last — keeps the row short
                // even with hundreds of pages.
                const shown = new Set([1, 2, 3, 4, 5, totalPages, currentPage]);
                const nums = [...shown].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
                const out = [];
                let prev = 0;
                nums.forEach((n) => {
                  if (prev && n - prev > 1) out.push(<span key={`e${n}`} className="px-1 text-gray-400">…</span>);
                  out.push(
                    <button key={n} onClick={() => setPage(n)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium ${
                        n === currentPage ? "bg-red-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}>{n}</button>
                  );
                  prev = n;
                });
                return out;
              })()}
              <button onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
                className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50">›</button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Show</span>
              <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm">
                {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      <button onClick={openAdd}
        className="mt-5 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl shadow-sm">
        <span className="text-lg leading-none">＋</span> Add Spare Part
      </button>

      {/* View */}
      {viewing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setViewing(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-4">
              <div className="w-24 h-24 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                {viewing.photo
                  ? <img src={`${API_ORIGIN}${viewing.photo}`} alt={viewing.name} className="w-full h-full object-contain" />
                  : <span className="text-gray-300 text-xs">No photo</span>}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900">{viewing.name}</h3>
                <p className="text-sm text-gray-500">{viewing.category}{viewing.brand ? ` · ${viewing.brand}` : ""}</p>
                {viewing.sku && <p className="text-xs text-gray-500 mt-1">SKU: {viewing.sku}</p>}
              </div>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              {[
                ["Selling price", money(viewing.discount ? Math.round(viewing.price * (1 - viewing.discount / 100)) : viewing.price)],
                ["Listed price", money(viewing.price)],
                ["Purchase price", viewing.purchasePrice != null ? money(viewing.purchasePrice) : "—"],
                ["Discount", viewing.discount ? `${viewing.discount}%` : "—"],
                ["Stock", `${viewing.stock ?? 0} (${stockState(viewing).label})`],
                ["Compatible with", viewing.compatible || "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-gray-500">{k}</dt>
                  <dd className="font-medium text-gray-900 text-right">{v}</dd>
                </div>
              ))}
            </dl>
            {viewing.description && <p className="mt-3 text-sm text-gray-600">{viewing.description}</p>}
            <button onClick={() => setViewing(null)}
              className="mt-5 w-full py-2.5 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200">Close</button>
          </div>
        </div>
      )}

      {/* Add / Edit */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{editingId ? "Edit Part" : "Add Spare Part"}</h3>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-20 h-20 rounded-lg bg-gray-50 border flex items-center justify-center overflow-hidden">
                {photoPreview ? <img src={photoPreview} alt="preview" className="w-full h-full object-contain" />
                  : <span className="text-gray-400 text-xs">No photo</span>}
              </div>
              <label className="text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-blue-50">
                Upload Photo
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Part Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={selectCls} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Category *</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required className={selectCls}>
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Brand</label>
                  <input list="part-brands" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    placeholder="e.g. Hero" className={selectCls} />
                  <datalist id="part-brands">
                    {["Honda", "Hero", "TVS", "Bajaj", "Yamaha", "Royal Enfield", "Suzuki", "KTM", ...brands]
                      .filter((v, i, a) => v && a.indexOf(v) === i)
                      .map((b) => <option key={b} value={b} />)}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Selling Price ₹ *</label>
                  <input type="number" min="0" step="0.01" required value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })} className={selectCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Purchase Price ₹</label>
                  <input type="number" min="0" step="0.01" value={form.purchasePrice}
                    onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} className={selectCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Discount %</label>
                  <input type="number" min="0" max="100" value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: e.target.value })} className={selectCls} />
                </div>
              </div>

              {/* Live margin so a discount is never set below cost by accident. */}
              {form.price !== "" && form.purchasePrice !== "" && (() => {
                const sell = form.discount ? Math.round(form.price * (1 - form.discount / 100)) : Number(form.price);
                const m = sell - Number(form.purchasePrice);
                return (
                  <p className={`text-xs font-medium ${m >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    Customer pays {money(sell)} · margin {m >= 0 ? "+" : ""}{money(m)}
                    {m < 0 && " — this sells below cost"}
                  </p>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">SKU</label>
                  <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="BS-1001" className={selectCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Stock Quantity</label>
                  <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={selectCls} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Compatible With</label>
                <input value={form.compatible} onChange={(e) => setForm({ ...form, compatible: e.target.value })}
                  placeholder="Hero Splendor, HF Deluxe, Passion Pro" className={selectCls} />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={selectCls} />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.inStock} onChange={(e) => setForm({ ...form, inStock: e.target.checked })} />
                Available for sale
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button type="submit" disabled={saving}
                className="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                {saving ? "Saving…" : editingId ? "Save Changes" : "Add Part"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
