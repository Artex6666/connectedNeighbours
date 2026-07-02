import { Request, Response } from 'express';
import { success, error } from '../utils/response.utils';
import { geocodeAddress, distanceKm, type GeoPoint } from '../utils/geocode';
import Neighborhood from '../models/Neighborhood.model';
import User from '../models/User.model';

type LngLat = [number, number];
type Ring = LngLat[];

function isValidRing(ring: unknown): ring is Ring {
  if (!Array.isArray(ring) || ring.length < 4) return false;
  for (const point of ring) {
    if (!Array.isArray(point) || point.length !== 2) return false;
    const [lng, lat] = point as [unknown, unknown];
    if (typeof lng !== 'number' || typeof lat !== 'number') return false;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return false;
  }
  const [firstLng, firstLat] = ring[0];
  const [lastLng, lastLat] = ring[ring.length - 1];
  return firstLng === lastLng && firstLat === lastLat;
}

function validatePolygon(polygon: unknown): { ok: true; ring: Ring } | { ok: false; message: string } {
  if (!polygon || typeof polygon !== 'object') return { ok: false, message: 'polygon manquant' };
  const p = polygon as { type?: unknown; coordinates?: unknown };
  if (p.type !== 'Polygon') return { ok: false, message: 'polygon.type doit être "Polygon"' };
  if (!Array.isArray(p.coordinates) || p.coordinates.length === 0) {
    return { ok: false, message: 'polygon.coordinates doit être un tableau non vide' };
  }
  const ring = p.coordinates[0];
  if (!isValidRing(ring)) {
    return { ok: false, message: 'Anneau invalide : 4 points minimum, fermé (premier=dernier), [lng,lat] dans les bornes' };
  }
  return { ok: true, ring };
}

function pointInRing(point: LngLat, ring: Ring): boolean {
  let inside = false;
  const [x, y] = point;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 0) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function ringsOverlap(a: Ring, b: Ring): boolean {
  for (const point of a) {
    if (pointInRing(point, b)) return true;
  }
  for (const point of b) {
    if (pointInRing(point, a)) return true;
  }
  return false;
}

export async function listNeighborhoods(_req: Request, res: Response) {
  const neighborhoods = await Neighborhood.find()
    .sort({ createdAt: -1 })
    .populate('adminId', 'firstName lastName email');
  return success(res, neighborhoods);
}

export async function getNeighborhood(req: Request, res: Response) {
  const neighborhood = await Neighborhood.findById(req.params.id).populate(
    'adminId',
    'firstName lastName email',
  );
  if (!neighborhood) return error(res, 'Quartier introuvable', 404);
  return success(res, neighborhood);
}

export async function createNeighborhood(req: Request, res: Response) {
  const { name, description, polygon } = req.body as {
    name?: string;
    description?: string;
    polygon?: unknown;
  };

  if (!name || typeof name !== 'string' || !name.trim()) {
    return error(res, 'Le nom du quartier est requis', 400);
  }

  const validation = validatePolygon(polygon);
  if (!validation.ok) return error(res, validation.message, 400);

  const existing = await Neighborhood.find().select('name polygon').lean();
  for (const other of existing) {
    if (ringsOverlap(validation.ring, other.polygon.coordinates[0] as Ring)) {
      return error(res, `Le polygone chevauche le quartier "${other.name}"`, 409);
    }
  }

  const created = await Neighborhood.create({
    name: name.trim(),
    description: description?.trim() ?? '',
    polygon: { type: 'Polygon', coordinates: [validation.ring] },
    adminId: req.user!._id,
  });

  return success(res, created, 201);
}

export async function updateNeighborhood(req: Request, res: Response) {
  const { id } = req.params;
  const { name, description, polygon } = req.body as {
    name?: string;
    description?: string;
    polygon?: unknown;
  };

  const current = await Neighborhood.findById(id);
  if (!current) return error(res, 'Quartier introuvable', 404);

  if (polygon !== undefined) {
    const validation = validatePolygon(polygon);
    if (!validation.ok) return error(res, validation.message, 400);

    const others = await Neighborhood.find({ _id: { $ne: id } }).select('name polygon').lean();
    for (const other of others) {
      if (ringsOverlap(validation.ring, other.polygon.coordinates[0] as Ring)) {
        return error(res, `Le polygone chevauche le quartier "${other.name}"`, 409);
      }
    }

    current.polygon = { type: 'Polygon', coordinates: [validation.ring] };
  }

  if (typeof name === 'string' && name.trim()) current.name = name.trim();
  if (typeof description === 'string') current.description = description.trim();

  await current.save();
  return success(res, current);
}

export async function deleteNeighborhood(req: Request, res: Response) {
  const { id } = req.params;
  const linked = await User.countDocuments({ neighborhoodId: id });
  if (linked > 0) {
    return error(res, `Impossible de supprimer : ${linked} habitant(s) rattaché(s)`, 409);
  }
  const deleted = await Neighborhood.findByIdAndDelete(id);
  if (!deleted) return error(res, 'Quartier introuvable', 404);
  return success(res, { message: 'Quartier supprimé' });
}

// ─── Suggestion de quartier (géocodage adresse → quartiers proches) ──────────────

function ringCentroid(ring: Ring): GeoPoint {
  const n = ring.length;
  const sum = ring.reduce((acc, [lng, lat]) => ({ lng: acc.lng + lng, lat: acc.lat + lat }), { lng: 0, lat: 0 });
  return { lng: sum.lng / n, lat: sum.lat / n };
}

/**
 * Géocode l'adresse de l'utilisateur (ou ?address=) et renvoie les quartiers
 * triés par proximité, avec le quartier "par défaut" = celui qui contient le
 * point (sinon le plus proche).
 */
export async function suggestNeighborhoods(req: Request, res: Response) {
  const me = await User.findById(req.user!._id).select('address');
  const address = ((req.query.address as string) || me?.address || '').trim();
  const point = await geocodeAddress(address);

  const hoods = await Neighborhood.find().select('name description polygon').lean();

  const list = hoods
    .map((h) => {
      const ring = h.polygon.coordinates[0] as Ring;
      const contains = point ? pointInRing([point.lng, point.lat], ring) : false;
      const dist = point ? distanceKm(point, ringCentroid(ring)) : null;
      return {
        _id: h._id,
        name: h.name,
        description: h.description,
        contains,
        distanceKm: dist === null ? null : Math.round(dist * 10) / 10,
      };
    })
    .sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));

  const def = list.find((r) => r.contains) ?? list[0] ?? null;

  return success(res, {
    geocoded: Boolean(point),
    defaultId: def?._id ?? null,
    neighborhoods: list,
  });
}
