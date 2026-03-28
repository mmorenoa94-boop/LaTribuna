import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET — All unique members across all leagues owned by this business
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const business = await prisma.business.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!business) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim().toLowerCase() ?? ''
  const leagueFilter = searchParams.get('league') ?? ''

  // Get all league memberships for this business's leagues
  const whereClause: Record<string, unknown> = {
    league: { businessId: business.id },
  }
  if (leagueFilter) {
    whereClause.leagueId = leagueFilter
  }

  const memberships = await prisma.leagueMember.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          city: true,
          favoriteTeam: true,
          image: true,
          createdAt: true,
        },
      },
      league: {
        select: { id: true, name: true },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })

  // Group by user: one row per unique user, with array of leagues
  const userMap = new Map<string, {
    id: string
    name: string
    email: string
    phone: string | null
    city: string | null
    favoriteTeam: string | null
    image: string | null
    registeredAt: string
    leagues: {
      id: string
      name: string
      status: string
      consumptionVerified: boolean
      totalPoints: number
      joinedAt: string
    }[]
  }>()

  for (const m of memberships) {
    const existing = userMap.get(m.user.id)
    const leagueEntry = {
      id: m.league.id,
      name: m.league.name,
      status: m.status,
      consumptionVerified: m.consumptionVerified,
      totalPoints: m.totalPoints,
      joinedAt: m.joinedAt.toISOString(),
    }

    if (existing) {
      existing.leagues.push(leagueEntry)
    } else {
      userMap.set(m.user.id, {
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        phone: m.user.phone,
        city: m.user.city,
        favoriteTeam: m.user.favoriteTeam,
        image: m.user.image,
        registeredAt: m.user.createdAt.toISOString(),
        leagues: [leagueEntry],
      })
    }
  }

  let audience = Array.from(userMap.values())

  // Client search filter (name or email)
  if (search) {
    audience = audience.filter(
      (u) =>
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        (u.phone && u.phone.includes(search))
    )
  }

  // Get all leagues for this business (for filter dropdown)
  const leagues = await prisma.league.findMany({
    where: { businessId: business.id },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({
    audience,
    leagues,
    total: audience.length,
  })
}
