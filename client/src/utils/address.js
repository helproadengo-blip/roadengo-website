/**
 * Turn whatever a job carries as its place into text that is safe to render.
 *
 * `location` is a string on emergencies but a `{ latitude, longitude }` object
 * on appointments. Rendering it straight into JSX threw "Objects are not valid
 * as a React child", which blanked the whole mechanic dashboard the moment a
 * job with coordinates appeared — which is every geocoded booking.
 */
export function jobAddress(job, fallback = 'Address not provided') {
  if (!job) return fallback;

  for (const value of [job.address, job.location]) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  // No written address — show the coordinates rather than nothing, so the
  // mechanic can still navigate.
  const coords = [job.location, job.coordinates].find(
    (c) => c && typeof c === 'object' && c.latitude != null && c.longitude != null
  );
  if (coords) {
    return `${Number(coords.latitude).toFixed(5)}, ${Number(coords.longitude).toFixed(5)}`;
  }

  return fallback;
}

/** Coordinates for a "navigate there" link, or null if the job has none. */
export function jobCoords(job) {
  const coords = [job?.location, job?.coordinates].find(
    (c) => c && typeof c === 'object' && c.latitude != null && c.longitude != null
  );
  return coords ? { latitude: Number(coords.latitude), longitude: Number(coords.longitude) } : null;
}
