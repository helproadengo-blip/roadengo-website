import React, { useCallback, useEffect, useMemo, useState } from "react";
import { GoogleMap, MarkerF, InfoWindowF, useJsApiLoader } from "@react-google-maps/api";
import { apiService } from "../routing/apiClient";

const MAP_CONTAINER_STYLE = { width: "100%", height: "480px", borderRadius: "0.5rem" };
const HARIDWAR_CENTER = { lat: 29.9457, lng: 78.1642 };

// Bubble size/colour scale with how many bookings came from that spot, so
// hot areas stand out immediately when zoomed out.
function bubbleFor(count, max) {
  const ratio = max > 0 ? count / max : 0;
  const radius = 13 + Math.round(ratio * 22);
  const fill = ratio > 0.66 ? "#b91c1c" : ratio > 0.33 ? "#ea580c" : "#2563eb";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${radius * 2}" height="${radius * 2}">
      <circle cx="${radius}" cy="${radius}" r="${radius - 2}" fill="${fill}" fill-opacity="0.82"
              stroke="#ffffff" stroke-width="2"/>
      <text x="${radius}" y="${radius + 4}" text-anchor="middle"
            font-family="Helvetica, Arial, sans-serif" font-size="${count > 99 ? 11 : 12}"
            font-weight="bold" fill="#ffffff">${count}</text>
    </svg>`;
  return {
    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
    scaledSize: new window.google.maps.Size(radius * 2, radius * 2),
    anchor: new window.google.maps.Point(radius, radius),
  };
}

export default function BookingsMapView() {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "roadengo-google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [points, setPoints] = useState([]);
  const [summary, setSummary] = useState({ totalPlotted: 0, areas: 0 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  // Coarser buckets when zoomed out, finer when zoomed in — so "how many
  // bookings from this area" stays readable at every zoom level. Tracked via
  // the map's own "idle" event rather than a controlled `zoom` prop, because
  // feeding zoom back into the prop re-renders the map mid-init and it never
  // finishes drawing.
  const [zoom, setZoom] = useState(11);

  const precision = zoom >= 14 ? 4 : zoom >= 12 ? 3 : 2;

  const handleMapLoad = useCallback((map) => {
    map.addListener("idle", () => {
      const z = map.getZoom();
      if (typeof z === "number") setZoom(z);
    });
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiService
      .getBookingLocations(precision)
      .then((res) => {
        if (!alive) return;
        setPoints(res.data?.points || []);
        setSummary({
          totalPlotted: res.data?.totalPlotted || 0,
          areas: res.data?.areas || 0,
        });
      })
      .catch(() => alive && setPoints([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [precision]);

  const max = useMemo(() => points.reduce((m, p) => Math.max(m, p.count), 0), [points]);
  const center = points.length ? { lat: points[0].latitude, lng: points[0].longitude } : HARIDWAR_CENTER;

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
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span className="text-sm font-semibold text-gray-700">
          {summary.totalPlotted} bookings across {summary.areas} areas
        </span>
        {loading && <span className="text-xs text-gray-400">refreshing…</span>}
        <span className="ml-auto flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><i className="inline-block w-3 h-3 rounded-full bg-blue-600" /> Low</span>
          <span className="flex items-center gap-1"><i className="inline-block w-3 h-3 rounded-full bg-orange-600" /> Medium</span>
          <span className="flex items-center gap-1"><i className="inline-block w-3 h-3 rounded-full bg-red-700" /> High</span>
        </span>
      </div>

      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={11}
        onLoad={handleMapLoad}
      >
        {points.map((p, i) => (
          <MarkerF
            key={`${p.latitude},${p.longitude},${i}`}
            position={{ lat: p.latitude, lng: p.longitude }}
            icon={bubbleFor(p.count, max)}
            title={`${p.count} booking${p.count > 1 ? "s" : ""}`}
            onClick={() => setSelected(p)}
          />
        ))}

        {selected && (
          <InfoWindowF
            position={{ lat: selected.latitude, lng: selected.longitude }}
            onCloseClick={() => setSelected(null)}
          >
            <div className="text-xs leading-relaxed">
              <p className="font-bold text-gray-900 text-sm mb-1">{selected.count} bookings</p>
              <p className="text-gray-600 max-w-[220px]">{selected.address || "—"}</p>
              <p className="text-gray-500 mt-1">Completed: {selected.completed}</p>
              {selected.revenue > 0 && <p className="text-gray-500">Billing: ₹{selected.revenue}</p>}
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      {!loading && points.length === 0 && (
        <p className="text-sm text-gray-500 mt-2">No bookings with a location yet.</p>
      )}

      <div className="mt-4">
        <h4 className="text-sm font-bold text-gray-700 mb-2">Top booking areas</h4>
        <div className="bg-white rounded-lg border border-gray-100 divide-y divide-gray-100">
          {points.slice(0, 10).map((p, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2">
              <span className="w-8 text-sm font-bold text-gray-900">{p.count}</span>
              <span className="flex-1 text-sm text-gray-600 truncate">{p.address || "—"}</span>
              <span className="text-xs text-gray-400 whitespace-nowrap">{p.completed} done</span>
            </div>
          ))}
          {points.length === 0 && <p className="px-3 py-3 text-sm text-gray-400">No data yet.</p>}
        </div>
      </div>
    </>
  );
}
