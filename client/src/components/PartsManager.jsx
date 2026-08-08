import React, { useEffect, useState } from "react";
import { apiService } from "../routing/apiClient";

const emptyForm = { name: "", price: "", discount: "", category: "", description: "", inStock: true };

export default function PartsManager({ showNotification }) {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchParts = async () => {
    setLoading(true);
    try {
      const res = await apiService.getParts();
      setParts(res.data || []);
    } catch (err) {
      showNotification?.(err.response?.data?.message || "Failed to load parts", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, []);

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
      name: p.name || "",
      price: p.price ?? "",
      discount: p.discount ?? "",
      category: p.category || "",
      description: p.description || "",
      inStock: p.inStock !== false,
    });
    setPhotoFile(null);
    setPhotoPreview(p.photo ? `https://api.roadengo.com${p.photo}` : null);
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
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("price", form.price);
      fd.append("discount", form.discount || 0);
      fd.append("category", form.category);
      fd.append("description", form.description);
      fd.append("inStock", form.inStock);
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

  const filtered = parts.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search parts…"
          className="w-full sm:w-72 border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
        <button
          onClick={openAdd}
          className="bg-red-700 hover:bg-red-800 text-white text-sm font-semibold px-4 py-2 rounded-lg whitespace-nowrap"
        >
          + Add Part
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    {p.photo ? (
                      <img src={`https://api.roadengo.com${p.photo}`} alt={p.name} className="w-10 h-10 object-cover rounded-md border" />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 text-xs">—</div>
                    )}
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">{p.name}</td>
                  <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{p.category || "—"}</td>
                  <td className="px-4 py-2 text-gray-900 font-semibold whitespace-nowrap">₹{p.price}</td>
                  <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{p.discount ? `${p.discount}%` : "—"}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${p.inStock ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {p.inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="text-xs font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg px-2 py-1">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(p)} className="text-xs font-semibold text-red-600 hover:text-red-800 border border-red-200 rounded-lg px-2 py-1">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-400 text-sm">
                    No parts yet. Click "+ Add Part" to create one.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-400 text-sm">
                    Loading…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{editingId ? "Edit Part" : "Add New Part"}</h3>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 rounded-lg bg-gray-100 border flex items-center justify-center overflow-hidden">
                {photoPreview ? (
                  <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-xs">No photo</span>
                )}
              </div>
              <label className="text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-blue-50">
                Upload Photo
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Part Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Category</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Brakes, Engine, Electrical"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.inStock}
                  onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                />
                In Stock
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-800 disabled:opacity-50"
              >
                {saving ? "Saving…" : editingId ? "Save Changes" : "Add Part"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
