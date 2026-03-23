import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function verifyCreator(leagueId: string, userId: string) {
  const league = await prisma.league.findUnique({ where: { id: leagueId } })
  return league?.creatorId === userId ? league : null
}

// PATCH: editar partido (solo si no tiene preguntas resueltas)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; matchId: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const league = await verifyCreator(params.id, session.user.id)
  if (!league) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

  // Verify match is linked to this league
  const leagueMatch = await prisma.leagueMatch.findUnique({
    where: { leagueId_matchId: { leagueId: params.id, matchId: params.matchId } },
  })
  if (!leagueMatch) return NextResponse.json({ error: 'Partido no encontrado en esta liga' }, { status: 404 })

  // Check no resolved questions exist
  const resolvedCount = await prisma.leagueQuestion.count({
    where: { leagueId: params.id, matchId: params.matchId, status: 'RESOLVED' },
  })
  if (resolvedCount > 0) {
    return NextResponse.json(
      { error: 'No se puede editar un partido que ya tiene preguntas resueltas' },
      { status: 400 }
    )
  }

  const body = await req.json()
  const { homeTeam, awayTeam, competition, venue, kickoffAt } = body

  const match = await prisma.match.update({
    where: { id: params.matchId },
    data: {
      ...(homeTeam?.trim() ? { homeTeam: homeTeam.trim() } : {}),
      ...(awayTeam?.trim() ? { awayTeam: awayTeam.trim() } : {}),
      ...(competition?.trim() ? { competition: competition.trim() } : {}),
      ...(venue !== undefined ? { venue: venue?.trim() || null } : {}),
      ...(kickoffAt ? { kickoffAt: new Date(kickoffAt) } : {}),
    },
  })

  return NextResponse.json(match)
}

// DELETE: eliminar partido y sus relaciones
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; matchId: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const league = await verifyCreator(params.id, session.user.id)
  if (!league) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

  // Verify match is linked to this league
  const leagueMatch = await prisma.leagueMatch.findUnique({
    where: { leagueId_matchId: { leagueId: params.id, matchId: params.matchId } },
  })
  if (!leagueMatch) return NextResponse.json({ error: 'Partido no encontrado en esta liga' }, { status: 404 })

  // Delete in order: answers → questions → leagueMatch → match (if not shared)
  await prisma.$transaction(async (tx) => {
    // Get all questions for this match in this league
    const questions = await tx.leagueQuestion.findMany({
      where: { leagueId: params.id, matchId: params.matchId },
      select: { id: true },
    })
    const questionIds = questions.map((q) => q.id)

    // Delete answers (predictions) for those questions
    if (questionIds.length > 0) {
      await tx.answer.deleteMany({ where: { questionId: { in: questionIds } } })
      // Delete the questions
      await tx.leagueQuestion.deleteMany({
        where: { leagueId: params.id, matchId: params.matchId },
      })
    }

    // Remove the league-match link
    await tx.leagueMatch.delete({
      where: { leagueId_matchId: { leagueId: params.id, matchId: params.matchId } },
    })

    // Check if match is used by other leagues
    const otherLinks = await tx.leagueMatch.count({
      where: { matchId: params.matchId },
    })

    // If no other league uses this match, delete it
    if (otherLinks === 0) {
      await tx.match.delete({ where: { id: params.matchId } })
    }
  })

  return NextResponse.json({ success: true })
}
