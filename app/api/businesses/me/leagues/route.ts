import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateInviteCode } from '@/lib/utils'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'NEGOCIO') return NextResponse.json({ error: 'Solo negocios' }, { status: 403 })

  const business = await prisma.business.findUnique({ where: { userId: session.user.id } })
  if (!business) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

  const leagues = await prisma.league.findMany({
    where: { businessId: business.id },
    include: {
      _count: { select: { members: true, matches: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(leagues)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'NEGOCIO') return NextResponse.json({ error: 'Solo negocios' }, { status: 403 })

  const business = await prisma.business.findUnique({ where: { userId: session.user.id } })
  if (!business) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

  const { name, description, maxMembers, allowRemote, matchMode } = await req.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
  }

  const league = await prisma.league.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      inviteCode: generateInviteCode(),
      type: 'BUSINESS',
      businessId: business.id,
      creatorId: session.user.id,
      maxMembers: maxMembers ? parseInt(maxMembers, 10) : 50,
      allowRemote: allowRemote ?? false,
      matchMode: matchMode === 'SEASON' ? 'SEASON' : 'PER_MATCH',
      members: {
        create: { userId: session.user.id },
      },
    },
    include: {
      _count: { select: { members: true } },
    },
  })

  return NextResponse.json(league, { status: 201 })
}
