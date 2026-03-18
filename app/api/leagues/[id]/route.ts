import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const league = await prisma.league.findUnique({
    where: { id: params.id },
    include: {
      business: { select: { id: true, name: true, logoUrl: true, city: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, image: true, level: true } },
        },
        orderBy: { totalPoints: 'desc' },
      },
      matches: {
        include: { match: true },
        orderBy: { match: { kickoffAt: 'asc' } },
      },
      questions: {
        where: { timing: 'PRE_MATCH', status: { not: 'PENDING' } },
        orderBy: [{ matchId: 'asc' }, { orderIndex: 'asc' }],
      },
      prizes: { orderBy: { position: 'asc' } },
      _count: { select: { members: true } },
    },
  })

  if (!league) return NextResponse.json({ error: 'Liga no encontrada' }, { status: 404 })

  // Solo miembros pueden ver la liga
  const isMember = league.members.some((m) => m.userId === session.user.id)
  if (!isMember) return NextResponse.json({ error: 'No eres miembro' }, { status: 403 })

  return NextResponse.json(league)
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const league = await prisma.league.findUnique({ where: { id: params.id } })
  if (!league) return NextResponse.json({ error: 'Liga no encontrada' }, { status: 404 })
  if (league.creatorId !== session.user.id)
    return NextResponse.json({ error: 'Solo el creador puede editar' }, { status: 403 })

  const body = await req.json()
  const allowed = ['name', 'description', 'type', 'allowRemote', 'maxMembers', 'status']
  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) data[key] = body[key]
  }

  const updated = await prisma.league.update({ where: { id: params.id }, data })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const league = await prisma.league.findUnique({ where: { id: params.id } })
  if (!league) return NextResponse.json({ error: 'Liga no encontrada' }, { status: 404 })
  if (league.creatorId !== session.user.id)
    return NextResponse.json({ error: 'Solo el creador puede eliminar' }, { status: 403 })

  await prisma.league.update({
    where: { id: params.id },
    data: { status: 'CANCELLED' },
  })

  return NextResponse.json({ success: true })
}
