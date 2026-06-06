import { NextResponse } from 'next/server'
import { requireAuth, isAuthError } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const patchSchema = z.object({
  action: z.enum(['confirm', 'reject', 'reset']),
})

// PATCH /api/admin/mundial/entries/[id] — confirmar / rechazar / reabrir un pago
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth('SUPER_ADMIN')
  if (isAuthError(authResult)) return authResult
  const { session } = authResult

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'action inválida' }, { status: 400 })
  }

  const entry = await prisma.poolEntry.findUnique({ where: { id: params.id } })
  if (!entry) return NextResponse.json({ error: 'Inscripción no encontrada' }, { status: 404 })

  let data
  switch (parsed.data.action) {
    case 'confirm':
      data = {
        status: 'CONFIRMED' as const,
        confirmedById: session.user.id,
        confirmedAt: new Date(),
      }
      break
    case 'reject':
      data = { status: 'REJECTED' as const }
      break
    case 'reset':
      data = { status: 'PENDING' as const, confirmedById: null, confirmedAt: null }
      break
  }

  const updated = await prisma.poolEntry.update({ where: { id: params.id }, data })
  return NextResponse.json({ data: updated })
}
