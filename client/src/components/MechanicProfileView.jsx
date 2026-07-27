import React, { useMemo, useState } from "react";
import { apiService } from "../routing/apiClient";

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function bookingIdOf(item) {
  return `BK-${(item._id || "").slice(-4).toUpperCase()}`;
}

function isSameMechanic(a, mechanicId) {
  const am = a.assignedMechanic;
  if (!am) return false;
  return (typeof am === "object" ? am._id : am) === mechanicId;
}

function ProgressBar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="font-semibold text-gray-900">{value}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

export default function MechanicProfileView({ mechanic, appointments = [], onBack, onRefresh, showNotification }) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [showResetPw, setShowResetPw] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [edit, setEdit] = useState({
    name: mechanic.name || "",
    phone: mechanic.phone || "",
    city: mechanic.location?.city || "",
    experience: mechanic.experience || 0,
  });
  const [busy, setBusy] = useState(false);

  const bookings = useMemo(
    () => appointments.filter((a) => isSameMechanic(a, mechanic._id)).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [appointments, mechanic._id]
  );

  const stats = useMemo(() => {
    const total = bookings.length;
    const completed = bookings.filter((b) => b.status === "completed").length;
    const cancelled = bookings.filter((b) => b.status === "cancelled").length;
    const todayStr = new Date().toDateString();
    const todayBilling = bookings.reduce((s, b) => s + (b.status === "completed" && b.completedAt && new Date(b.completedAt).toDateString() === todayStr ? (b.cost || 0) : 0), 0);
    const totalBilling = bookings.reduce((s, b) => s + (b.status === "completed" ? (b.cost || 0) : 0), 0);
    return { total, completed, cancelled, todayBilling, totalBilling };
  }, [bookings]);

  const completionRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
  const cancellationRate = stats.total ? Math.round((stats.cancelled / stats.total) * 100) : 0;
  const activeJobs = bookings.filter((b) => b.status === "confirmed" || b.status === "in-progress").length;

  const recentActivity = bookings.slice(0, 5).map((b) => ({
    id: b._id,
    date: b.completedAt || b.updatedAt || b.createdAt,
    text:
      b.status === "completed"
        ? `Completed a service (${bookingIdOf(b)})`
        : b.status === "cancelled"
        ? `Cancelled a service (${bookingIdOf(b)})`
        : `Booking ${bookingIdOf(b)} is ${b.status}`,
    ok: b.status !== "cancelled",
  }));

  const saveEdit = async () => {
    setBusy(true);
    try {
      await apiService.updateMechanic(mechanic._id, {
        name: edit.name,
        phone: edit.phone,
        experience: parseInt(edit.experience) || 0,
        location: { ...mechanic.location, city: edit.city },
      });
      showNotification?.("Mechanic updated successfully!", "success");
      setShowEdit(false);
      onRefresh?.();
    } catch (e) {
      showNotification?.(e.response?.data?.message || "Failed to update mechanic", "error");
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async () => {
    setBusy(true);
    try {
      await apiService.updateMechanic(mechanic._id, { isActive: !mechanic.isActive });
      showNotification?.(`Mechanic marked ${!mechanic.isActive ? "Active" : "Inactive"}.`, "success");
      onRefresh?.();
    } catch (e) {
      showNotification?.(e.response?.data?.message || "Failed to change status", "error");
    } finally {
      setBusy(false);
    }
  };

  const submitResetPassword = async () => {
    if (newPassword.length < 6) {
      showNotification?.("Password must be at least 6 characters", "error");
      return;
    }
    setBusy(true);
    try {
      await apiService.resetMechanicPassword(mechanic._id, newPassword);
      showNotification?.("Password reset successfully!", "success");
      setShowResetPw(false);
      setNewPassword("");
    } catch (e) {
      showNotification?.(e.response?.data?.message || "Failed to reset password", "error");
    } finally {
      setBusy(false);
    }
  };

  const deleteMechanic = async () => {
    if (!window.confirm(`Delete mechanic ${mechanic.name}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await apiService.deleteMechanic(mechanic._id);
      showNotification?.("Mechanic deleted.", "success");
      onBack();
      onRefresh?.();
    } catch (e) {
      showNotification?.(e.response?.data?.message || "Failed to delete mechanic", "error");
    } finally {
      setBusy(false);
    }
  };

  const STAT_CARDS = [
    { label: "Total Jobs", value: stats.total, icon: "📋", color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Completed Jobs", value: stats.completed, sub: stats.total ? `${completionRate}%` : "", icon: "✅", color: "text-green-600", bg: "bg-green-100" },
    { label: "Cancelled Jobs", value: stats.cancelled, sub: stats.total ? `${cancellationRate}%` : "", icon: "❌", color: "text-orange-600", bg: "bg-orange-100" },
    { label: "Average Rating", value: `${Number(mechanic.rating || 0).toFixed(1)}/5`, sub: `${mechanic.totalRatings || 0} Reviews`, icon: "⭐", color: "text-purple-600", bg: "bg-purple-100" },
    { label: "Today's Billing", value: `₹${stats.todayBilling}`, icon: "💰", color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Total Billing", value: `₹${stats.totalBilling}`, icon: "💵", color: "text-teal-600", bg: "bg-teal-100" },
  ];

  return (
    <div>
      <button onClick={onBack} className="text-sm font-semibold text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1">
        ← Back to All Mechanics
      </button>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className="bg-white rounded-lg shadow border border-gray-100 p-3 flex items-center gap-2">
            <span className={`w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 ${s.bg}`}>{s.icon}</span>
            <div className="min-w-0">
              <p className={`text-lg font-bold ${s.color} leading-tight`}>{s.value}</p>
              <p className="text-[11px] font-medium text-gray-600 truncate">{s.label}</p>
              {s.sub && <p className="text-[10px] text-gray-400">{s.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-4 gap-4 mb-4">
        {/* Profile card */}
        <div className="bg-white rounded-lg shadow border border-gray-100 p-5 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center mb-3">
              {mechanic.location?.photo ? (
                <img src={`https://api.roadengo.com${mechanic.location.photo}`} alt={mechanic.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-gray-400">👤</span>
              )}
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${mechanic.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {mechanic.isActive ? "Active" : "Inactive"}
            </span>
            <h3 className="font-bold text-gray-900">{mechanic.name}</h3>
            <p className="text-xs text-gray-500">⭐ {Number(mechanic.rating || 0).toFixed(1)} ({stats.total} Jobs)</p>
          </div>
          <div className="mt-4 space-y-1.5 text-xs text-gray-600">
            <p>Mechanic ID: <span className="font-medium text-gray-900">{mechanic.mechanicId}</span></p>
            <p>Mobile: <span className="font-medium text-gray-900">{mechanic.phone}</span></p>
            <p>Email: <span className="font-medium text-gray-900">{mechanic.email || "—"}</span></p>
            <p>Date of Birth: <span className="font-medium text-gray-900">{formatDate(mechanic.dateOfBirth)}</span></p>
            <p>Gender: <span className="font-medium text-gray-900">{mechanic.gender || "—"}</span></p>
            <p>Joined On: <span className="font-medium text-gray-900">{formatDate(mechanic.joinedDate)}</span></p>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setShowEdit(true)} className="flex-1 border border-red-200 text-red-600 text-xs font-semibold rounded-lg py-2 hover:bg-red-50">✏️ Edit</button>
            <button onClick={toggleStatus} disabled={busy} className="flex-1 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg py-2 hover:bg-gray-50">
              {mechanic.isActive ? "Deactivate" : "Activate"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-3 grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow border border-gray-100 p-4">
            <h4 className="text-sm font-bold text-gray-800 mb-2">📍 Address Details</h4>
            <p className="text-xs text-gray-600 leading-relaxed">{mechanic.currentAddress || "—"}</p>
            <p className="text-xs text-gray-600">City: {mechanic.location?.city || "—"}</p>
            <p className="text-xs text-gray-600">State: {mechanic.state || "—"}</p>
            <p className="text-xs text-gray-600">PIN Code: {mechanic.pinCode || "—"}</p>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-100 p-4">
            <h4 className="text-sm font-bold text-gray-800 mb-2">🛡️ KYC Details</h4>
            <p className="text-xs text-gray-600">Aadhaar Number: XXXX XXXX {mechanic.aadhaarLast4 || "----"}</p>
            <button onClick={() => setShowDocs(true)} className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800">
              👁 View Documents
            </button>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-100 p-4">
            <h4 className="text-sm font-bold text-gray-800 mb-2">🔧 Work Details</h4>
            <p className="text-xs text-gray-600">Experience: {mechanic.experience || 0} Years</p>
            <p className="text-xs text-gray-600">Vehicle Type: {mechanic.vehicleType || "—"}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {(mechanic.specialization || []).map((s) => (
                <span key={s} className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{s.replace(/-/g, " ")}</span>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-2">Service Area: {mechanic.location?.city}{mechanic.serviceAreaLocality ? `, ${mechanic.serviceAreaLocality}` : ""}</p>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-100 p-4">
            <h4 className="text-sm font-bold text-gray-800 mb-2">🏦 Bank Details</h4>
            <p className="text-xs text-gray-600">{mechanic.bankDetails?.accountHolderName || "—"}</p>
            <p className="text-xs text-gray-600">{mechanic.bankDetails?.bankName || "—"}</p>
            <p className="text-xs text-gray-600">A/C: {mechanic.bankDetails?.accountNumber || "—"}</p>
            <p className="text-xs text-gray-600">IFSC: {mechanic.bankDetails?.ifscCode || "—"}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg shadow border border-gray-100 p-4">
          <h4 className="text-sm font-bold text-gray-800 mb-3">🔒 Login Details</h4>
          <p className="text-xs text-gray-600">Login Mobile Number: {mechanic.phone}</p>
          <p className="text-xs text-gray-600 mb-3">Login Method: Mobile Number (OTP)</p>
          <button onClick={() => setShowResetPw(true)} className="text-xs font-semibold text-blue-600 hover:text-blue-800">🔑 Reset Password</button>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-100 p-4">
          <h4 className="text-sm font-bold text-gray-800 mb-3">📊 Performance Overview</h4>
          <div className="space-y-3">
            <ProgressBar label="Completion Rate" value={completionRate} color="bg-green-500" />
            <ProgressBar label="Cancellation Rate" value={cancellationRate} color="bg-red-500" />
            <ProgressBar label="Customer Rating" value={Math.round(((mechanic.rating || 0) / 5) * 100)} color="bg-yellow-500" />
          </div>
          <p className="text-[11px] text-gray-400 mt-2">{activeJobs} active job{activeJobs === 1 ? "" : "s"} right now</p>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-100 p-4">
          <h4 className="text-sm font-bold text-gray-800 mb-3">🕘 Recent Activity</h4>
          <div className="space-y-2">
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-start gap-2 text-xs">
                <span>{a.ok ? "✅" : "❌"}</span>
                <div>
                  <p className="text-gray-700">{a.text}</p>
                  <p className="text-gray-400 text-[10px]">{formatDate(a.date)}</p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && <p className="text-xs text-gray-400">No activity yet.</p>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h4 className="text-sm font-bold text-gray-800">All Bookings</h4>
          <button onClick={deleteMechanic} disabled={busy} className="text-xs font-semibold text-red-600 hover:text-red-800">🗑 Delete Mechanic</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Booking ID", "Customer Name", "Mobile Number", "Service Type", "Billing Amount", "Booking Date & Time", "Status", "Rating"].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.slice(0, 10).map((b) => (
                <tr key={b._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap font-semibold text-red-600">{bookingIdOf(b)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-900">{b.name}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-600">{b.phone}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-600">{b.serviceType}</td>
                  <td className="px-4 py-2 whitespace-nowrap font-semibold text-gray-900">₹{b.cost || 0}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-500 text-xs">{formatDateTime(b.createdAt)}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${b.status === "completed" ? "bg-green-100 text-green-800" : b.status === "cancelled" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}>
                      {(b.status || "").toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-600">{b.rating ? `${b.rating} ⭐` : "—"}</td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400 text-sm">No bookings for this mechanic yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Mechanic</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Full Name</label>
                <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Mobile Number</label>
                <input value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value.replace(/\D/g, "") })} maxLength={10} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">City</label>
                <input value={edit.city} onChange={(e) => setEdit({ ...edit, city: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Experience (Years)</label>
                <input type="number" min="0" value={edit.experience} onChange={(e) => setEdit({ ...edit, experience: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowEdit(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={saveEdit} disabled={busy} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                {busy ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {showResetPw && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reset Password</h3>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">New Password</label>
            <input type="password" minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} placeholder="Min 6 characters" />
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => { setShowResetPw(false); setNewPassword(""); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={submitResetPassword} disabled={busy} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                {busy ? "Saving…" : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View documents modal */}
      {showDocs && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">KYC Documents</h3>
              <button onClick={() => setShowDocs(false)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Aadhaar Front</p>
                {mechanic.location?.aadhaarFrontUrl ? (
                  <img src={`https://api.roadengo.com${mechanic.location.aadhaarFrontUrl}`} alt="Aadhaar front" className="w-full rounded-lg border border-gray-200" />
                ) : (
                  <div className="h-32 bg-gray-50 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">Not uploaded</div>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Aadhaar Back</p>
                {mechanic.location?.aadhaarBackUrl ? (
                  <img src={`https://api.roadengo.com${mechanic.location.aadhaarBackUrl}`} alt="Aadhaar back" className="w-full rounded-lg border border-gray-200" />
                ) : (
                  <div className="h-32 bg-gray-50 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">Not uploaded</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm";
