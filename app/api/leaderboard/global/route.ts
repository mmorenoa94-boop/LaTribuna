import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET — Global leaderboard by XP (weekly, monthly, all-time)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  // TODO: implement period filtering (week, month)
  // const period = searchParams.get('period') ?? 'all'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)

  // For all-time, just order by XP
  // For weekly/monthly, we'd need to track XP changes over time
  // For now, use all-time XP as the primary leaderboard
  const users = await prisma.user.findMany({
    where: { role: 'HINCHA' },
    select: {
      id: true,
      name: true,
      image: true,
      level: true,
      xp: true,
      streak: true,
      city: true,
      favoriteTeam: true,
    },
    orderBy: { xp: 'desc' },
    take: limit,
  })

  const ranked = users.map((u, i) => ({ ...u, rank: i + 1 }))

  return NextResponse.json(ranked)
}
