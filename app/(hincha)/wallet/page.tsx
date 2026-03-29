import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getBalance } from '@/lib/wallet'
import { prisma } from '@/lib/prisma'
import { formatCOP } from '@/lib/utils'
import type { TransactionType } from '@prisma/client'
import RewardsCTA from './_components/RewardsCTA'

// ── Helpers ──────────────────────────────────────────────────────────────────

const CREDIT_TYPES: TransactionType[] = [
  'MATCH_WIN',
  'PREDICTION_WIN',
  'PROFILE_BONUS',
  'POWER_UP_WIN',
  'ADMIN_ADJUSTMENT',
]

function isCredit(type: TransactionType) {
  return CREDIT_TYPES.includes(type)
}

const TX_META: Record<
  TransactionType,
  { label: string; icon: string }
> = {
  MATCH_WIN:        { label: 'Premio partido',      icon: '🏆' },
  PREDICTION_WIN:   { label: 'Predicción acertada', icon: '🎯' },
  PROFILE_BONUS:    { label: 'Bono de perfil',       icon: '👤' },
  POWER_UP_WIN:     { label: 'Power-up',             icon: '⚡' },
  REDEMPTION:       { label: 'Canje',                icon: '🎁' },
  EXPIRY:           { label: 'Vencimiento',          icon: '⏱' },
  ADMIN_ADJUSTMENT: { label: 'Ajuste',               icon: '🔧' },
}

function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86_400_000)
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function WalletPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const [balance, transactions] = await Promise.all([
    getBalance(session.user.id),
    prisma.walletTransaction.findMany({
      where: { wallet: { userId: session.user.id } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ])

  const totalEarned = transactions
    .filter((t) => isCredit(t.type) && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

  const totalSpent = transactions
    .filter((t) => !isCredit(t.type) || t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  return (
    <div className="min-h-screen bg-lt-black pb-28">
      {/* Header */}
      <div className="bg-lt-card border-b border-[rgba(255,255,255,0.07)] px-4 pt-safe-top pb-4">
        <p className="text-lt-muted2 font-condensed text-xs uppercase tracking-widest mb-1 pt-4">
          Mi Billetera
        </p>
        <h1 className="font-bebas text-2xl text-lt-white leading-none">Puntos LaTribuna</h1>
      </div>

      <div className="px-4 space-y-5 mt-5">

        {/* Balance card */}
        <div className="relative bg-gradient-to-br from-lt-card to-lt-card2 rounded-card border border-lt-green/20 overflow-hidden p-5">
          {/* decorative glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-lt-green/5 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-lt-green/5 rounded-full blur-3xl pointer-events-none" />

          <p className="text-lt-muted2 font-condensed text-xs uppercase tracking-widest mb-1 relative">
            Saldo disponible
          </p>
          <div className="flex items-end gap-2 relative">
            <span className="font-bebas text-6xl text-lt-green leading-none tabular-nums">
              {formatCOP(balance)}
            </span>
          </div>
          <p className="text-lt-muted2 font-condensed text-xs mt-2 relative">
            Úsalos para canjear premios en aliados
          </p>

          {/* Mini stats */}
          <div className="grid grid-cols-2 gap-3 mt-4 relative">
            <div className="bg-lt-black/40 rounded-btn px-3 py-2.5">
              <p className="text-lt-muted2 font-condensed text-[10px] uppercase tracking-wider mb-0.5">
                Total ganado
              </p>
              <p className="font-condensed font-700 text-sm text-lt-green tabular-nums">
                +{formatCOP(totalEarned)}
              </p>
            </div>
            <div className="bg-lt-black/40 rounded-btn px-3 py-2.5">
              <p className="text-lt-muted2 font-condensed text-[10px] uppercase tracking-wider mb-0.5">
                Total canjeado
              </p>
              <p className="font-condensed font-700 text-sm text-lt-muted tabular-nums">
                -{formatCOP(totalSpent)}
              </p>
            </div>
          </div>
        </div>

        {/* CTA canje */}
        <RewardsCTA />

        {/* Historial */}
        <div>
          <p className="text-lt-muted2 font-condensed text-xs uppercase tracking-widest mb-3">
            Historial de movimientos
          </p>

          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
              <div className="text-5xl">💰</div>
              <p className="text-lt-white font-condensed text-lg font-700">Sin movimientos aún</p>
              <p className="text-lt-muted2 font-condensed text-sm">
                Gana puntos respondiendo trivia en las ligas
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const meta = TX_META[tx.type]
                const credit = isCredit(tx.type) ? tx.amount > 0 : false
                const signed = credit ? `+${formatCOP(tx.amount)}` : formatCOP(tx.amount)

                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 bg-lt-card border border-[rgba(255,255,255,0.06)] rounded-btn px-3 py-3"
                  >
                    {/* Icon */}
                    <div className="w-9 h-9 rounded-full bg-lt-card2 border border-[rgba(255,255,255,0.08)] flex items-center justify-center flex-shrink-0 text-base">
                      {meta.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-condensed font-700 text-sm text-lt-white leading-none truncate">
                        {meta.label}
                      </p>
                      {tx.description && (
                        <p className="text-lt-muted2 font-condensed text-xs mt-0.5 truncate">
                          {tx.description}
                        </p>
                      )}
                    </div>

                    {/* Amount + date */}
                    <div className="text-right flex-shrink-0">
                      <p
                        className={`font-condensed font-700 text-sm tabular-nums ${
                          credit ? 'text-lt-green' : 'text-red-400'
                        }`}
                      >
                        {signed}
                      </p>
                      <p className="text-lt-muted2 font-condensed text-[10px] mt-0.5">
                        {formatRelativeDate(new Date(tx.createdAt))}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
