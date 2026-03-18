import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { BattleStatus } from '@prisma/client'

// GET — List battles (active/upcoming, optionally filter by zone)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const zone = searchParams.get('zone')
  const status = searchParams.get('status')

  const battles = await prisma.battle.findMany({
    where: {
      ...(zone && { zone: { contains: zone, mode: 'insensitive' as const } }),
      ...(status && { status: status as BattleStatus }),
      ...(!status && { status: { in: ['UPCOMING', 'ACTIVE'] } }),
    },
    include: {
      _count: { select: { participants: true } },
    },
    orderBy: { startDate: 'asc' },
  })

  return NextResponse.json(battles)
}
