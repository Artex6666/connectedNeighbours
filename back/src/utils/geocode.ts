/**
 * Géocodage via Nominatim (OpenStreetMap) — gratuit, sans clé.
 * Politique d'usage : User-Agent obligatoire, ~1 req/s. On l'utilise
 * ponctuellement (suggestion de quartier à l'inscription), donc c'est OK.
 */
export interface GeoPoint {
  lat: number;
  lng: number;
}

export async function geocodeAddress(address: string): Promise<GeoPoint | null> {
  if (!address || !address.trim()) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
      address,
    )}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BobConnect/1.0 (projet-annuel.lorisrameau.pro)' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { lat?: string; lon?: string }[];
    if (!Array.isArray(data) || data.length === 0 || !data[0].lat || !data[0].lon) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

/** Distance approximative (km) entre deux points (Haversine). */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}
