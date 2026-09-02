import React, { useCallback, useEffect, useState } from "react";
import { apiService } from "../routing/apiClient";

/**
 * Unassigned bookings any mechanic can grab — the website twin of the app's
 * "New Job" screen. First accept wins; a 409 means someone else got there
 * first, which is normal rather than an error.
 */
export default function MechanicOpenJobs({ onAccepted, notify }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);

  const load = useCallback(async () => {
    try {
      const list = await apiService.getAllOpenJobs();
      setJobs(Array.isArray(list) ? list : []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Keep the pool fresh so two mechanics don't stare at a job that's gone.
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  const accept = async (job) => {
    setAccepting(job._id);
    try {
      await apiService.acceptJob(job._id, job.taskType);
      notify?.("Job accepted. It's now in your jobs list.", "success");
      setJobs((prev) => prev.filter((j) => j._id !== job._id));
      onAccepted?.();
    } catch (err) {
      const status = err.response?.status;
      notify?.(
        status === 409
          ? "Another mechanic accepted this job first."
          : err.response?.data?.message || "Could not accept this job",
        status === 409 ? "info" : "error"
      );
      load();
    } finally {
      setAccepting(null);
    }
  };

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading available jobs…</p>;

  if (!jobs.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
        <p className="text-3xl mb-2">🔧</p>
        <p className="font-semibold text-gray-800">No open jobs right now</p>
        <p className="text-sm text-gray-500 mt-1">
          New bookings appear here automatically — keep this page open.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => {
        const emergency = job.taskType === "emergency";
        return (
          <div
            key={job._id}
            className={`bg-white rounded-xl border p-4 ${emergency ? "border-red-200" : "border-gray-100"}`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="font-bold text-gray-900">{job.name}</p>
                <p className="text-sm text-gray-500">
                  {emergency ? job.issueDescription : job.serviceType} · {job.bikeModel || "—"}
                </p>
              </div>
              <span
                className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${
                  emergency ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {emergency ? "EMERGENCY" : "DOORSTEP"}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-1">
              📍 {emergency ? job.location : job.address}
            </p>
            {!emergency && job.serviceDate && (
              <p className="text-sm text-gray-500 mb-1">
                🗓️ {new Date(job.serviceDate).toLocaleDateString("en-IN")} · {job.serviceTime || ""}
              </p>
            )}

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => accept(job)}
                disabled={accepting === job._id}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm"
              >
                {accepting === job._id ? "Accepting…" : "Accept Job"}
              </button>
              {job.phone && (
                <a
                  href={`tel:${job.phone}`}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Call
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
