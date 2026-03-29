/**
 * Cliente para API-Football (api-sports.io)
 * Docs: https://www.api-football.com/documentation-v3
 */

const BASE_URL = 'https://v3.football.api-sports.io'

async function apiFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const key = process.env.API_FOOTBALL_KEY
  if (!key) throw new Error('API_FOOTBALL_KEY no configurada')

  const url = new URL(`${BASE_URL}${endpoint}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  const res = await fetch(url.toString(), {
    headers: {
      'x-apisports-key': key,
    },
    signal: controller.signal,
    // Cache de 5 minutos para fixtures del día
    next: { revalidate: 300 },
  })

  clearTimeout(timeout)

  if (!res.ok) throw new Error(`API-Football error: ${res.status}`)
  const json = await res.json()
  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(JSON.stringify(json.errors))
  }
  return json.response as T
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface ApiFixture {
  fixture: {
    id: number
    date: string // ISO 8601
    venue: { name: string | null; city: string | null } | null
    status: { short: string; long: string; elapsed: number | null }
  }
  league: {
    id: number
    name: string
    country: string
    logo: string
    round: string
  }
  teams: {
    home: { id: number; name: string; logo: string }
    away: { id: number; name: string; logo: string }
  }
  goals: { home: number | null; away: number | null }
  score: {
    halftime: { home: number | null; away: number | null }
    fulltime: { home: number | null; away: number | null }
  }
}

// ── Endpoints ──────────────────────────────────────────────────────────────

/**
 * Busca fixtures por fecha + opcionalmente por liga/equipo
 */
export async function getFixturesByDate(params: {
  date: string      // YYYY-MM-DD
  league?: number   // p.ej. 239 = Liga BetPlay
  season?: number   // p.ej. 2025
  team?: number     // ID de equipo
  timezone?: string
}): Promise<ApiFixture[]> {
  const p: Record<string, string> = {
    date: params.date,
    timezone: params.timezone ?? 'America/Bogota',
  }
  if (params.league) p.league = String(params.league)
  if (params.season) p.season = String(params.season)
  if (params.team)   p.team   = String(params.team)

  return apiFetch<ApiFixture[]>('/fixtures', p)
}

/**
 * Busca equipos por nombre
 */
export async function searchTeams(name: string): Promise<{ id: number; name: string; logo: string; country: string }[]> {
  const results = await apiFetch<{ team: { id: number; name: string; logo: string; country: string } }[]>(
    '/teams',
    { search: name }
  )
  return results.map((r) => r.team)
}

/**
 * Convierte un ApiFixture al formato Match del schema
 */
export function fixtureToMatch(f: ApiFixture) {
  const statusMap: Record<string, string> = {
    NS: 'SCHEDULED', TBD: 'SCHEDULED',
    '1H': 'LIVE', '2H': 'LIVE', ET: 'LIVE', P: 'LIVE',
    HT: 'HALFTIME',
    FT: 'FINISHED', AET: 'FINISHED', PEN: 'FINISHED',
    SUSP: 'CANCELLED', INT: 'CANCELLED', CANC: 'CANCELLED', ABD: 'CANCELLED', WO: 'FINISHED',
  }
  return {
    externalId: String(f.fixture.id),
    homeTeam: f.teams.home.name,
    awayTeam: f.teams.away.name,
    homeLogo: f.teams.home.logo || null,
    awayLogo: f.teams.away.logo || null,
    competition: `${f.league.name} — ${f.league.country}`,
    venue: f.fixture.venue?.name ?? null,
    kickoffAt: new Date(f.fixture.date),
    status: (statusMap[f.fixture.status.short] ?? 'SCHEDULED') as
      'SCHEDULED' | 'LIVE' | 'HALFTIME' | 'FINISHED' | 'CANCELLED',
    homeScore: f.goals.home,
    awayScore: f.goals.away,
    minutePlayed: f.fixture.status.elapsed,
  }
}

// Ligas comunes para Colombia
export const POPULAR_LEAGUES = [
  { id: 0,   name: 'Todas',                  flag: '🌐' },
  { id: 239, name: 'Liga BetPlay Dimayor',   flag: '🇨🇴' },
  { id: 240, name: 'Copa Colombia',          flag: '🇨🇴' },
  { id: 2,   name: 'Champions League',       flag: '🏆' },
  { id: 3,   name: 'Europa League',          flag: '🏆' },
  { id: 128, name: 'Liga Argentina',         flag: '🇦🇷' },
  { id: 71,  name: 'Brasileirao',            flag: '🇧🇷' },
  { id: 140, name: 'La Liga',               flag: '🇪🇸' },
  { id: 39,  name: 'Premier League',         flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 135, name: 'Serie A',               flag: '🇮🇹' },
]
