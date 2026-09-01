import React, { useMemo, useState } from "react";
import { GoogleMap, MarkerF, InfoWindowF, useJsApiLoader } from "@react-google-maps/api";

const MAP_CONTAINER_STYLE = { width: "100%", height: "420px", borderRadius: "0.5rem" };
const HARIDWAR_CENTER = { lat: 29.9457, lng: 78.1642 };
const API_BASE = "https://api.roadengo.com";

// A mechanic is "On Job" when they have work in hand; the backend records that
// as availability 'busy'.
const SECTIONS = [
  { key: "available", label: "Online", dot: "bg-green-500", color: "#16a34a" },
  { key: "busy", label: "On Job", dot: "bg-amber-500", color: "#f59e0b" },
  { key: "offline", label: "Offline", dot: "bg-gray-400", color: "#9ca3af" },
];

function pinIcon(color) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34">
      <circle cx="17" cy="17" r="13" fill="${color}" stroke="#ffffff" stroke-width="3"/>
    </svg>`;
  return {
    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
    scaledSize: new window.google.maps.Size(34, 34),
    anchor: new window.google.maps.Point(17, 17),
  };
}

function MechanicAvatar({ mechanic, size = 40 }) {
  const photo = mechanic.location?.photo;
  if (photo) {
    return (
      <img
        src={`${API_BASE}${photo}`}
        alt={mechanic.name}
        className="rounded-full object-cover border border-gray-200"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-gray-200 text-gray-600 font-bold flex items-center justify-center"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {(mechanic.name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

export default function FleetMapView({ mechanics }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "roadengo-google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [section, setSection] = useState("available");
  const [selected, setSelected] = useState(null);

  const all = mechanics || [];
  const counts = useMemo(
    () =>
      SECTIONS.reduce((acc, s) => {
        acc[s.key] = all.filter((m) => (m.availability || "offline") === s.key).length;
        return acc;
      }, {}),
    [all]
  );

  const inSection = useMemo(
    () => all.filter((m) => (m.availability || "offline") === section),
    [all, section]
  );

  // Offline mechanics usually have a stale or missing pin, so the map only
  // plots those we actually have coordinates for.
  const plottable = useMemo(
    () => inSection.filter((m) => m.currentLocation?.latitude && m.currentLocation?.longitude),
    [inSection]
  );

  const active = SECTIONS.find((s) => s.key === section);
  const center = plottable.length
    ? { lat: plottable[0].currentLocation.latitude, lng: plottable[0].currentLocation.longitude }
    : HARIDWAR_CENTER;

  if (loadError) return <p className="text-sm text-red-600">Could not load Google Maps.</p>;
  if (!isLoaded) {
    return (
      <div style={MAP_CONTAINER_STYLE} className="flex items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">Loading map…</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => {
              setSection(s.key);
              setSelected(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              section === s.key
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
            {s.label}
            <span className={section === s.key ? "text-gray-300" : "text-gray-400"}>
              {counts[s.key] || 0}
            </span>
          </button>
        ))}
      </div>

      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={plottable.length ? 12 : 10}
      >
        {plottable.map((m) => (
          <MarkerF
            key={m._id}
            position={{ lat: m.currentLocation.latitude, lng: m.currentLocation.longitude }}
            icon={pinIcon(active.color)}
            title={m.name}
            onClick={() => setSelected(m)}
          />
        ))}

        {selected?.currentLocation?.latitude && (
          <InfoWindowF
            position={{
              lat: selected.currentLocation.latitude,
              lng: selected.currentLocation.longitude,
            }}
            onCloseClick={() => setSelected(null)}
          >
            <div className="flex items-center gap-2">
              <MechanicAvatar mechanic={selected} size={36} />
              <div className="text-xs">
                <p className="font-bold text-gray-900 text-sm">{selected.name}</p>
                <p className="text-gray-500">{selected.mechanicId || ""}</p>
                <p className="text-gray-500">{selected.phone || ""}</p>
              </div>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      {plottable.length === 0 && (
        <p className="text-sm text-gray-500 mt-2">
          {inSection.length === 0
            ? `No ${active.label.toLowerCase()} mechanics right now.`
            : `${inSection.length} ${active.label.toLowerCase()} mechanic(s), but none are sharing a live location.`}
        </p>
      )}

      <div className="mt-5">
        <h4 className="text-sm font-bold text-gray-800 mb-2">
          {active.label} Mechanics – {inSection.length}
        </h4>
        <div className="bg-white rounded-lg border border-gray-100 divide-y divide-gray-100">
          {inSection.map((m, i) => (
            <button
              key={m._id}
              onClick={() => m.currentLocation?.latitude && setSelected(m)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50"
            >
              <span className="w-5 text-xs text-gray-400">{i + 1}.</span>
              <MechanicAvatar mechanic={m} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{m.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {m.mechanicId || "—"}
                  {m.location?.city ? ` · ${m.location.city}` : ""}
                </p>
              </div>
              {m.currentLocation?.latitude ? (
                <span className="text-xs text-blue-600 font-semibold whitespace-nowrap">On map</span>
              ) : (
                <span className="text-xs text-gray-400 whitespace-nowrap">No location</span>
              )}
            </button>
          ))}
          {inSection.length === 0 && (
            <p className="px-3 py-4 text-sm text-gray-400">No mechanics in this section.</p>
          )}
        </div>
      </div>
    </>
  );
}
