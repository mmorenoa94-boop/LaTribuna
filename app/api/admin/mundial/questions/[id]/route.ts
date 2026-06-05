import { NextResponse } from 'next/server'
import { requireAuth, isAuthError } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'
import { adminPoolQuestionUpdateSchema } from '@/lib/validations'
import type { Prisma } from '@prisma/client'

// PATCH /api/admin/mundial/questions/[id] — editar pregunta
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth('SUPER_ADMIN')
  if (isAuthError(authResult)) return authResult

  const body = await req.json().catch(() => null)
  const parsed = adminPoolQuestionUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }
  const d = parsed.data

  const data: Prisma.PoolQuestionUpdateInput = {}
  if (d.order !== undefined) data.order = d.order
  if (d.text !== undefined) data.text = d.text
  if (d.type !== undefined) data.type = d.type
  if (d.category !== undefined) data.category = d.category
  if (d.options !== undefined) data.options = d.options as Prisma.InputJsonValue
  if (d.pointsValue !== undefined) data.pointsValue = d.pointsValue
  if (d.isTiebreaker !== undefined) data.isTiebreaker = d.isTiebreaker
  if (d.tiebreakRank !== undefined) data.tiebreakRank = d.tiebreakRank

  const updated = await prisma.poolQuestion.update({
    where: { id: params.id },
    data,
  })
  return NextResponse.json({ data: updated })
}

// DELETE /api/admin/mundial/questions/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth('SUPER_ADMIN')
  if (isAuthError(authResult)) return authResult

  await prisma.poolQuestion.delete({ where: { id: params.id } })
  return NextResponse.json({ data: { deleted: true } })
}
