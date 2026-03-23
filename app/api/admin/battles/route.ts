import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — All battles (admin view)
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (session.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const battles = await prisma.battle.findMany({
    include: { _count: { select: { participants: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(battles)
}

// POST — Create battle
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (session.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const { name, zone, matchIds, prizeDesc, prizeAmount, startDate, endDate } = body

  if (!name || !zone || !matchIds || !startDate || !endDate) {
    return NextResponse.json({ error: 'name, zone, matchIds, startDate y endDate son requeridos' }, { status: 400 })
  }

  const battle = await prisma.battle.create({
    data: {
      name,
      zone,
      organizer: session.user.name ?? 'Admin',
      matchIds,
      prizeDesc: prizeDesc || null,
      prizeAmount: prizeAmount || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  })

  return NextResponse.json(battle, { status: 201 })
}
