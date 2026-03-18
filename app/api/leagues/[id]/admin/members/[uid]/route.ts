import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * PATCH /api/leagues/[id]/admin/members/[uid]
 * Approve or reject a pending member
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; uid: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const league = await prisma.league.findUnique({ where: { id: params.id } })
  if (!league || league.creatorId !== session.user.id) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const { status } = await req.json()
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const member = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: params.id, userId: params.uid } },
  })
  if (!member) return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 })

  if (status === 'REJECTED') {
    // If rejected, remove the membership entirely
    await prisma.leagueMember.delete({
      where: { leagueId_userId: { leagueId: params.id, userId: params.uid } },
    })
    return NextResponse.json({ ok: true, action: 'rejected' })
  }

  const updated = await prisma.leagueMember.update({
    where: { leagueId_userId: { leagueId: params.id, userId: params.uid } },
    data: { status: 'APPROVED' },
  })

  return NextResponse.json(updated)
}

/**
 * DELETE /api/leagues/[id]/admin/members/[uid]
 * El creador de la liga puede expulsar a cualquier miembro (excepto a sí mismo).
 * Elimina en orden: answers → predictions → leagueMember
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; uid: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Solo el creador puede expulsar
  const league = await prisma.league.findUnique({ where: { id: params.id } })
  if (!league || league.creatorId !== session.user.id) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  // No puede expulsarse a sí mismo
  if (params.uid === session.user.id) {
    return NextResponse.json({ error: 'No puedes expulsarte a ti mismo' }, { status: 400 })
  }

  // Verificar que el miembro existe en la liga
  const member = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: params.id, userId: params.uid } },
  })
  if (!member) return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 })

  // Obtener los IDs de preguntas de esta liga
  const questions = await prisma.leagueQuestion.findMany({
    where: { leagueId: params.id },
    select: { id: true },
  })
  const qIds = questions.map((q) => q.id)

  if (qIds.length > 0) {
    // Eliminar respuestas del usuario en las preguntas de esta liga
    await prisma.answer.deleteMany({
      where: { userId: params.uid, questionId: { in: qIds } },
    })
    // Eliminar predicciones del usuario en las preguntas de esta liga
    await prisma.prediction.deleteMany({
      where: { userId: params.uid, questionId: { in: qIds } },
    })
  }

  // Eliminar la membresía
  await prisma.leagueMember.delete({
    where: { leagueId_userId: { leagueId: params.id, userId: params.uid } },
  })

  return NextResponse.json({ ok: true })
}
