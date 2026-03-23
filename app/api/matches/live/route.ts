import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const matches = await prisma.match.findMany({
    where: { status: { in: ['LIVE', 'HALFTIME'] } },
    orderBy: { kickoffAt: 'asc' },
  })
  return NextResponse.json(matches)
}
