import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function verifyCreator(leagueId: string, userId: string) {
  const league = await prisma.league.findUnique({ where: { id: leagueId } })
  return league?.creatorId === userId ? league : null
}

// GET: partidos vinculados a la liga con conteo de preguntas
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const league = await verifyCreator(params.id, session.user.id)
  if (!league) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

  const leagueMatches = await prisma.leagueMatch.findMany({
    where: { leagueId: params.id },
    include: { match: true },
    orderBy: { match: { kickoffAt: 'asc' } },
  })

  const matchIds = leagueMatches.map((lm) => lm.matchId)
  const qCounts = matchIds.length
    ? await prisma.leagueQuestion.groupBy({
        by: ['matchId'],
        where: { leagueId: params.id, matchId: { in: matchIds } },
        _count: { id: true },
      })
    : []
  const countMap = Object.fromEntries(qCounts.map((q) => [q.matchId, q._count.id]))

  return NextResponse.json(
    leagueMatches.map((lm) => ({
      ...lm.match,
      questionCount: countMap[lm.matchId] ?? 0,
    }))
  )
}

// POST: crear partido manual + vincularlo a la liga
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const league = await verifyCreator(params.id, session.user.id)
  if (!league) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

  const body = await req.json()
  const { homeTeam, awayTeam, competition, venue, kickoffAt } = body

  if (!homeTeam?.trim() || !awayTeam?.trim() || !competition?.trim() || !kickoffAt) {
    return NextResponse.json(
      { error: 'homeTeam, awayTeam, competition y kickoffAt son requeridos' },
      { status: 400 }
    )
  }

  const externalId = `manual-${params.id}-${homeTeam}-${awayTeam}-${kickoffAt}`
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 191)

  const match = await prisma.match.upsert({
    where: { externalId },
    create: {
      externalId,
      homeTeam: homeTeam.trim(),
      awayTeam: awayTeam.trim(),
      competition: competition.trim(),
      venue: venue?.trim() || null,
      kickoffAt: new Date(kickoffAt),
      status: 'SCHEDULED',
    },
    update: {},
  })

  await prisma.leagueMatch.upsert({
    where: { leagueId_matchId: { leagueId: params.id, matchId: match.id } },
    create: { leagueId: params.id, matchId: match.id },
    update: {},
  })

  return NextResponse.json({ ...match, questionCount: 0 }, { status: 201 })
}
