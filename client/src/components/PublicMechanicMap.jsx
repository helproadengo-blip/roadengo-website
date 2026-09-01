import React, { useEffect, useMemo, useState } from "react";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import { apiService } from "../routing/apiClient";

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%", borderRadius: "1rem" };
const HARIDWAR_CENTER = { lat: 29.9457, lng: 78.1642 };

/**
 * Shows mechanics who are actually online right now. The API deliberately
 * returns coordinates only — no name, phone or id — so this public page can
 * plot live pins without exposing who any mechanic is.
 *
 * `onCount` lets the parent show the real number instead of a fixed one.
 */
export default function PublicMechanicMap({ onCount }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "roadengo-google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [center, setCenter] = useState(HARIDWAR_CENTER);
  const [pins, setPins] = useState([]);

  // Centre on the visitor if they allow it; otherwise stay on Haridwar.
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    let alive = true;
    apiService
      .getNearbyMechanics(center.lat, center.lng)
      .then((res) => {
        if (!alive) return;
        const list = res.data?.mechanics || [];
        setPins(list.map((m) => ({ lat: m.latitude, lng: m.longitude })));
        onCount?.(res.data?.count ?? list.length);
      })
      .catch(() => {
        if (!alive) return;
        setPins([]);
        onCount?.(0);
      });
    return () => {
      alive = false;
    };
  }, [center.lat, center.lng, onCount]);

  const icon = useMemo(() => {
    if (!isLoaded || !window.google) return undefined;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30">
        <circle cx="15" cy="15" r="12" fill="#E31E24" stroke="#ffffff" stroke-width="3"/>
      </svg>`;
    return {
      url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
      scaledSize: new window.google.maps.Size(30, 30),
      anchor: new window.google.maps.Point(15, 15),
    };
  }, [isLoaded]);

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
      center={center}
      zoom={12}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: "cooperative",
      }}
    >
      {pins.map((p, i) => (
        <MarkerF key={i} position={p} icon={icon} title="Mechanic online" />
      ))}
    </GoogleMap>
  );
}
