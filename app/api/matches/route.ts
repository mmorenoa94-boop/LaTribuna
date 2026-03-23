import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const competition = searchParams.get('competition')

  const matches = await prisma.match.findMany({
    where: {
      ...(from && { kickoffAt: { gte: new Date(from) } }),
      ...(to && { kickoffAt: { lte: new Date(to) } }),
      ...(competition && { competition: { contains: competition, mode: 'insensitive' } }),
    },
    orderBy: { kickoffAt: 'asc' },
    take: 50,
  })

  return NextResponse.json(matches)
}
