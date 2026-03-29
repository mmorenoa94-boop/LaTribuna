import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { scoreQuestionAnswers } from '@/lib/scoring'
import { emitQuestionOpen, emitQuestionClose, emitQuestionResolve, emitLeaderboardUpdate } from '@/lib/socket-emit'

async function verifyCreator(leagueId: string, userId: string) {
  const league = await prisma.league.findUnique({ where: { id: leagueId } })
  return league?.creatorId === userId ? league : null
}

// PATCH: abrir | cerrar | resolver | editar
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; qid: string } }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const league = await verifyCreator(params.id, session.user.id)
    if (!league) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

    const question = await prisma.leagueQuestion.findUnique({
      where: { id: params.qid },
    })
    if (!question || question.leagueId !== params.id) {
      return NextResponse.json({ error: 'Pregunta no encontrada' }, { status: 404 })
    }

    const body = await req.json()
    const { action, correctAnswer, windowSecs, text, type, options, pointsValue, timing } = body

    // ── Abrir ──────────────────────────────────────────────────────────────────
    if (action === 'open') {
    if (question.status !== 'PENDING') {
      return NextResponse.json({ error: 'Solo se puede abrir una pregunta pendiente' }, { status: 400 })
    }

    const now = new Date()
    let closedAt: Date

    if (question.timing === 'PRE_MATCH') {
      // Cierra al kickoff del partido
      const match = await prisma.match.findUnique({ where: { id: question.matchId } })
      closedAt = match?.kickoffAt ?? new Date(now.getTime() + 3600000)
    } else {
      // LIVE: cierra después de windowSecs (default 30)
      const secs = Math.max(10, Math.min(300, Number(windowSecs ?? 30)))
      closedAt = new Date(now.getTime() + secs * 1000)
    }

    const updated = await prisma.leagueQuestion.update({
      where: { id: params.qid },
      data: { status: 'OPEN', openAt: now, closedAt },
      include: { _count: { select: { answers: true } } },
    })

    await emitQuestionOpen(params.id, question.matchId, {
      questionId: updated.id,
      text: updated.text,
      type: updated.type,
      options: updated.options,
      pointsValue: updated.pointsValue,
      closedAt: updated.closedAt?.toISOString() ?? null,
    })

    return NextResponse.json(updated)
  }

  // ── Cerrar ─────────────────────────────────────────────────────────────────
  if (action === 'close') {
    if (question.status !== 'OPEN') {
      return NextResponse.json({ error: 'La pregunta no está abierta' }, { status: 400 })
    }
    const updated = await prisma.leagueQuestion.update({
      where: { id: params.qid },
      data: { status: 'CLOSED', closedAt: new Date() },
      include: { _count: { select: { answers: true } } },
    })

    await emitQuestionClose(params.id, question.matchId, {
      questionId: updated.id,
    })

    return NextResponse.json(updated)
  }

  // ── Resolver ───────────────────────────────────────────────────────────────
  if (action === 'resolve') {
    if (question.status === 'PENDING') {
      return NextResponse.json({ error: 'La pregunta debe estar abierta o cerrada para resolverla' }, { status: 400 })
    }
    if (!correctAnswer) {
      return NextResponse.json({ error: 'correctAnswer es requerido' }, { status: 400 })
    }

    const now = new Date()
    await prisma.leagueQuestion.update({
      where: { id: params.qid },
      data: {
        status: 'RESOLVED',
        correctAnswer,
        resolvedAt: now,
        closedAt: question.closedAt ?? now,
      },
    })

    // Score answers using the pari-mutuel pot system
    const result = await scoreQuestionAnswers(params.qid, correctAnswer)

    // Emit resolve event with pot details
    await emitQuestionResolve(params.id, question.matchId, {
      questionId: params.qid,
      correctAnswer,
      scored: result.scored,
      correct: result.correct,
      totalPot: result.totalPot,
      winnersCount: result.winnersCount,
    })

    // Emit updated leaderboard
    const topMembers = await prisma.leagueMember.findMany({
      where: { leagueId: params.id, status: 'APPROVED' },
      include: { user: { select: { name: true } } },
      orderBy: { totalPoints: 'desc' },
      take: 20,
    })
    await emitLeaderboardUpdate(params.id, question.matchId, {
      rankings: topMembers.map((m, i) => ({
        userId: m.userId,
        name: m.user.name,
        totalPoints: m.totalPoints,
        rank: i + 1,
      })),
    })

    const updated = await prisma.leagueQuestion.findUnique({
      where: { id: params.qid },
      include: { _count: { select: { answers: true } } },
    })
    return NextResponse.json(updated)
  }

  // ── Editar (PENDING u OPEN) ─────────────────────────────────────────────────
  if (action === 'edit' || !action) {
    if (question.status !== 'PENDING' && question.status !== 'OPEN') {
      return NextResponse.json({ error: 'Solo se pueden editar preguntas pendientes o abiertas' }, { status: 400 })
    }
    const validTypes = ['WINNER', 'SCORE', 'YES_NO', 'SCORER', 'RANGE', 'CUSTOM']
    const updated = await prisma.leagueQuestion.update({
      where: { id: params.qid },
      data: {
        ...(text && { text: text.trim() }),
        ...(type && validTypes.includes(type) && { type }),
        ...(options && { options }),
        ...(pointsValue && { pointsValue: Number(pointsValue) }),
        ...(timing && { timing }),
      },
      include: { _count: { select: { answers: true } } },
    })
    return NextResponse.json(updated)
  }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
  } catch (error) {
    console.error('[questions] PATCH error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE: eliminar pregunta (PENDING u OPEN — si OPEN, borra respuestas también)
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; qid: string } }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const league = await verifyCreator(params.id, session.user.id)
    if (!league) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

    const question = await prisma.leagueQuestion.findUnique({ where: { id: params.qid } })
    if (!question || question.leagueId !== params.id) {
      return NextResponse.json({ error: 'Pregunta no encontrada' }, { status: 404 })
    }
    if (question.status !== 'PENDING' && question.status !== 'OPEN') {
      return NextResponse.json({ error: 'Solo se pueden eliminar preguntas pendientes o abiertas' }, { status: 400 })
    }

    // If open, delete any answers first
    if (question.status === 'OPEN') {
      await prisma.answer.deleteMany({ where: { questionId: params.qid } })
    }

    await prisma.leagueQuestion.delete({ where: { id: params.qid } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[questions] DELETE error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
