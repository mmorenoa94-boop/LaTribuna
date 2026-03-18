import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * PATCH /api/leagues/[id]/admin/settings
 * Update league configuration (only creator can do this)
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const league = await prisma.league.findUnique({ where: { id: params.id } })
  if (!league || league.creatorId !== session.user.id) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const body = await req.json()

  // Allowlist of editable fields
  const data: Record<string, unknown> = {}

  if (typeof body.allowRemote === 'boolean') data.allowRemote = body.allowRemote
  if (typeof body.requireApproval === 'boolean') data.requireApproval = body.requireApproval
  if (typeof body.minConsumption === 'boolean') data.minConsumption = body.minConsumption
  if (body.minConsumptionAmount !== undefined) {
    data.minConsumptionAmount = body.minConsumptionAmount ? parseInt(body.minConsumptionAmount, 10) : null
  }
  if (body.verificationType !== undefined) {
    const valid = ['QR', 'STAFF_CODE', 'RECEIPT', null]
    if (valid.includes(body.verificationType)) data.verificationType = body.verificationType
  }
  if (body.matchMode !== undefined) {
    const validModes = ['PER_MATCH', 'SEASON', 'HYBRID']
    if (validModes.includes(body.matchMode)) data.matchMode = body.matchMode
  }
  if (typeof body.maxMembers === 'number' && body.maxMembers > 0) {
    data.maxMembers = body.maxMembers
  }
  if (typeof body.name === 'string' && body.name.trim()) {
    data.name = body.name.trim()
  }
  if (body.description !== undefined) {
    data.description = body.description?.trim() || null
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Sin campos para actualizar' }, { status: 400 })
  }

  const updated = await prisma.league.update({
    where: { id: params.id },
    data,
  })

  return NextResponse.json(updated)
}

/**
 * POST /api/leagues/[id]/admin/settings/regenerate-code
 * Regenerate invite code
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const league = await prisma.league.findUnique({ where: { id: params.id } })
  if (!league || league.creatorId !== session.user.id) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const { generateInviteCode } = await import('@/lib/utils')

  const updated = await prisma.league.update({
    where: { id: params.id },
    data: { inviteCode: generateInviteCode() },
  })

  return NextResponse.json({ inviteCode: updated.inviteCode })
}
