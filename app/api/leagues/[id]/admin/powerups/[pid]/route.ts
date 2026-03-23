import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function verifyCreator(leagueId: string, userId: string) {
  const league = await prisma.league.findUnique({ where: { id: leagueId }, select: { creatorId: true } })
  return league?.creatorId === userId
}

// PATCH — Update or fire power-up
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; pid: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (!(await verifyCreator(params.id, session.user.id))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const powerup = await prisma.powerUp.findUnique({ where: { id: params.pid } })
  if (!powerup || powerup.leagueId !== params.id) {
    return NextResponse.json({ error: 'Power-up no encontrado' }, { status: 404 })
  }

  const body = await req.json()
  const { action, ...updateData } = body

  if (action === 'fire') {
    if (powerup.status !== 'CONFIGURED') {
      return NextResponse.json({ error: 'Solo se puede disparar un power-up CONFIGURED' }, { status: 400 })
    }

    const updated = await prisma.powerUp.update({
      where: { id: params.pid },
      data: { status: 'FIRED', firedAt: new Date() },
    })

    return NextResponse.json(updated)
  }

  if (action === 'expire') {
    const updated = await prisma.powerUp.update({
      where: { id: params.pid },
      data: { status: 'EXPIRED' },
    })
    return NextResponse.json(updated)
  }

  // Regular update (only if CONFIGURED)
  if (powerup.status !== 'CONFIGURED') {
    return NextResponse.json({ error: 'Solo se puede editar un power-up CONFIGURED' }, { status: 400 })
  }

  const updated = await prisma.powerUp.update({
    where: { id: params.pid },
    data: {
      ...(updateData.question !== undefined && { question: updateData.question }),
      ...(updateData.options !== undefined && { options: updateData.options }),
      ...(updateData.rewardText !== undefined && { rewardText: updateData.rewardText }),
      ...(updateData.durationSecs !== undefined && { durationSecs: updateData.durationSecs }),
      ...(updateData.trigger !== undefined && { trigger: updateData.trigger }),
      ...(updateData.triggerMin !== undefined && { triggerMin: updateData.triggerMin }),
    },
  })

  return NextResponse.json(updated)
}

// DELETE — Remove power-up (only if CONFIGURED)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; pid: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (!(await verifyCreator(params.id, session.user.id))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const powerup = await prisma.powerUp.findUnique({ where: { id: params.pid } })
  if (!powerup || powerup.leagueId !== params.id) {
    return NextResponse.json({ error: 'Power-up no encontrado' }, { status: 404 })
  }

  if (powerup.status !== 'CONFIGURED') {
    return NextResponse.json({ error: 'Solo se puede eliminar un power-up CONFIGURED' }, { status: 400 })
  }

  await prisma.powerUp.delete({ where: { id: params.pid } })
  return NextResponse.json({ success: true })
}
