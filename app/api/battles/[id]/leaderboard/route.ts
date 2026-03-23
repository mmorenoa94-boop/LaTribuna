import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET — Battle leaderboard
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const participants = await prisma.battleParticipant.findMany({
    where: { battleId: params.id },
    include: {
      business: { select: { id: true, name: true, logoUrl: true, city: true } },
    },
    orderBy: { score: 'desc' },
  })

  // Add rank
  const ranked = participants.map((p, i) => ({
    ...p,
    rank: i + 1,
  }))

  return NextResponse.json(ranked)
}
