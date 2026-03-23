import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const isMember = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: params.id, userId: session.user.id } },
  })
  if (!isMember) return NextResponse.json({ error: 'No eres miembro' }, { status: 403 })

  const members = await prisma.leagueMember.findMany({
    where: { leagueId: params.id },
    include: {
      user: { select: { id: true, name: true, image: true, level: true } },
    },
    orderBy: { totalPoints: 'desc' },
  })

  return NextResponse.json(members)
}
