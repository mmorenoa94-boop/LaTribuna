import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST — Business joins a battle
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (session.user.role !== 'NEGOCIO') return NextResponse.json({ error: 'Solo para negocios' }, { status: 403 })

  const business = await prisma.business.findUnique({ where: { userId: session.user.id } })
  if (!business) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

  const battle = await prisma.battle.findUnique({ where: { id: params.id } })
  if (!battle) return NextResponse.json({ error: 'Batalla no encontrada' }, { status: 404 })
  if (battle.status === 'FINISHED') return NextResponse.json({ error: 'Batalla finalizada' }, { status: 400 })

  // Check if already participating
  const existing = await prisma.battleParticipant.findUnique({
    where: { battleId_businessId: { battleId: params.id, businessId: business.id } },
  })
  if (existing) return NextResponse.json({ error: 'Ya estás participando' }, { status: 409 })

  const participant = await prisma.battleParticipant.create({
    data: {
      battleId: params.id,
      businessId: business.id,
    },
  })

  return NextResponse.json(participant, { status: 201 })
}
