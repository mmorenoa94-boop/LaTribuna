import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateInviteCode } from '@/lib/utils'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const memberships = await prisma.leagueMember.findMany({
    where: { userId: session.user.id },
    include: {
      league: {
        include: {
          business: { select: { id: true, name: true, logoUrl: true } },
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })

  return NextResponse.json(memberships.map((m) => ({ ...m.league, userPoints: m.totalPoints })))
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { name, description, type, allowRemote, maxMembers, seasonEndDate } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

  const league = await prisma.league.create({
    data: {
      name: name.trim(),
      description: description?.trim(),
      creatorId: session.user.id,
      type: type ?? 'PRIVATE',
      allowRemote: allowRemote ?? false,
      maxMembers: maxMembers ?? 50,
      inviteCode: generateInviteCode(),
      ...(seasonEndDate && { seasonEndDate: new Date(seasonEndDate) }),
      members: {
        create: { userId: session.user.id },
      },
    },
    include: { _count: { select: { members: true } } },
  })

  return NextResponse.json(league, { status: 201 })
}
