import { prisma } from './prisma'
import type { TransactionType } from '@prisma/client'

/**
 * El balance se calcula como SUM(transactions.amount).
 * Nunca se almacena un campo balance mutable.
 */
export async function getBalance(userId: string): Promise<number> {
  const result = await prisma.walletTransaction.aggregate({
    where: { wallet: { userId } },
    _sum: { amount: true },
  })
  return result._sum.amount ?? 0
}

/**
 * Acredita puntos al wallet del usuario de forma transaccional.
 */
export async function creditWallet(
  userId: string,
  amount: number,
  type: TransactionType,
  description: string,
  referenceId?: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.upsert({
      where: { userId },
      create: { userId },
      update: {},
    })
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type,
        amount,
        description,
        referenceId,
      },
    })
  })
}

/**
 * Debita puntos (amount negativo).
 */
export async function debitWallet(
  userId: string,
  amount: number,
  type: TransactionType,
  description: string,
  referenceId?: string
): Promise<void> {
  const balance = await getBalance(userId)
  if (balance < amount) {
    throw new Error('Saldo insuficiente')
  }
  await creditWallet(userId, -amount, type, description, referenceId)
}
