import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getFixturesByDate, type ApiFixture } from '@/lib/api-football'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/fixtures/search
 * Busca partidos en API-Football para importar al admin.
 * Params: date (YYYY-MM-DD), leagueId?, season?
 */
export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date     = searchParams.get('date') ?? new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
  const leagueId = searchParams.get('leagueId')
  const season   = searchParams.get('season') ?? String(new Date().getFullYear())

  if (!process.env.API_FOOTBALL_KEY) {
    return NextResponse.json({ error: 'API_FOOTBALL_KEY no configurada', fixtures: [] }, { status: 503 })
  }

  try {
    const params: Parameters<typeof getFixturesByDate>[0] = {
      date,
      season: Number(season),
      timezone: 'America/Bogota',
    }
    if (leagueId && leagueId !== '0') params.league = Number(leagueId)

    const fixtures = await getFixturesByDate(params)

    // Marcar cuáles ya están importados en nuestra BD
    const externalIds = fixtures.map((f) => String(f.fixture.id))
    const existing = await prisma.match.findMany({
      where: { externalId: { in: externalIds } },
      select: { externalId: true },
    })
    const importedSet = new Set(existing.map((m) => m.externalId))

    const result = fixtures.map((f: ApiFixture) => ({
      externalId: String(f.fixture.id),
      homeTeam:    f.teams.home.name,
      awayTeam:    f.teams.away.name,
      homeLogo:    f.teams.home.logo || null,
      awayLogo:    f.teams.away.logo || null,
      competition: f.league.name,
      country:     f.league.country,
      leagueId:    f.league.id,
      venue:       f.fixture.venue?.name ?? null,
      kickoffAt:   f.fixture.date,
      statusShort: f.fixture.status.short,
      alreadyImported: importedSet.has(String(f.fixture.id)),
    }))

    // Ordenar: primero LIVE, luego por hora
    result.sort((a, b) => {
      const live = ['1H', '2H', 'HT', 'ET', 'P']
      const aLive = live.includes(a.statusShort) ? 0 : 1
      const bLive = live.includes(b.statusShort) ? 0 : 1
      if (aLive !== bLive) return aLive - bLive
      return new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime()
    })

    return NextResponse.json({ fixtures: result, date, total: result.length })
  } catch (err) {
    console.error('[fixtures/search]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al consultar API-Football', fixtures: [] },
      { status: 502 }
    )
  }
}
