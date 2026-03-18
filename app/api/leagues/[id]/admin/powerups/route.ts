import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function verifyCreator(leagueId: string, userId: string) {
  const league = await prisma.league.findUnique({ where: { id: leagueId }, select: { creatorId: true } })
  return league?.creatorId === userId
}

// GET — List power-ups for a league
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (!(await verifyCreator(params.id, session.user.id))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const matchId = searchParams.get('matchId')

  const powerups = await prisma.powerUp.findMany({
    where: {
      leagueId: params.id,
      ...(matchId && { matchId }),
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(powerups)
}

// POST — Create power-up
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (!(await verifyCreator(params.id, session.user.id))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await req.json()
  const { matchId, question, options, rewardText, durationSecs, trigger, triggerMin } = body

  if (!matchId || !question || !options || options.length < 2 || !rewardText) {
    return NextResponse.json({ error: 'matchId, question, options (min 2) y rewardText son requeridos' }, { status: 400 })
  }

  const powerup = await prisma.powerUp.create({
    data: {
      leagueId: params.id,
      matchId,
      question,
      options,
      rewardText,
      durationSecs: durationSecs ?? 30,
      trigger: trigger ?? 'MANUAL',
      triggerMin: triggerMin ?? null,
    },
  })

  return NextResponse.json(powerup, { status: 201 })
}
