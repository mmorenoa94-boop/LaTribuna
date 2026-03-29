import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { code } = await req.json()
    if (!code) return NextResponse.json({ error: 'Código requerido' }, { status: 400 })

    const league = await prisma.league.findUnique({ where: { inviteCode: code.toUpperCase() } })
    if (!league) return NextResponse.json({ error: 'Liga no encontrada' }, { status: 404 })
    if (league.status !== 'ACTIVE') return NextResponse.json({ error: 'Liga inactiva' }, { status: 400 })

    // allowMemberInvites only controls whether existing members can re-share
    // the invite code. Anyone with a valid code can always join.
    // Access control is handled by requireApproval and league type instead.

    const count = await prisma.leagueMember.count({ where: { leagueId: league.id } })
    if (count >= league.maxMembers) return NextResponse.json({ error: 'Liga llena' }, { status: 400 })

    const existing = await prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId: league.id, userId: session.user.id } },
    })
    if (existing) {
      if (existing.status === 'PENDING') {
        return NextResponse.json({ error: 'Tu solicitud está pendiente de aprobación' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Ya eres miembro' }, { status: 400 })
    }

    const needsApproval = league.requireApproval && league.creatorId !== session.user.id

    const member = await prisma.leagueMember.create({
      data: {
        leagueId: league.id,
        userId: session.user.id,
        status: needsApproval ? 'PENDING' : 'APPROVED',
      },
    })

    return NextResponse.json({
      league,
      member,
      pending: needsApproval,
      message: needsApproval ? 'Solicitud enviada. El admin debe aprobarla.' : undefined,
    }, { status: 201 })
  } catch (error) {
    console.error('[leagues/join] POST error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
