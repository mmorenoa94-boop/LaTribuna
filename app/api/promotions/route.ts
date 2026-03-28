import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** GET /api/promotions — list promotions for the authenticated business */
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'NEGOCIO') return NextResponse.json({ error: 'Solo negocios' }, { status: 403 })

  const business = await prisma.business.findUnique({ where: { userId: session.user.id } })
  if (!business) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

  const promotions = await prisma.promotion.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(promotions)
}

/** POST /api/promotions — create a new promotion */
export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'NEGOCIO') return NextResponse.json({ error: 'Solo negocios' }, { status: 403 })

  const business = await prisma.business.findUnique({ where: { userId: session.user.id } })
  if (!business) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

  const body = await req.json()
  const { message, imageUrl, segment, channels, timing, scheduledAt } = body

  if (!message?.trim() || message.trim().length > 120) {
    return NextResponse.json({ error: 'Mensaje requerido (máx 120 caracteres)' }, { status: 400 })
  }

  const validSegments = ['ALL_IN_VENUE', 'LEAGUE_PLAYERS', 'VERIFIED_CONSUMERS', 'RECURRING']
  if (!validSegments.includes(segment)) {
    return NextResponse.json({ error: 'Segmento inválido' }, { status: 400 })
  }

  const validTimings = ['IMMEDIATE', 'HALFTIME', 'SCHEDULED']
  if (!validTimings.includes(timing)) {
    return NextResponse.json({ error: 'Timing inválido' }, { status: 400 })
  }

  if (!Array.isArray(channels) || channels.length === 0) {
    return NextResponse.json({ error: 'Al menos un canal requerido' }, { status: 400 })
  }

  if (timing === 'SCHEDULED' && !scheduledAt) {
    return NextResponse.json({ error: 'Fecha programada requerida' }, { status: 400 })
  }

  const promotion = await prisma.promotion.create({
    data: {
      businessId: business.id,
      message: message.trim(),
      imageUrl: imageUrl || null,
      segment,
      channels,
      timing,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: timing === 'IMMEDIATE' ? 'DRAFT' : timing === 'SCHEDULED' ? 'SCHEDULED' : 'DRAFT',
    },
  })

  return NextResponse.json(promotion, { status: 201 })
}
