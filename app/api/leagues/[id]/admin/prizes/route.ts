import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/leagues/[id]/admin/prizes
 * List all prizes for this league
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const prizes = await prisma.leaguePrize.findMany({
    where: { leagueId: params.id },
    orderBy: { position: 'asc' },
  })

  return NextResponse.json(prizes)
}

/**
 * POST /api/leagues/[id]/admin/prizes
 * Create a new prize (only league creator)
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const league = await prisma.league.findUnique({ where: { id: params.id } })
  if (!league || league.creatorId !== session.user.id) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const body = await req.json()
  const { position, description, pointsValue } = body

  if (!position || position < 1 || position > 20) {
    return NextResponse.json({ error: 'Posición inválida (1-20)' }, { status: 400 })
  }
  if (!description?.trim()) {
    return NextResponse.json({ error: 'Descripción requerida' }, { status: 400 })
  }

  // Check if position already exists
  const existing = await prisma.leaguePrize.findFirst({
    where: { leagueId: params.id, position },
  })
  if (existing) {
    return NextResponse.json({ error: `Ya existe un premio para la posición ${position}` }, { status: 400 })
  }

  const prize = await prisma.leaguePrize.create({
    data: {
      leagueId: params.id,
      position,
      description: description.trim(),
      pointsValue: pointsValue ?? 0,
    },
  })

  return NextResponse.json(prize, { status: 201 })
}

/**
 * PUT /api/leagues/[id]/admin/prizes
 * Bulk update/replace all prizes (only league creator)
 */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const league = await prisma.league.findUnique({ where: { id: params.id } })
  if (!league || league.creatorId !== session.user.id) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const body = await req.json()
  const { prizes } = body as {
    prizes: { position: number; description: string; pointsValue?: number }[]
  }

  if (!Array.isArray(prizes)) {
    return NextResponse.json({ error: 'prizes[] requerido' }, { status: 400 })
  }

  // Delete all existing prizes and recreate
  await prisma.leaguePrize.deleteMany({ where: { leagueId: params.id } })

  if (prizes.length > 0) {
    await prisma.leaguePrize.createMany({
      data: prizes
        .filter((p) => p.description?.trim() && p.position >= 1)
        .map((p) => ({
          leagueId: params.id,
          position: p.position,
          description: p.description.trim(),
          pointsValue: p.pointsValue ?? 0,
        })),
    })
  }

  const updated = await prisma.leaguePrize.findMany({
    where: { leagueId: params.id },
    orderBy: { position: 'asc' },
  })

  return NextResponse.json(updated)
}
