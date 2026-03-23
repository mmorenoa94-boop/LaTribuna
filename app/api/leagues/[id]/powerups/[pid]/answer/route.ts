import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST — Answer a power-up (within time window)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; pid: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Verify membership
  const member = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: params.id, userId: session.user.id } },
  })
  if (!member || member.status !== 'APPROVED') {
    return NextResponse.json({ error: 'No eres miembro' }, { status: 403 })
  }

  const powerup = await prisma.powerUp.findUnique({ where: { id: params.pid } })
  if (!powerup || powerup.leagueId !== params.id) {
    return NextResponse.json({ error: 'Power-up no encontrado' }, { status: 404 })
  }

  if (powerup.status !== 'FIRED' || !powerup.firedAt) {
    return NextResponse.json({ error: 'Power-up no está activo' }, { status: 400 })
  }

  // Check time window
  const now = new Date()
  const expiresAt = new Date(powerup.firedAt.getTime() + powerup.durationSecs * 1000)
  if (now > expiresAt) {
    return NextResponse.json({ error: 'Tiempo agotado' }, { status: 400 })
  }

  const { answer } = await req.json()
  if (!answer) return NextResponse.json({ error: 'answer requerido' }, { status: 400 })

  // For power-ups, we just record the answer. The admin resolves manually.
  // Store as a notification or in a separate tracking (for now, create a notification)
  await prisma.notification.create({
    data: {
      userId: session.user.id,
      type: 'POWERUP_ANSWER',
      title: 'Power-Up respondido',
      body: `Respuesta: ${answer}`,
      data: { powerupId: powerup.id, answer, leagueId: params.id },
    },
  })

  return NextResponse.json({ success: true, answer, rewardText: powerup.rewardText })
}
