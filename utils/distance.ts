const EARTH_RADIUS_MILES = 3958.8
const EARTH_RADIUS_KM = 6371

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): { miles: number; km: number } {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return {
    miles: EARTH_RADIUS_MILES * c,
    km: EARTH_RADIUS_KM * c,
  }
}

// Decimal distances — used in share text
export function formatDistance(miles: number, km: number, unit: 'mi' | 'km'): string {
  if (unit === 'km') {
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
  }
  return miles < 1 ? `${Math.round(miles * 5280)} ft` : `${miles.toFixed(1)} mi`
}

// Whole-number distances — used in result UI (Section 4)
export function formatDistanceWhole(miles: number, km: number, unit: 'mi' | 'km'): string {
  if (unit === 'km') {
    const rounded = Math.round(km)
    return rounded < 1 ? `${Math.round(km * 1000)} m` : `${rounded} km`
  }
  const rounded = Math.round(miles)
  return miles < 1 ? `${Math.round(miles * 5280)} ft` : `${rounded} mi`
}
