import { NextResponse } from 'next/server'
import { requireAuth, isAuthError } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'
import { getVisiblePool } from '@/lib/mundial'
import { poolMatchPredictionsSchema } from '@/lib/validations'

// GET /api/mundial/matches — partidos visibles + predicciones del usuario
export async function GET() {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) return authResult
  const { session } = authResult

  const pool = await getVisiblePool()
  if (!pool) return NextResponse.json({ data: [], entryStatus: null })

  const entry = await prisma.poolEntry.findUnique({
    where: { poolId_userId: { poolId: pool.id, userId: session.user.id } },
    select: { id: true, status: true },
  })

  // Solo partidos ya publicados (no SCHEDULED)
  const matches = await prisma.poolMatch.findMany({
    where: { poolId: pool.id, status: { not: 'SCHEDULED' } },
    orderBy: [{ order: 'asc' }, { kickoffAt: 'asc' }],
  })

  let predByMatch: Record<string, { homePredict: number; awayPredict: number; pointsEarned: number }> = {}
  if (entry) {
    const preds = await prisma.poolMatchPrediction.findMany({
      where: { entryId: entry.id },
    })
    predByMatch = Object.fromEntries(
      preds.map((p) => [
        p.matchId,
        { homePredict: p.homePredict, awayPredict: p.awayPredict, pointsEarned: p.pointsEarned },
      ])
    )
  }

  return NextResponse.json({
    data: matches.map((m) => ({
      id: m.id,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeFlag: m.homeFlag,
      awayFlag: m.awayFlag,
      phase: m.phase,
      groupName: m.groupName,
      kickoffAt: m.kickoffAt ? m.kickoffAt.toISOString() : null,
      status: m.status,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      myPrediction: predByMatch[m.id] ?? null,
    })),
    entryStatus: entry?.status ?? null,
    pointsConfig: {
      outcome: pool.matchPointsOutcome,
      exactBonus: pool.matchPointsExactBonus,
    },
  })
}

// PUT /api/mundial/matches — guardar predicciones de marcador (solo partidos OPEN)
export async function PUT(req: Request) {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) return authResult
  const { session } = authResult

  const pool = await getVisiblePool()
  if (!pool) return NextResponse.json({ error: 'No hay polla activa' }, { status: 404 })

  const entry = await prisma.poolEntry.findUnique({
    where: { poolId_userId: { poolId: pool.id, userId: session.user.id } },
  })
  if (!entry || entry.status !== 'CONFIRMED') {
    return NextResponse.json({ error: 'Tu inscripción no está confirmada' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = poolMatchPredictionsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Predicciones inválidas' }, { status: 400 })
  }

  // Solo aceptar partidos de esta polla que estén OPEN
  const openMatches = new Set(
    (await prisma.poolMatch.findMany({
      where: { poolId: pool.id, status: 'OPEN' },
      select: { id: true },
    })).map((m) => m.id)
  )

  const valid = parsed.data.predictions.filter((p) => openMatches.has(p.matchId))
  if (valid.length === 0) {
    return NextResponse.json({ error: 'No hay partidos abiertos para pronosticar' }, { status: 400 })
  }

  const ops = valid.map((p) =>
    prisma.poolMatchPrediction.upsert({
      where: { entryId_matchId: { entryId: entry.id, matchId: p.matchId } },
      create: {
        entryId: entry.id,
        matchId: p.matchId,
        homePredict: p.homePredict,
        awayPredict: p.awayPredict,
      },
      update: { homePredict: p.homePredict, awayPredict: p.awayPredict },
    })
  )
  await prisma.$transaction(ops)

  return NextResponse.json({ data: { saved: ops.length } })
}
