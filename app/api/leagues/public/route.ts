import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET — Public/business leagues for discovery
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const city = searchParams.get('city')
  const search = searchParams.get('q')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)

  const leagues = await prisma.league.findMany({
    where: {
      status: 'ACTIVE',
      type: { in: ['PUBLIC', 'BUSINESS'] },
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(city && {
        business: { city: { contains: city, mode: 'insensitive' as const } },
      }),
    },
    include: {
      business: { select: { name: true, logoUrl: true, city: true } },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json(leagues)
}
