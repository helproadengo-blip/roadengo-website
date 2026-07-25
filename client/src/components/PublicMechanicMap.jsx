import React, { useMemo } from "react";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%", borderRadius: "1rem" };
const HARIDWAR_CENTER = { lat: 29.9457, lng: 78.1642 };

// Illustrative "mechanics near you" pins for the public marketing homepage —
// real per-mechanic live GPS is only exposed after login (Fleet Map in the
// admin dashboard, and the customer's own booking-tracking screen), not on
// this public page.
const NEARBY_OFFSETS = [
  { lat: 0.012, lng: -0.01 },
  { lat: 0.006, lng: 0.014 },
  { lat: -0.01, lng: 0.02 },
  { lat: -0.014, lng: -0.006 },
];

export default function PublicMechanicMap() {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "roadengo-google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const pins = useMemo(
    () => NEARBY_OFFSETS.map((o) => ({ lat: HARIDWAR_CENTER.lat + o.lat, lng: HARIDWAR_CENTER.lng + o.lng })),
    []
  );

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-2xl">
        <p className="text-sm text-red-600">Could not load map.</p>
      </div>
    );
  }
  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-2xl">
        <p className="text-sm text-gray-500">Loading map…</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER_STYLE}
      center={HARIDWAR_CENTER}
      zoom={12}
      options={{ disableDefaultUI: true, zoomControl: true }}
    >
      <MarkerF
        position={HARIDWAR_CENTER}
        icon={{
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: "#2563eb",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        }}
      />
      {pins.map((p, i) => (
        <MarkerF
          key={i}
          position={p}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#dc2626",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          }}
        />
      ))}
    </GoogleMap>
  );
}
