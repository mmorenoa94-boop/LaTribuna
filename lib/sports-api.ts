const BASE_URL = process.env.SPORTS_API_URL ?? 'https://v3.football.api-sports.io'
const API_KEY = process.env.SPORTS_API_KEY!

async function fetchSports<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}/${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  const res = await fetch(url.toString(), {
    headers: {
      'x-apisports-key': API_KEY,
    },
    next: { revalidate: 60 }, // ISR 60 segundos
  })

  if (!res.ok) {
    throw new Error(`API-Football error: ${res.status} ${endpoint}`)
  }

  const data = await res.json()
  return data.response as T
}

export interface ApiFixture {
  fixture: {
    id: number
    date: string
    status: { short: string; elapsed: number | null }
    venue: { name: string }
  }
  league: { name: string; id: number }
  teams: {
    home: { id: number; name: string; logo: string }
    away: { id: number; name: string; logo: string }
  }
  goals: { home: number | null; away: number | null }
}

export async function getLiveMatches(): Promise<ApiFixture[]> {
  return fetchSports<ApiFixture[]>('fixtures', { live: 'all' })
}

export async function getFixturesByDate(date: string): Promise<ApiFixture[]> {
  return fetchSports<ApiFixture[]>('fixtures', { date, timezone: 'America/Bogota' })
}

export async function getFixture(id: string): Promise<ApiFixture> {
  const results = await fetchSports<ApiFixture[]>('fixtures', { id })
  return results[0]
}

export function mapApiFixtureStatus(short: string): string {
  const map: Record<string, string> = {
    '1H': 'LIVE', '2H': 'LIVE', 'ET': 'LIVE', 'BT': 'LIVE',
    'P': 'LIVE', 'LIVE': 'LIVE',
    'HT': 'HALFTIME',
    'FT': 'FINISHED', 'AET': 'FINISHED', 'PEN': 'FINISHED',
    'TBD': 'SCHEDULED', 'NS': 'SCHEDULED',
    'CANC': 'CANCELLED', 'ABD': 'CANCELLED',
  }
  return map[short] ?? 'SCHEDULED'
}
