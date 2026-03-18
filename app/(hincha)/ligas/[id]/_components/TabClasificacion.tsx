'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { cn, formatPoints } from '@/lib/utils'
import type { SLeague, SLeagueMember, SPrize } from './types'

interface Props {
  league: SLeague
  userId: string
  userPoints: number
  userPosition: number
}

const MEDAL: Record<number, { emoji: string; color: string; bg: string; border: string }> = {
  1: { emoji: '🥇', color: 'text-yellow-400',  bg: 'bg-yellow-400/10',  border: 'border-yellow-400/40' },
  2: { emoji: '🥈', color: 'text-slate-300',   bg: 'bg-slate-300/10',   border: 'border-slate-300/40'  },
  3: { emoji: '🥉', color: 'text-orange-400',  bg: 'bg-orange-400/10',  border: 'border-orange-400/40' },
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function TabClasificacion({ league, userId, userPosition }: Props) {
  const [members, setMembers] = useState<SLeagueMember[]>(league.members)

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/leagues/${league.id}/members`)
        if (res.ok) {
          const data: SLeagueMember[] = await res.json()
          setMembers(data)
        }
      } catch { /* ignore */ }
    }, 10_000)

    return () => clearInterval(interval)
  }, [league.id])

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div className="text-5xl">🏆</div>
        <p className="text-lt-white font-condensed text-lg font-700">Sin clasificación aún</p>
        <p className="text-lt-muted2 font-condensed text-sm">Las posiciones se actualizan en tiempo real</p>
      </div>
    )
  }

  const top3 = members.slice(0, Math.min(3, members.length))
  return (
    <div className="space-y-5">

      {/* Pódium top 3 */}
      {top3.length >= 2 && (
        <div className="flex items-end justify-center gap-2 pt-2 pb-4">
          {/* Orden visual: 2º - 1º - 3º */}
          {[1, 0, 2].map((i) => {
            const m = top3[i]
            if (!m) return null
            const pos = i + 1
            const medal = MEDAL[pos]
            const isUser = m.userId === userId
            const heights = ['h-28', 'h-36', 'h-24']

            return (
              <div key={m.id} className="flex flex-col items-center gap-2 flex-1">
                {/* Avatar + pts */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className={cn(
                    'w-12 h-12 rounded-full border-2 overflow-hidden flex-shrink-0',
                    isUser ? 'border-lt-green' : medal.border
                  )}>
                    {m.user.image ? (
                      <Image src={m.user.image} alt={m.user.name} width={48} height={48} className="object-cover w-full h-full" />
                    ) : (
                      <div className={cn('w-full h-full flex items-center justify-center font-bebas text-xl', medal.bg, medal.color)}>
                        {m.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p className={cn(
                    'font-condensed text-xs font-700 text-center w-20 truncate',
                    isUser ? 'text-lt-green' : 'text-lt-white'
                  )}>
                    {isUser ? 'Tú' : m.user.name.split(' ')[0]}
                  </p>
                  <p className="text-lt-muted2 font-condensed text-xs">{formatPoints(m.totalPoints)} pts</p>
                </div>

                {/* Pedestal */}
                <div className={cn(
                  'w-full rounded-t-lg flex flex-col items-center justify-start pt-2',
                  heights[i], medal.bg,
                  'border border-b-0', medal.border
                )}>
                  <span className="text-2xl">{medal.emoji}</span>
                  <span className={cn('font-bebas text-2xl leading-none', medal.color)}>#{pos}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Premios de liga */}
      {league.prizes.length > 0 && (
        <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4">
          <p className="text-lt-white font-condensed text-sm font-700 uppercase tracking-wider mb-3">
            🎁 Premios de la liga
          </p>
          <div className="space-y-2">
            {league.prizes.map((prize) => (
              <PrizeRow key={prize.id} prize={prize} />
            ))}
          </div>
        </div>
      )}

      {/* Ranking completo */}
      <div className="space-y-1.5">
        <p className="text-lt-muted2 font-condensed text-xs uppercase tracking-widest mb-2">
          Ranking completo — {members.length} jugadores
        </p>

        {members.map((m, i) => {
          const pos = i + 1
          const isUser = m.userId === userId
          const medal = MEDAL[pos]

          return (
            <div
              key={m.id}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-btn border transition-colors',
                isUser
                  ? 'bg-lt-green/10 border-lt-green/30'
                  : 'bg-lt-card border-[rgba(255,255,255,0.06)]'
              )}
            >
              {/* Posición */}
              <span className={cn(
                'w-7 text-center font-bebas text-xl leading-none flex-shrink-0',
                medal ? medal.color : 'text-lt-muted2'
              )}>
                {medal ? medal.emoji : `#${pos}`}
              </span>

              {/* Avatar */}
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-lt-card2 border border-lt-muted">
                {m.user.image ? (
                  <Image src={m.user.image} alt={m.user.name} width={32} height={32} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bebas text-sm text-lt-muted2">
                    {m.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Nombre + nivel */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'font-condensed text-sm font-700 leading-none truncate',
                  isUser ? 'text-lt-green' : 'text-lt-white'
                )}>
                  {isUser ? 'Tú' : m.user.name}
                </p>
                <p className="text-lt-muted2 font-condensed text-xs mt-0.5">
                  Niv. {m.user.level}
                </p>
              </div>

              {/* Puntos */}
              <span className={cn(
                'font-condensed font-700 text-sm flex-shrink-0 tabular-nums',
                isUser ? 'text-lt-green' : pos <= 3 ? medal!.color : 'text-lt-white'
              )}>
                {formatPoints(m.totalPoints)}
                <span className="text-lt-muted2 font-400 text-xs ml-0.5">pts</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PrizeRow({ prize }: { prize: SPrize }) {
  const medal = MEDAL[prize.position]
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg w-6 text-center">{medal?.emoji ?? `#${prize.position}`}</span>
      <p className="flex-1 text-lt-white font-condensed text-sm">{prize.description}</p>
      {prize.pointsValue > 0 && (
        <span className="text-lt-green font-condensed text-xs font-600">+{formatPoints(prize.pointsValue)} pts</span>
      )}
    </div>
  )
}
