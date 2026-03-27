'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, formatMatchMinute } from '@/lib/utils'
import type { SLeague, SMatch, SQuestion, SPrediction } from './types'

interface Props {
  league: SLeague
  userId: string
  predictions: SPrediction[]
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function TabPartidos({ league, userId, predictions: initialPredictions }: Props) {
  const scoringLabel = league.scoringMode === 'POOL' ? 'Sistema pozo' : 'Puntaje fijo'
  const [preds, setPreds] = useState<Record<string, SPrediction>>(
    Object.fromEntries(initialPredictions.map((p) => [p.questionId, p]))
  )

  if (league.matches.length === 0) {
    return (
      <EmptyPartidos />
    )
  }

  // Determine which matches should be expanded by default:
  // - Live/halftime matches always open
  // - Matches with OPEN questions always open
  // - If none of the above, open the most recent (first) match
  const hasActivMatch = league.matches.some(({ match }) => {
    const isLive = match.status === 'LIVE' || match.status === 'HALFTIME'
    const hasOpen = league.questions.some((q) => q.matchId === match.id && q.status === 'OPEN')
    return isLive || hasOpen
  })

  return (
    <div className="space-y-5">
      {league.matches.map(({ match }, index) => {
        const matchQuestions = league.questions.filter((q) => q.matchId === match.id)
        const isLive = match.status === 'LIVE' || match.status === 'HALFTIME'
        const hasOpen = matchQuestions.some((q) => q.status === 'OPEN')
        // Open if live, has open questions, or (no active match and it's the first one)
        const defaultOpen = isLive || hasOpen || (!hasActivMatch && index === 0)

        return (
          <MatchCard
            key={match.id}
            match={match}
            questions={matchQuestions}
            leagueId={league.id}
            scoringLabel={scoringLabel}
            predictions={preds}
            defaultOpen={defaultOpen}
            onPrediction={(questionId, pred) =>
              setPreds((prev) => ({ ...prev, [questionId]: pred }))
            }
          />
        )
      })}
    </div>
  )
}

// ── MatchCard ─────────────────────────────────────────────

function MatchCard({
  match, questions, leagueId, scoringLabel, predictions, onPrediction, defaultOpen,
}: {
  match: SMatch
  questions: SQuestion[]
  leagueId: string
  scoringLabel: string
  predictions: Record<string, SPrediction>
  onPrediction: (questionId: string, pred: SPrediction) => void
  defaultOpen: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(defaultOpen)
  const isLive = match.status === 'LIVE' || match.status === 'HALFTIME'
  const isFinished = match.status === 'FINISHED'
  const kickoff = new Date(match.kickoffAt)
  const answeredCount = questions.filter(q => predictions[q.id]).length
  const openQuestions = questions.filter(q => q.status === 'OPEN').length

  return (
    <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] overflow-hidden">
      {/* Match header — clickable to toggle */}
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className={cn(
          'w-full text-left px-4 pt-4 pb-3 transition-colors',
          isLive && 'bg-lt-red/5 border-b border-lt-red/20',
          !isLive && !isExpanded && 'border-b border-transparent',
          !isLive && isExpanded && 'border-b border-[rgba(255,255,255,0.05)]'
        )}
      >
        {/* Competition + status + chevron */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-lt-muted2 font-condensed text-xs uppercase tracking-wide">
            {match.competition}
          </span>
          <div className="flex items-center gap-2">
            {/* Badges resumen cuando está colapsado */}
            {!isExpanded && questions.length > 0 && (
              <span className="text-lt-muted2 font-condensed text-[10px]">
                {answeredCount}/{questions.length}
                {openQuestions > 0 && (
                  <span className="text-lt-green ml-1">· {openQuestions} abiertas</span>
                )}
              </span>
            )}
            <MatchStatusBadge match={match} />
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={cn(
                'text-lt-muted2 transition-transform duration-200 flex-shrink-0',
                isExpanded && 'rotate-180'
              )}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Equipos + marcador */}
        <div className="flex items-center gap-2">
          {/* Home */}
          <div className="flex flex-1 items-center justify-end gap-2">
            <span className="text-lt-white font-condensed text-base font-700 text-right leading-tight">
              {match.homeTeam}
            </span>
            {match.homeLogo ? (
              <Image src={match.homeLogo} alt={match.homeTeam} width={32} height={32} className="object-contain flex-shrink-0" />
            ) : (
              <TeamPlaceholder />
            )}
          </div>

          {/* Marcador */}
          <div className="flex flex-col items-center min-w-[52px]">
            {isLive || isFinished ? (
              <span className={cn(
                'font-bebas text-2xl leading-none tabular-nums',
                isLive ? 'text-lt-green' : 'text-lt-white'
              )}>
                {match.homeScore ?? 0} - {match.awayScore ?? 0}
              </span>
            ) : (
              <span className="text-lt-muted2 font-condensed text-sm tabular-nums">
                {kickoff.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {isLive && match.minutePlayed && (
              <span className="text-lt-red text-[10px] font-condensed mt-0.5">
                {formatMatchMinute(match.minutePlayed)}
              </span>
            )}
            {!isLive && !isFinished && (
              <span className="text-lt-muted2 text-[10px] font-condensed mt-0.5">
                {kickoff.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
              </span>
            )}
          </div>

          {/* Away */}
          <div className="flex flex-1 items-center gap-2">
            {match.awayLogo ? (
              <Image src={match.awayLogo} alt={match.awayTeam} width={32} height={32} className="object-contain flex-shrink-0" />
            ) : (
              <TeamPlaceholder />
            )}
            <span className="text-lt-white font-condensed text-base font-700 leading-tight">
              {match.awayTeam}
            </span>
          </div>
        </div>

        {/* CTA si está en vivo */}
        {isLive && (
          <Link
            href={`/ligas/${leagueId}/trivia?matchId=${match.id}`}
            onClick={(e) => e.stopPropagation()}
            className="mt-3 w-full flex items-center justify-center gap-2 bg-lt-red text-white font-condensed font-700 text-sm py-2.5 rounded-btn hover:opacity-90 transition-opacity"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse-dot" />
            ¡JUGAR EN VIVO AHORA!
          </Link>
        )}
      </button>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {questions.length > 0 ? (
              <div className="px-4 py-4 space-y-4">
                <p className="text-lt-muted2 font-condensed text-xs uppercase tracking-widest">
                  Predicciones — {answeredCount}/{questions.length} respondidas
                </p>
                {questions.map((q) => (
                  <PredictionQuestion
                    key={q.id}
                    question={q}
                    match={match}
                    leagueId={leagueId}
                    scoringLabel={scoringLabel}
                    prediction={predictions[q.id] ?? null}
                    onSave={(pred) => onPrediction(q.id, pred)}
                  />
                ))}
              </div>
            ) : (
              <div className="px-4 py-4 text-center">
                <p className="text-lt-muted2 font-condensed text-sm">Sin predicciones para este partido</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── PredictionQuestion ────────────────────────────────────

function PredictionQuestion({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  question, match, leagueId, scoringLabel, prediction, onSave,
}: {
  question: SQuestion
  match: SMatch
  leagueId: string
  scoringLabel: string
  prediction: SPrediction | null
  onSave: (pred: SPrediction) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<string | null>(prediction?.answer ?? null)
  const [saved, setSaved] = useState(false)
  const isOpen = question.status === 'OPEN'

  // The selection differs from what's saved on the server
  const hasUnsavedChange = isOpen && selected !== null && selected !== (prediction?.answer ?? null)
  // Already saved and no new change
  const isSaved = prediction !== null && selected === prediction.answer

  async function save() {
    if (!selected || loading || !hasUnsavedChange) return
    setLoading(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/predictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id, answer: selected }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar')
      onSave({
        id: data.id,
        questionId: question.id,
        answer: selected,
        isCorrect: null,
        pointsEarned: 0,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  // Resultado si resuelta
  const resolved = question.status === 'RESOLVED'
  const correct = resolved && prediction?.isCorrect === true

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-btn border p-3 transition-colors',
          resolved && correct  ? 'border-lt-green/40 bg-lt-green/5' :
          resolved && prediction ? 'border-lt-red/30 bg-lt-red/5' :
          'border-[rgba(255,255,255,0.07)] bg-lt-card2'
        )}
      >
        {/* Status pill */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-lt-white font-condensed text-sm font-600 leading-snug flex-1 mr-2">
            {question.text}
          </p>
          <QuestionStatusPill status={question.status} />
        </div>

        {/* Points */}
        <p className="text-lt-muted2 text-xs font-condensed mb-3">
          🏆 {scoringLabel} · {question.pointsValue} pts
        </p>

        {/* Options — selectable while question is open */}
        {isOpen ? (
          <div className="space-y-2">
            <div className="grid gap-2">
              {question.options.map((opt) => {
                const isSelected = selected === opt
                return (
                  <button
                    key={opt}
                    onClick={() => setSelected(opt)}
                    disabled={loading}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-btn border font-condensed text-sm transition-all active:scale-[0.98] disabled:opacity-50',
                      isSelected
                        ? 'border-lt-green bg-lt-green/10 text-lt-white'
                        : 'border-lt-muted text-lt-white hover:border-lt-green/50 hover:bg-lt-green/5'
                    )}
                  >
                    <span className="flex items-center justify-between">
                      {opt}
                      {isSelected && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-lt-green flex-shrink-0">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Save button */}
            {hasUnsavedChange && (
              <motion.button
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={save}
                disabled={loading}
                className="w-full py-2.5 rounded-btn bg-lt-green text-lt-black font-condensed text-sm font-700 disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                {loading ? 'Guardando…' : 'Guardar predicción'}
              </motion.button>
            )}

            {/* Saved confirmation */}
            {isSaved && !hasUnsavedChange && (
              <p className="text-center font-condensed text-xs text-lt-green">
                {saved ? '✓ Predicción guardada' : '✓ Guardada — puedes cambiarla mientras esté abierta'}
              </p>
            )}
          </div>
        ) : prediction ? (
          /* Answered and closed/resolved */
          <div className={cn(
            'flex items-center justify-between px-3 py-2.5 rounded-btn border',
            correct ? 'border-lt-green/40 bg-lt-green/10' :
            resolved ? 'border-lt-red/30 bg-lt-red/5' :
            'border-lt-muted bg-lt-card'
          )}>
            <div>
              <span className="text-lt-muted2 font-condensed text-xs uppercase tracking-wider mr-2">Tu predicción:</span>
              <span className={cn(
                'font-condensed text-sm font-700',
                correct ? 'text-lt-green' : resolved ? 'text-lt-red' : 'text-lt-white'
              )}>
                {prediction.answer}
              </span>
            </div>
            {resolved && (
              <div className="text-right">
                {correct ? (
                  <div>
                    <span className="text-lt-green font-condensed text-sm font-700">+{prediction.pointsEarned} pts ✓</span>
                    {question.winnersCount != null && (
                      <p className="text-lt-muted2 font-condensed text-[10px]">
                        {question.totalPot ? `Pozo: ${question.totalPot} · ` : ''}{question.winnersCount} {question.winnersCount === 1 ? 'ganador' : 'ganadores'}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <span className="text-lt-red font-condensed text-xs">✗ Incorrecto</span>
                    <p className="text-lt-muted2 font-condensed text-xs">Resp: {question.correctAnswer}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Cerrada sin responder */
          <p className="text-lt-muted2 font-condensed text-xs italic">
            {question.status === 'CLOSED' ? 'Tiempo agotado — no respondiste' : 'Pendiente de apertura'}
          </p>
        )}

        {error && <p className="text-lt-red text-xs font-condensed mt-2">{error}</p>}
      </motion.div>
    </AnimatePresence>
  )
}

// ── Sub-components ────────────────────────────────────────

function MatchStatusBadge({ match }: { match: SMatch }) {
  if (match.status === 'LIVE') {
    return (
      <span className="flex items-center gap-1.5 text-lt-red font-condensed text-xs font-700">
        <span className="w-1.5 h-1.5 rounded-full bg-lt-red animate-pulse-dot" />
        EN VIVO
      </span>
    )
  }
  if (match.status === 'HALFTIME') {
    return <span className="text-lt-amber font-condensed text-xs font-700 px-2 py-0.5 rounded-full bg-lt-amber/10 border border-lt-amber/30">DESCANSO</span>
  }
  if (match.status === 'FINISHED') {
    return <span className="text-lt-muted2 font-condensed text-xs uppercase">Final</span>
  }
  if (match.status === 'CANCELLED') {
    return <span className="text-lt-red font-condensed text-xs uppercase">Cancelado</span>
  }
  return <span className="text-lt-muted2 font-condensed text-xs uppercase">Programado</span>
}

function QuestionStatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    OPEN:     { label: 'Abierta',   cls: 'text-lt-green bg-lt-green/10 border-lt-green/30' },
    CLOSED:   { label: 'Cerrada',   cls: 'text-lt-muted2 bg-lt-muted/20 border-lt-muted'   },
    RESOLVED: { label: 'Resuelta',  cls: 'text-lt-blue bg-lt-blue/10 border-lt-blue/30'    },
    PENDING:  { label: 'Pendiente', cls: 'text-lt-muted2 bg-lt-muted/20 border-lt-muted'   },
  }
  const { label, cls } = map[status] ?? map.PENDING
  return (
    <span className={cn('flex-shrink-0 text-[10px] font-condensed font-600 px-2 py-0.5 rounded-full border uppercase tracking-wider', cls)}>
      {label}
    </span>
  )
}

function TeamPlaceholder() {
  return <div className="w-8 h-8 rounded-full bg-lt-card2 border border-lt-muted flex-shrink-0" />
}

function EmptyPartidos() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="text-5xl">📅</div>
      <p className="text-lt-white font-condensed text-lg font-700">Sin partidos aún</p>
      <p className="text-lt-muted2 font-barlow text-sm leading-snug max-w-[240px]">
        El administrador de la liga añadirá los partidos próximamente
      </p>
    </div>
  )
}
