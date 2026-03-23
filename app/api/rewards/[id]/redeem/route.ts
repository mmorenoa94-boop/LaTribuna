import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getBalance } from '@/lib/wallet'
import { randomBytes } from 'crypto'

/** POST /api/rewards/[id]/redeem — hincha redeems a reward */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const reward = await prisma.reward.findUnique({ where: { id: params.id } })
  if (!reward || reward.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Premio no disponible' }, { status: 404 })
  }

  // Check expiration
  if (reward.expiresAt && reward.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Premio expirado' }, { status: 400 })
  }

  // Check stock
  if (reward.stock !== null && reward.stock <= 0) {
    return NextResponse.json({ error: 'Sin stock disponible' }, { status: 400 })
  }

  // Check balance
  const balance = await getBalance(session.user.id)
  if (balance < reward.pointsCost) {
    return NextResponse.json(
      { error: `Saldo insuficiente. Necesitas ${reward.pointsCost} puntos, tienes ${balance}.` },
      { status: 400 }
    )
  }

  // Generate unique redemption code
  const code = randomBytes(4).toString('hex').toUpperCase()

  // Redemption expires in 7 days
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  // Execute in transaction
  const redemption = await prisma.$transaction(async (tx) => {
    // Debit wallet
    const wallet = await tx.wallet.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: {},
    })
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'REDEMPTION',
        amount: -reward.pointsCost,
        description: `Canje: ${reward.name}`,
        referenceId: reward.id,
      },
    })

    // Decrement stock if applicable
    if (reward.stock !== null) {
      const updatedReward = await tx.reward.update({
        where: { id: reward.id },
        data: { stock: { decrement: 1 } },
      })
      // Auto-deactivate when out of stock
      if (updatedReward.stock !== null && updatedReward.stock <= 0) {
        await tx.reward.update({
          where: { id: reward.id },
          data: { status: 'OUT_OF_STOCK' },
        })
      }
    }

    // Create redemption record
    return tx.redemption.create({
      data: {
        userId: session.user.id,
        rewardId: reward.id,
        code,
        expiresAt,
      },
      include: {
        reward: {
          select: {
            name: true,
            description: true,
            business: { select: { name: true } },
          },
        },
      },
    })
  })

  return NextResponse.json(redemption, { status: 201 })
}
