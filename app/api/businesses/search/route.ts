import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET — Search businesses nearby (for check-in)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get('lat') ?? '')
  const lng = parseFloat(searchParams.get('lng') ?? '')
  const radius = parseInt(searchParams.get('radius') ?? '5000') // meters, default 5km
  const q = searchParams.get('q')

  // If we have coordinates, do a bounding-box pre-filter then haversine
  // Since Prisma doesn't support spatial queries, we fetch all in bounding box
  // and filter in JS.

  if (!isNaN(lat) && !isNaN(lng)) {
    // Rough bounding box (1 degree ~ 111km)
    const degreePerMeter = 1 / 111_000
    const latDelta = radius * degreePerMeter
    const lngDelta = radius * degreePerMeter / Math.cos(lat * Math.PI / 180)

    const businesses = await prisma.business.findMany({
      where: {
        lat: { gte: lat - latDelta, lte: lat + latDelta },
        lng: { gte: lng - lngDelta, lte: lng + lngDelta },
        ...(q && { name: { contains: q, mode: 'insensitive' as const } }),
      },
      select: {
        id: true,
        name: true,
        type: true,
        logoUrl: true,
        address: true,
        city: true,
        lat: true,
        lng: true,
        checkinRadius: true,
      },
    })

    // Calculate actual distance using haversine
    const { haversineDistance } = await import('@/lib/geo')

    const withDistance = businesses
      .map(b => ({
        ...b,
        distance: b.lat && b.lng ? Math.round(haversineDistance(lat, lng, b.lat, b.lng)) : null,
      }))
      .filter(b => b.distance !== null && b.distance <= radius)
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))

    return NextResponse.json(withDistance)
  }

  // Fallback: search by name/city
  const businesses = await prisma.business.findMany({
    where: {
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { city: { contains: q, mode: 'insensitive' as const } },
        ],
      }),
    },
    select: {
      id: true,
      name: true,
      type: true,
      logoUrl: true,
      address: true,
      city: true,
      lat: true,
      lng: true,
    },
    take: 20,
  })

  return NextResponse.json(businesses)
}
