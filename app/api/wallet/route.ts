import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getBalance } from '@/lib/wallet'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [balance, transactions] = await Promise.all([
    getBalance(session.user.id),
    prisma.walletTransaction.findMany({
      where: { wallet: { userId: session.user.id } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  return NextResponse.json({ balance, transactions })
}
