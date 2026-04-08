import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { haversineDistance } from '@/lib/geo'
import { rateLimit } from '@/lib/rate-limit'
import { checkAchievements } from '@/lib/achievements'

// POST — Create check-in (validates geolocation server-side)
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Rate limit: 5 check-ins per minute per user
    const rl = await rateLimit(`checkin:${session.user.id}`, 5, 60)
    if (!rl.success) {
      return NextResponse.json({ error: 'Demasiados intentos de check-in. Intenta en unos segundos.' }, { status: 429 })
    }

    const body = await req.json()
    const { businessId, lat, lng } = body

    if (!businessId || lat == null || lng == null) {
      return NextResponse.json({ error: 'businessId, lat y lng son requeridos' }, { status: 400 })
    }

    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 400 })
    }

    // Get business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, lat: true, lng: true, checkinRadius: true, name: true },
    })

    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    if (business.lat == null || business.lng == null) {
      return NextResponse.json({ error: 'El negocio no tiene ubicación configurada' }, { status: 400 })
    }

    // Validate distance with haversine
    const distance = haversineDistance(lat, lng, business.lat, business.lng)
    if (distance > business.checkinRadius) {
      return NextResponse.json(
        { error: `Estás a ${Math.round(distance)}m del negocio. Debes estar a menos de ${business.checkinRadius}m.` },
        { status: 403 }
      )
    }

    // Check for existing active check-in at same business (no checkout, within 8 hours)
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000)
    const existingCheckin = await prisma.checkin.findFirst({
      where: {
        userId: session.user.id,
        businessId,
        checkedOut: null,
        checkedAt: { gte: eightHoursAgo },
      },
    })

    if (existingCheckin) {
      return NextResponse.json(
        { error: 'Ya tienes un check-in activo en este negocio', checkin: existingCheckin },
        { status: 409 }
      )
    }

    // Create check-in
    const checkin = await prisma.checkin.create({
      data: {
        userId: session.user.id,
        businessId,
        lat,
        lng,
      },
    })

    // Check checkin achievement
    checkAchievements(session.user.id, 'checkin').catch(() => {})

    return NextResponse.json(checkin, { status: 201 })
  } catch (error) {
    console.error('[checkins] POST error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// GET — User's check-in history
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)
    const offset = parseInt(searchParams.get('offset') ?? '0')

    const checkins = await prisma.checkin.findMany({
      where: { userId: session.user.id },
      include: {
        business: { select: { id: true, name: true, logoUrl: true, address: true } },
      },
      orderBy: { checkedAt: 'desc' },
      take: limit,
      skip: offset,
    })

    return NextResponse.json(checkins)
  } catch (error) {
    console.error('[checkins] GET error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
