'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { PoolPlayerDetail } from '@/types'

async function fetchPlayer(userId: string): Promise<PoolPlayerDetail> {
  const res = await fetch(`/api/mundial/player/${userId}`)
  if (!res.ok) throw new Error('Error cargando el detalle')
  const j = await res.json()
  return j.data
}

function scoreTag(b: PoolPlayerDetail['breakdown'][number]) {
  if (!b.predicted) return { label: 'Sin pronóstico', cls: 'text-lt-muted' }
  if (b.exactCorrect) return { label: 'Exacto', cls: 'text-lt-green' }
  if (b.outcomeCorrect) return { label: 'Acierto', cls: 'text-lt-green/80' }
  return { label: 'Errado', cls: 'text-lt-red' }
}

// Gráfica de evolución de posición: posición 1 arriba, eje X = jornadas.
function PositionChart({ history }: { history: PoolPlayerDetail['history'] }) {
  if (history.length === 0) {
    return (
      <p className="text-xs text-lt-muted text-center py-4">
        Aún no hay jornadas jugadas para mostrar evolución.
      </p>
    )
  }

  const W = 320
  const H = 120
  const padX = 16
  const padY = 18
  const positions = history.map((h) => h.position)
  const minPos = Math.min(...positions)
  const maxPos = Math.max(...positions)
  const range = Math.max(maxPos - minPos, 1)
  const n = history.length

  const x = (i: number) => (n === 1 ? W / 2 : padX + (i / (n - 1)) * (W - 2 * padX))
  // Posición menor (mejor) → más arriba (y menor).
  const y = (pos: number) => padY + ((pos - minPos) / range) * (H - 2 * padY)

  const points = history.map((h, i) => `${x(i)},${y(h.position)}`).join(' ')
  const last = history[history.length - 1]
  const prev = history.length > 1 ? history[history.length - 2] : null
  const delta = prev ? prev.position - last.position : 0 // >0 subió, <0 bajó

  return (
    <div>
      <div className="flex items-end justify-between mb-1">
        <span className="text-[11px] uppercase tracking-wider text-lt-muted">
          Evolución de posición
        </span>
        <span className="text-xs">
          <span className="text-lt-white font-bebas text-lg">{last.position}°</span>{' '}
          {delta > 0 && <span className="text-lt-green">▲ {delta}</span>}
          {delta < 0 && <span className="text-lt-red">▼ {Math.abs(delta)}</span>}
          {delta === 0 && prev && <span className="text-lt-muted">=</span>}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28" preserveAspectRatio="none">
        {n > 1 && (
          <polyline
            points={points}
            fill="none"
            stroke="var(--lt-green, #00E676)"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {history.map((h, i) => (
          <circle
            key={h.dayKey}
            cx={x(i)}
            cy={y(h.position)}
            r={i === n - 1 ? 4 : 2.5}
            fill={i === n - 1 ? 'var(--lt-green, #00E676)' : 'var(--lt-card2, #2a2a2a)'}
            stroke="var(--lt-green, #00E676)"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div className="flex justify-between text-[9px] text-lt-muted mt-1">
        <span>{history[0].label}</span>
        {n > 1 && <span>{last.label}</span>}
      </div>
    </div>
  )
}

export default function PlayerDetailModal({
  userId,
  onClose,
}: {
  userId: string
  onClose: () => void
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['mundial-player', userId],
    queryFn: () => fetchPlayer(userId),
  })

  // Cerrar con Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[85vh] overflow-y-auto bg-lt-card border border-lt-card2 rounded-t-card sm:rounded-card animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between bg-lt-card border-b border-lt-card2 px-4 py-3">
          <h3 className="font-bebas text-2xl text-lt-white leading-none truncate pr-2">
            {data ? data.name : 'Cargando…'}
          </h3>
          <button
            onClick={onClose}
            className="shrink-0 text-lt-muted hover:text-lt-white text-xl leading-none px-2"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="px-4 py-4">
          {isLoading && <p className="text-center text-lt-muted py-8">Cargando…</p>}
          {isError && <p className="text-center text-lt-red py-8">No se pudo cargar el detalle.</p>}

          {data && (
            <>
              {/* Resumen */}
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                  <div className="font-bebas text-4xl text-lt-white leading-none">
                    {data.position}°
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-lt-muted">Posición</div>
                </div>
                <div className="text-center">
                  <div className="font-bebas text-4xl text-lt-green leading-none">
                    {data.totalPoints}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-lt-muted">Puntos</div>
                </div>
                <div className="text-xs text-lt-muted">
                  {data.matchesCorrect} acertados
                  {data.exactCorrect > 0 && (
                    <span className="text-lt-green"> · {data.exactCorrect} exactos</span>
                  )}
                </div>
              </div>

              {/* Evolución */}
              <div className="rounded-card bg-lt-card2/50 border border-lt-card2 p-3 mb-4">
                <PositionChart history={data.history} />
              </div>

              {/* Conciliación del total: de dónde salen los puntos */}
              {(() => {
                const matchPts = data.extras.matchPoints
                const bracketPts = data.extras.bracket?.points ?? 0
                const questionsPts = data.extras.questions.reduce((s, q) => s + q.points, 0)
                return (
                  <div className="text-[11px] text-lt-muted mb-4 leading-snug">
                    Partidos <b className="text-lt-white">{matchPts}</b> · Bracket{' '}
                    <b className="text-lt-white">{bracketPts}</b> · Preguntas{' '}
                    <b className="text-lt-white">{questionsPts}</b> ={' '}
                    <b className="text-lt-green">{data.totalPoints}</b> pts
                  </div>
                )
              })()}

              {/* Otros puntos: bracket de grupos + preguntas ya resueltas */}
              {(data.extras.bracket || data.extras.questions.length > 0) && (
                <div className="mb-4">
                  <div className="text-[11px] uppercase tracking-wider text-lt-muted mb-2">
                    Otros puntos
                  </div>
                  <div className="space-y-1.5">
                    {data.extras.bracket && (
                      <div className="rounded-card bg-lt-card2/40 border border-lt-card2 px-3 py-2 flex items-center justify-between gap-2">
                        <span className="text-sm text-lt-white">
                          Bracket de grupos
                          <span className="block text-[11px] text-lt-muted">
                            {data.extras.bracket.positionsCorrect} posiciones ×{' '}
                            {data.extras.bracket.pointsPerPosition}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs text-lt-white">
                          +{data.extras.bracket.points}
                        </span>
                      </div>
                    )}
                    {data.extras.questions.map((q, i) => (
                      <div
                        key={i}
                        className="rounded-card bg-lt-card2/40 border border-lt-card2 px-3 py-2 flex items-center justify-between gap-2"
                      >
                        <span className="text-sm text-lt-white truncate pr-2">{q.label}</span>
                        <span
                          className={`shrink-0 text-xs ${q.correct ? 'text-lt-green' : 'text-lt-muted'}`}
                        >
                          +{q.points}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Desglose por partido */}
              <div className="text-[11px] uppercase tracking-wider text-lt-muted mb-2">
                Desglose por partido finalizado
              </div>
              {data.breakdown.length === 0 ? (
                <p className="text-sm text-lt-muted text-center py-6">
                  Todavía no hay partidos finalizados.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {data.breakdown.map((b) => {
                    const tag = scoreTag(b)
                    return (
                      <div
                        key={b.matchId}
                        className="rounded-card bg-lt-card2/40 border border-lt-card2 px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-lt-white truncate">
                            {b.homeFlag ? `${b.homeFlag} ` : ''}
                            {b.homeTeam}{' '}
                            <span className="font-bebas">
                              {b.homeScore}-{b.awayScore}
                            </span>{' '}
                            {b.awayTeam}
                            {b.awayFlag ? ` ${b.awayFlag}` : ''}
                          </span>
                          <span className="shrink-0 text-xs text-lt-white">
                            +{b.pointsEarned}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <span className="text-[11px] text-lt-muted">
                            {b.predicted
                              ? `Pronóstico: ${b.predicted.home}-${b.predicted.away}`
                              : 'No pronosticó'}
                          </span>
                          <span className="text-[11px] flex items-center gap-1">
                            {b.advanceCorrect && (
                              <span className="text-lt-green">avanza ✓ ·</span>
                            )}
                            <span className={tag.cls}>{tag.label}</span>
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
