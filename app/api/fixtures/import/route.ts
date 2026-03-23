import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getFixturesByDate, fixtureToMatch } from '@/lib/api-football'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/fixtures/import
 * Importa un fixture de API-Football y lo vincula a una liga.
 * Body: { externalId: string, leagueId: string, date: string, season: number }
 */
export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { externalId, leagueId, date, season } = await req.json()
  if (!externalId || !leagueId) {
    return NextResponse.json({ error: 'externalId y leagueId son requeridos' }, { status: 400 })
  }

  // Verificar que el usuario es creador de la liga
  const league = await prisma.league.findUnique({ where: { id: leagueId } })
  if (!league || league.creatorId !== session.user.id) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  // Buscar el fixture en API-Football si no está en BD
  let match = await prisma.match.findUnique({ where: { externalId } })

  if (!match) {
    const d = date ?? new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
    const fixtures = await getFixturesByDate({
      date: d,
      season: season ?? new Date().getFullYear(),
      timezone: 'America/Bogota',
    })
    const fixture = fixtures.find((f) => String(f.fixture.id) === externalId)
    if (!fixture) {
      return NextResponse.json({ error: 'Fixture no encontrado en API-Football' }, { status: 404 })
    }
    const data = fixtureToMatch(fixture)
    match = await prisma.match.create({ data })
  }

  // Vincular a la liga
  await prisma.leagueMatch.upsert({
    where: { leagueId_matchId: { leagueId, matchId: match.id } },
    create: { leagueId, matchId: match.id },
    update: {},
  })

  return NextResponse.json({
    ...match,
    kickoffAt: match.kickoffAt.toISOString(),
    questionCount: 0,
  }, { status: 201 })
}
