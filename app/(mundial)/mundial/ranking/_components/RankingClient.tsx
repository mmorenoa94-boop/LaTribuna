'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { PoolRankingEntry } from '@/types'
import PlayerDetailModal from './PlayerDetailModal'

type RankingResponse = {
  data: PoolRankingEntry[]
  pool: {
    id: string
    name: string
    status: string
    entryFee: number
    prizeSplit: number[]
    pot: number
    matchPointsOutcome: number
    matchPointsExactBonus: number
  } | null
}

function formatCOP(n: number): string {
  return '$' + n.toLocaleString('es-CO')
}

async function fetchRanking(): Promise<RankingResponse> {
  const res = await fetch('/api/mundial/ranking')
  if (!res.ok) throw new Error('Error cargando el ranking')
  return res.json()
}

const MEDALS = ['🥇', '🥈', '🥉']

export default function RankingClient() {
  const { data, isLoading } = useQuery({
    queryKey: ['mundial-ranking'],
    queryFn: fetchRanking,
    refetchInterval: 30_000,
  })
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  if (isLoading) {
    return <div className="max-w-2xl mx-auto px-5 py-16 text-center text-lt-muted">Cargando…</div>
  }

  const pool = data?.pool
  const ranking = data?.data ?? []
  const resolved = pool?.status === 'RESOLVED'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-bebas text-4xl text-lt-white leading-none">Ranking</h1>
        <Link
          href="/mundial"
          className="text-xs font-condensed uppercase tracking-wider text-lt-green border border-lt-green/40 rounded-btn px-3 py-2"
        >
          Mi polla
        </Link>
      </div>

      {pool && (
        <div className="mb-5 rounded-card bg-lt-card border border-lt-card2 px-4 py-4">
          <div className="text-xs text-lt-muted uppercase tracking-wider">Pozo acumulado</div>
          <div className="font-bebas text-4xl text-lt-green">{formatCOP(pool.pot)}</div>
          <div className="text-xs text-lt-muted mt-1">
            {ranking.length} participante(s) · reparto {pool.prizeSplit.join(' / ')}%
            {!resolved && ' · estimado hasta el cierre'}
          </div>
          <div className="text-xs text-lt-muted mt-2 pt-2 border-t border-lt-card2">
            Puntaje: <span className="text-lt-white">+{pool.matchPointsOutcome}</span> por resultado
            acertado · <span className="text-lt-green">+{pool.matchPointsExactBonus}</span> extra por
            marcador exacto
          </div>
        </div>
      )}

      {!resolved && (
        <p className="text-sm text-lt-muted mb-4">
          El ranking definitivo y los premios se calculan cuando el admin resuelve la polla al final
          del torneo.
        </p>
      )}

      {ranking.length === 0 ? (
        <p className="text-lt-muted text-center py-10">Aún no hay participantes confirmados.</p>
      ) : (
        <>
        <p className="text-[11px] text-lt-muted mb-2">Toca un jugador para ver el detalle de sus puntos.</p>
        <div className="space-y-2">
          {ranking.map((r) => (
            <div
              key={r.userId}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedUser(r.userId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedUser(r.userId)
                }
              }}
              className={`flex items-center gap-3 rounded-card px-4 py-3 border cursor-pointer transition-colors hover:border-lt-green/60 focus:outline-none focus:border-lt-green ${
                r.position <= 3
                  ? 'bg-lt-card border-lt-green/30'
                  : 'bg-lt-card/60 border-lt-card2'
              }`}
            >
              <div className="w-8 text-center font-bebas text-2xl text-lt-white">
                {r.position <= 3 ? MEDALS[r.position - 1] : r.position}
              </div>
              {r.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.image} alt="" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-lt-card2 flex items-center justify-center text-lt-muted font-bebas">
                  {r.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-lt-white font-medium truncate">{r.name}</div>
                <div className="text-xs text-lt-muted">
                  {r.matchesCorrect} {r.matchesCorrect === 1 ? 'partido acertado' : 'partidos acertados'}
                  {r.exactCorrect > 0 && (
                    <span className="text-lt-green">
                      {' · '}
                      {r.exactCorrect} {r.exactCorrect === 1 ? 'exacto' : 'exactos'}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bebas text-2xl text-lt-white leading-none">
                  {r.totalPoints}
                </div>
                <div className="text-[10px] text-lt-muted uppercase tracking-wider">pts</div>
              </div>
              {r.prize > 0 && (
                <div className="text-right pl-2">
                  <div className="font-bebas text-lg text-lt-green leading-none">
                    {formatCOP(r.prize)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        </>
      )}

      {selectedUser && (
        <PlayerDetailModal userId={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  )
}
