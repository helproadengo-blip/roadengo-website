import React, { useMemo, useState } from "react";
import { GoogleMap, OverlayViewF, OverlayView, useJsApiLoader } from "@react-google-maps/api";
import { Users, Navigation, Phone, Search } from "lucide-react";
import { PageHeader, SelectBox, DateRangePicker, rangeFor, Avatar, photoUrl, inRange } from "./ui";

// Roadengo's base in Haridwar — distances in the list are measured from here.
const HQ = { lat: 29.9269, lng: 78.1463 };
const MAP_STYLE = { width: "100%", height: "100%" };

const STATES = {
  available: { label: "Available", color: "#16a34a" },
  active: { label: "Active (On Service)", color: "#2563eb" },
  busy: { label: "Busy", color: "#dc2626" },
  offline: { label: "Offline", color: "#6b7280" },
};

function km(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** A teardrop pin with the mechanic's photo, coloured by their state. */
function PhotoPin({ mechanic, color, onClick, selected }) {
  const url = photoUrl(mechanic.location?.photo);
  return (
    <button
      type="button"
      onClick={onClick}
      title={mechanic.name}
      className="relative -translate-x-1/2 -translate-y-full"
      style={{ filter: "drop-shadow(0 3px 4px rgba(0,0,0,.25))" }}
    >
      <span
        className="block w-10 h-10 rounded-full p-[3px]"
        style={{ background: color, transform: selected ? "scale(1.15)" : "none", transition: "transform .15s" }}
      >
        {url ? (
          <img src={url} alt="" className="w-full h-full rounded-full object-cover bg-white" />
        ) : (
          <span className="w-full h-full rounded-full bg-white text-gray-700 text-xs font-bold flex items-center justify-center">
            {(mechanic.name || "?").slice(0, 1).toUpperCase()}
          </span>
        )}
      </span>
      <span
        className="block w-0 h-0 mx-auto -mt-0.5"
        style={{ borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderTop: `9px solid ${color}` }}
      />
    </button>
  );
}

export default function MechanicMapPage({ mechanics, appointments, emergencies, onView }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "roadengo-google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [filter, setFilter] = useState("all");
  const [listFilter, setListFilter] = useState("All Status");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [range, setRange] = useState(() => rangeFor("month"));
  const [map, setMap] = useState(null);

  // Who is on a job right now, and who has one lined up.
  const jobs = useMemo(() => {
    const inProgress = new Set();
    const lined = new Set();
    [...appointments, ...emergencies].forEach((b) => {
      const id = String(b.assignedMechanic?._id || b.assignedMechanic || "");
      if (!id) return;
      if (b.status === "in-progress") inProgress.add(id);
      else if (b.status === "confirmed" || b.status === "assigned") lined.add(id);
    });
    return { inProgress, lined };
  }, [appointments, emergencies]);

  // Jobs done in the picked period, shown under each name.
  const jobsInRange = useMemo(() => {
    const m = {};
    [...appointments, ...emergencies].forEach((b) => {
      const id = String(b.assignedMechanic?._id || b.assignedMechanic || "");
      if (id && inRange(b.serviceDate || b.createdAt, range)) m[id] = (m[id] || 0) + 1;
    });
    return m;
  }, [appointments, emergencies, range]);

  const rows = useMemo(
    () =>
      mechanics
        .filter((m) => m.isActive !== false)
        .map((m) => {
          const id = String(m._id);
          let state = "offline";
          if (jobs.inProgress.has(id)) state = "active";
          else if (m.availability === "busy" || jobs.lined.has(id)) state = "busy";
          else if (m.availability === "available") state = "available";

          const pos =
            m.currentLocation?.latitude && m.currentLocation?.longitude
              ? { lat: Number(m.currentLocation.latitude), lng: Number(m.currentLocation.longitude) }
              : null;
          return { ...m, state, pos, distance: pos ? km(HQ, pos) : null, periodJobs: jobsInRange[id] || 0 };
        }),
    [mechanics, jobs, jobsInRange]
  );

  const counts = useMemo(
    () => ({
      all: rows.length,
      online: rows.filter((r) => r.state !== "offline").length,
      active: rows.filter((r) => r.state === "active").length,
      available: rows.filter((r) => r.state === "available").length,
      busy: rows.filter((r) => r.state === "busy").length,
    }),
    [rows]
  );

  const matchesCard = (r) =>
    filter === "all" ||
    (filter === "online" && r.state !== "offline") ||
    r.state === filter;

  const q = search.trim().toLowerCase();
  const matchesSearch = (r) =>
    !q || [r.name, r.phone, r.location?.city].filter(Boolean).some((f) => String(f).toLowerCase().includes(q));

  const onMap = rows.filter((r) => r.pos && matchesCard(r) && matchesSearch(r));

  const listed = rows
    .filter((r) => matchesCard(r) && matchesSearch(r))
    .filter((r) => listFilter === "All Status" || STATES[r.state].label.startsWith(listFilter))
    .sort((a, b) => (a.distance ?? 1e9) - (b.distance ?? 1e9));

  const CARDS = [
    { key: "all", label: "All Mechanics", value: counts.all, icon: <Users className="w-5 h-5 text-gray-700" />, tint: "bg-white", ring: "bg-gray-100" },
    { key: "online", label: "Online Mechanics", value: counts.online, icon: <span className="w-4 h-4 rounded-full bg-emerald-500" />, tint: "bg-emerald-50/60", ring: "bg-emerald-100" },
    { key: "active", label: "Active Mechanics", value: counts.active, icon: <Navigation className="w-5 h-5 text-blue-600" />, tint: "bg-blue-50/70", ring: "bg-blue-100" },
    { key: "available", label: "Available Mechanics", value: counts.available, icon: <span className="w-4 h-4 rounded-full bg-emerald-500" />, tint: "bg-emerald-50/60", ring: "bg-emerald-100" },
    { key: "busy", label: "Busy Mechanics", value: counts.busy, icon: <span className="w-4 h-4 rounded-full bg-red-600" />, tint: "bg-red-50/70", ring: "bg-red-100" },
  ];

  const focus = (r) => {
    setSelected(r._id);
    if (map && r.pos) {
      map.panTo(r.pos);
      map.setZoom(14);
    }
  };

  return (
    <div>
      <PageHeader title="Mechanic Map" subtitle="Live location of all mechanics">
        <DateRangePicker value={range} onChange={setRange} />
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {CARDS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setFilter(c.key)}
            className={`text-left rounded-2xl border p-4 flex items-center gap-3 transition-all ${c.tint} ${
              filter === c.key ? "border-gray-900 shadow-md" : "border-gray-100 hover:shadow"
            }`}
          >
            <span className={`w-11 h-11 rounded-full flex items-center justify-center ${c.ring}`}>{c.icon}</span>
            <span>
              <span className="block text-sm text-gray-700">{c.label}</span>
              <span className="block text-2xl font-bold text-gray-900">{c.value}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-4" style={{ minHeight: 620 }}>
        {/* Map */}
        <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-100 min-h-[420px]">
          {loadError ? (
            <p className="p-6 text-sm text-red-600">Could not load Google Maps.</p>
          ) : !isLoaded ? (
            <p className="p-6 text-sm text-gray-500">Loading map…</p>
          ) : (
            <GoogleMap
              mapContainerStyle={MAP_STYLE}
              center={HQ}
              zoom={12}
              onLoad={setMap}
              options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
            >
              {onMap.map((r) => (
                <OverlayViewF key={r._id} position={r.pos} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                  <PhotoPin
                    mechanic={r}
                    color={STATES[r.state].color}
                    selected={selected === r._id}
                    onClick={() => setSelected(r._id)}
                  />
                </OverlayViewF>
              ))}
            </GoogleMap>
          )}

          <div className="absolute top-3 left-3 right-3 sm:right-auto sm:w-80">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search mechanic by name, mobile or area"
                aria-label="Search mechanic by name, mobile or area"
                className="w-full bg-white rounded-xl shadow pl-10 pr-3 py-2.5 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="absolute bottom-3 left-3 bg-white rounded-xl shadow px-4 py-2.5 flex flex-wrap gap-4 text-sm">
            {["available", "active", "busy", "offline"].map((k) => (
              <span key={k} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: STATES[k].color }} />
                {k === "active" ? "Active" : STATES[k].label}
              </span>
            ))}
          </div>

          {isLoaded && onMap.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="bg-white/90 rounded-xl px-4 py-2 text-sm text-gray-600 shadow">
                No mechanics with a live location in this view.
              </p>
            </div>
          )}
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-0">
          <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">
              {CARDS.find((c) => c.key === filter)?.label} ({listed.length})
            </h3>
            <SelectBox
              label="Filter list"
              value={listFilter}
              onChange={setListFilter}
              options={["All Status", "Available", "Active", "Busy", "Offline"]}
            />
          </div>
          <ul className="flex-1 overflow-y-auto divide-y divide-gray-50" style={{ maxHeight: 560 }}>
            {listed.length === 0 && <li className="px-4 py-10 text-center text-sm text-gray-500">No mechanics here.</li>}
            {listed.map((r) => (
              <li
                key={r._id}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${selected === r._id ? "bg-red-50/60" : "hover:bg-gray-50"}`}
                onClick={() => focus(r)}
              >
                <Avatar name={r.name} src={r.location?.photo} size={42} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{r.name}</p>
                  <p className="text-xs flex items-center gap-1.5" style={{ color: STATES[r.state].color }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: STATES[r.state].color }} />
                    {STATES[r.state].label}
                  </p>
                  {range.key !== "all" && (
                    <p className="text-[11px] text-gray-400">{r.periodJobs} job(s) this period</p>
                  )}
                </div>
                <span className="text-sm text-gray-600 w-14 text-right">
                  {r.distance != null ? `${r.distance.toFixed(1)} km` : "—"}
                </span>
                <a
                  href={`tel:${r.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Call ${r.name}`}
                  className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  <Phone className="w-4 h-4 text-gray-700" />
                </a>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView?.(r._id);
                  }}
                  className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-800"
                >
                  View
                </button>
              </li>
            ))}
          </ul>
          <p className="px-4 py-2 text-[11px] text-gray-400 border-t border-gray-50">Distance from Roadengo office, Haridwar</p>
        </div>
      </div>
    </div>
  );
}
