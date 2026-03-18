import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — League leaderboard (paginated)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  // Verify membership
  const member = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: params.id, userId: session.user.id } },
  })
  if (!member || member.status !== 'APPROVED') {
    return NextResponse.json({ error: 'No eres miembro' }, { status: 403 })
  }

  const members = await prisma.leagueMember.findMany({
    where: { leagueId: params.id, status: 'APPROVED' },
    include: {
      user: { select: { id: true, name: true, image: true, level: true } },
    },
    orderBy: { totalPoints: 'desc' },
    take: limit,
    skip: offset,
  })

  const total = await prisma.leagueMember.count({
    where: { leagueId: params.id, status: 'APPROVED' },
  })

  const ranked = members.map((m, i) => ({
    rank: offset + i + 1,
    userId: m.userId,
    name: m.user.name,
    image: m.user.image,
    level: m.user.level,
    totalPoints: m.totalPoints,
    isMe: m.userId === session.user.id,
  }))

  return NextResponse.json({ leaderboard: ranked, total })
}
