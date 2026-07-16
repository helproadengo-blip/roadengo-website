import React, { useMemo } from "react";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";

const MAP_CONTAINER_STYLE = { width: "100%", height: "420px", borderRadius: "0.5rem" };
const HARIDWAR_CENTER = { lat: 29.9457, lng: 78.1642 };
const AVAILABILITY_MARKER_COLOR = {
  available: "#16a34a",
  busy: "#dc2626",
  offline: "#9ca3af",
};

export default function FleetMapView({ mechanics }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "roadengo-google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const withLocation = useMemo(
    () =>
      (mechanics || []).filter(
        (m) => m.currentLocation?.latitude && m.currentLocation?.longitude
      ),
    [mechanics]
  );

  const center = withLocation.length
    ? { lat: withLocation[0].currentLocation.latitude, lng: withLocation[0].currentLocation.longitude }
    : HARIDWAR_CENTER;

  if (loadError) {
    return <p className="text-sm text-red-600">Could not load Google Maps.</p>;
  }
  if (!isLoaded) {
    return (
      <div style={MAP_CONTAINER_STYLE} className="flex items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">Loading map…</p>
      </div>
    );
  }

  return (
    <>
      <GoogleMap mapContainerStyle={MAP_CONTAINER_STYLE} center={center} zoom={withLocation.length ? 12 : 10}>
        {withLocation.map((m) => (
          <MarkerF
            key={m._id}
            position={{ lat: m.currentLocation.latitude, lng: m.currentLocation.longitude }}
            title={`${m.name} · ${m.availability}`}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: AVAILABILITY_MARKER_COLOR[m.availability] || AVAILABILITY_MARKER_COLOR.offline,
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            }}
          />
        ))}
      </GoogleMap>
      {withLocation.length === 0 && (
        <p className="text-sm text-gray-500 mt-2">No mechanics have shared their live location yet.</p>
      )}
    </>
  );
}
