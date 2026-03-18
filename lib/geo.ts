/**
 * Calcula la distancia entre dos coordenadas usando la fórmula de Haversine.
 * @returns distancia en metros
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6_371_000 // radio de la Tierra en metros
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Verifica si el usuario está dentro del radio del local.
 */
export function isWithinVenue(
  userLat: number,
  userLng: number,
  venueLat: number,
  venueLng: number,
  radiusMeters: number
): boolean {
  return haversineDistance(userLat, userLng, venueLat, venueLng) <= radiusMeters
}
