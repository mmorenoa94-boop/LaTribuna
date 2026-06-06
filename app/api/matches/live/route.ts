import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Consulta la BD en cada request; nunca debe prerenderizarse en build
export const dynamic = 'force-dynamic'

export async function GET() {
  const matches = await prisma.match.findMany({
    where: { status: { in: ['LIVE', 'HALFTIME'] } },
    orderBy: { kickoffAt: 'asc' },
  })
  return NextResponse.json(matches)
}
