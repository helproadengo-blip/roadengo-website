import React, { useMemo } from "react";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";

const MAP_CONTAINER_STYLE = { width: "100%", height: "360px", borderRadius: "0.5rem" };
const HARIDWAR_CENTER = { lat: 29.9457, lng: 78.1642 };

export default function BookingsMapView({ appointments }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "roadengo-google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const withLocation = useMemo(
    () =>
      (appointments || []).filter(
        (a) => a.location?.latitude && a.location?.longitude
      ),
    [appointments]
  );

  const center = withLocation.length
    ? { lat: withLocation[0].location.latitude, lng: withLocation[0].location.longitude }
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
      <GoogleMap mapContainerStyle={MAP_CONTAINER_STYLE} center={center} zoom={withLocation.length ? 11 : 10}>
        {withLocation.map((a) => (
          <MarkerF
            key={a._id}
            position={{ lat: a.location.latitude, lng: a.location.longitude }}
            title={`${a.name} · ${a.serviceType}`}
          />
        ))}
      </GoogleMap>
      {withLocation.length === 0 && (
        <p className="text-sm text-gray-500 mt-2">
          No bookings with a live GPS pin yet (older bookings only have a typed address — see the list below).
        </p>
      )}
    </>
  );
}
