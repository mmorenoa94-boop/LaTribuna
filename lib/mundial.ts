import { prisma } from './prisma'

/**
 * Helpers compartidos de la Polla Mundialista.
 * En v1 existe UNA sola polla global. Estas funciones devuelven "la" polla.
 */

// La polla visible para participantes (la más reciente que no esté en DRAFT)
export async function getVisiblePool() {
  return prisma.worldCupPool.findFirst({
    where: { status: { not: 'DRAFT' } },
    orderBy: { createdAt: 'desc' },
  })
}

// La polla para administración (la más reciente, incluyendo DRAFT)
export async function getAdminPool() {
  return prisma.worldCupPool.findFirst({
    orderBy: { createdAt: 'desc' },
  })
}

// ¿La polla acepta edición de respuestas en este momento?
export function poolIsOpen(pool: {
  status: string
  lockAt: Date | null
}): boolean {
  if (pool.status !== 'OPEN_REGISTRATION') return false
  if (pool.lockAt && new Date() >= pool.lockAt) return false
  return true
}
