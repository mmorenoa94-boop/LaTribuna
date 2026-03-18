import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'NEGOCIO') return NextResponse.json({ error: 'Solo negocios' }, { status: 403 })

  const business = await prisma.business.findUnique({
    where: { userId: session.user.id },
    include: {
      _count: { select: { leagues: true, checkins: true, promotions: true, rewards: true } },
    },
  })

  if (!business) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

  // Stats adicionales
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [checkinsToday, totalMembers] = await Promise.all([
    prisma.checkin.count({
      where: { businessId: business.id, checkedAt: { gte: today } },
    }),
    prisma.leagueMember.count({
      where: { league: { businessId: business.id } },
    }),
  ])

  return NextResponse.json({
    ...business,
    checkinsToday,
    totalMembers,
  })
}

const EDITABLE_FIELDS = [
  'name', 'address', 'city', 'phone', 'logoUrl',
  'checkinRadius', 'maxCapacity', 'lat', 'lng',
] as const

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'NEGOCIO') return NextResponse.json({ error: 'Solo negocios' }, { status: 403 })

  const business = await prisma.business.findUnique({ where: { userId: session.user.id } })
  if (!business) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

  const body = await req.json()
  const data: Record<string, unknown> = {}

  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) {
      if (field === 'checkinRadius' || field === 'maxCapacity') {
        data[field] = parseInt(body[field], 10) || null
      } else if (field === 'lat' || field === 'lng') {
        data[field] = parseFloat(body[field]) || null
      } else {
        data[field] = body[field]
      }
    }
  }

  const updated = await prisma.business.update({
    where: { id: business.id },
    data,
  })

  return NextResponse.json(updated)
}
