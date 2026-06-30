import { NextResponse } from 'next/server'
import { requireAuth, isAuthError } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'
import { poolMatchUpdateSchema } from '@/lib/validations'
import { scoreMatchPredictions, recomputeEntryAggregates } from '@/lib/mundial-scoring'
import type { Prisma } from '@prisma/client'

// PATCH /api/admin/mundial/matches/[id] — editar partido, cambiar estado o cargar resultado
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authResult = await requireAuth('SUPER_ADMIN')
  if (isAuthError(authResult)) return authResult

  const body = await req.json().catch(() => null)
  const parsed = poolMatchUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }
  const d = parsed.data

  const data: Prisma.PoolMatchUpdateInput = {}
  if (d.homeTeam !== undefined) data.homeTeam = d.homeTeam
  if (d.awayTeam !== undefined) data.awayTeam = d.awayTeam
  if (d.homeFlag !== undefined) data.homeFlag = d.homeFlag
  if (d.awayFlag !== undefined) data.awayFlag = d.awayFlag
  if (d.phase !== undefined) data.phase = d.phase
  if (d.kickoffAt !== undefined) data.kickoffAt = d.kickoffAt ? new Date(d.kickoffAt) : null
  if (d.order !== undefined) data.order = d.order
  if (d.status !== undefined) data.status = d.status
  if (d.homeScore !== undefined) data.homeScore = d.homeScore
  if (d.awayScore !== undefined) data.awayScore = d.awayScore
  if (d.advancesReal !== undefined) data.advancesReal = d.advancesReal

  const match = await prisma.poolMatch.update({ where: { id: params.id }, data })

  // Si quedó FINISHED con marcador → calcular puntos de las predicciones
  if (match.status === 'FINISHED' && match.homeScore != null && match.awayScore != null) {
    await scoreMatchPredictions(match.id)
  } else {
    // Si NO está finalizado, asegurar que no haya puntos colgando de este partido
    await prisma.poolMatchPrediction.updateMany({
      where: { matchId: match.id },
      data: { pointsEarned: 0, outcomeCorrect: null, exactCorrect: null, advanceCorrect: null },
    })
    await recomputeEntryAggregates(match.poolId)
  }

  return NextResponse.json({ data: match })
}

// DELETE /api/admin/mundial/matches/[id]
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const authResult = await requireAuth('SUPER_ADMIN')
  if (isAuthError(authResult)) return authResult

  const match = await prisma.poolMatch.findUnique({ where: { id: params.id } })
  if (!match) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  await prisma.poolMatch.delete({ where: { id: params.id } })
  // Recalcular por si tenía puntos asignados
  await recomputeEntryAggregates(match.poolId)

  return NextResponse.json({ data: { deleted: true } })
}
