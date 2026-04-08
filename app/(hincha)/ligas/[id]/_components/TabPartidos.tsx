'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
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

/** Convert a date to Colombia timezone YYYY-MM-DD key */
function toDateKey(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
}

/** Today's date key in Colombia timezone */
function todayKey(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
}

/** Format date for the strip tab label */
function formatDateTab(dateKey: string, today: string): { label: string; sub: string } {
  const d = new Date(dateKey + 'T12:00:00')
  const diff = (new Date(dateKey).getTime() - new Date(today).getTime()) / 86_400_000

  if (diff === 0) return { label: 'Hoy', sub: d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) }
  if (diff === -1) return { label: 'Ayer', sub: d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) }
  if (diff === 1) return { label: 'Mañana', sub: d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) }

  return {
    label: d.toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', ''),
    sub: d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function TabPartidos({ league, userId, predictions: initialPredictions }: Props) {
  const scoringLabel = league.scoringMode === 'POOL' ? 'Sistema pozo' : 'Puntaje fijo'
  const [preds, setPreds] = useState<Record<string, SPrediction>>(
    Object.fromEntries(initialPredictions.map((p) => [p.questionId, p]))
  )

  if (league.matches.length === 0) {
    return <EmptyPartidos />
  }

  return (
    <MatchesWithDateFilter
      league={league}
      scoringLabel={scoringLabel}
      preds={preds}
      onPrediction={(questionId, pred) =>
        setPreds((prev) => ({ ...prev, [questionId]: pred }))
      }
    />
  )
}

/** Separated to allow hooks after early return */
function MatchesWithDateFilter({
  league, scoringLabel, preds, onPrediction,
}: {
  league: SLeague
  scoringLabel: string
  preds: Record<string, SPrediction>
  onPrediction: (questionId: string, pred: SPrediction) => void
}) {
  const today = useMemo(() => todayKey(), [])

  // Group matches by date (Colombia timezone)
  const { dateKeys, matchesByDate, dateMeta } = useMemo(() => {
    const map = new Map<string, typeof league.matches>()

    for (const lm of league.matches) {
      const key = toDateKey(lm.match.kickoffAt)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(lm)
    }

    // Sort dates chronologically
    const sorted = Array.from(map.keys()).sort()

    // Build metadata per date
    const meta = new Map<string, { matchCount: number; openQuestions: number; hasLive: boolean; allAnswered: boolean }>()
    sorted.forEach((key) => {
      const matches = map.get(key)!
      const matchIds = new Set(matches.map((m) => m.match.id))
      const dateQuestions = league.questions.filter((q) => matchIds.has(q.matchId))
      const openQuestions = dateQuestions.filter((q) => q.status === 'OPEN').length
      const hasLive = matches.some((m) => m.match.status === 'LIVE' || m.match.status === 'HALFTIME')
      const answerableQs = dateQuestions.filter((q) => q.status === 'OPEN' || q.status === 'CLOSED' || q.status === 'RESOLVED')
      const answeredCount = answerableQs.filter((q) => preds[q.id]).length
      const allAnswered = answerableQs.length > 0 && answeredCount === answerableQs.length

      meta.set(key, { matchCount: matches.length, openQuestions, hasLive, allAnswered })
    })

    return { dateKeys: sorted, matchesByDate: map, dateMeta: meta }
  }, [league.matches, league.questions, preds])

  // Determine initial selected date: prefer today, then nearest date with open questions, then nearest future date
  const initialDate = useMemo(() => {
    // If today has matches, use it
    if (dateKeys.includes(today)) return today

    // Find nearest date with open questions
    const withOpen = dateKeys.find((k) => dateMeta.get(k)!.openQuestions > 0)
    if (withOpen) return withOpen

    // Find nearest date with live matches
    const withLive = dateKeys.find((k) => dateMeta.get(k)!.hasLive)
    if (withLive) return withLive

    // Find nearest future date
    const future = dateKeys.find((k) => k >= today)
    if (future) return future

    // Fall back to last date (most recent past)
    return dateKeys[dateKeys.length - 1]
  }, [dateKeys, today, dateMeta])

  const [selectedDate, setSelectedDate] = useState(initialDate)

  // Scroll active tab into view
  const stripRef = useRef<HTMLDivElement>(null)
  const activeTabRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (activeTabRef.current && stripRef.current) {
      activeTabRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [selectedDate])

  // Get matches for selected date
  const dayMatches = matchesByDate.get(selectedDate) ?? []

  // No need to track hasActiveMatch — matches default to collapsed

  return (
    <div className="space-y-4">
      {/* ── Date strip ─────────────────────────────────── */}
      <div className="-mx-4">
        <div
          ref={stripRef}
          className="flex gap-1 overflow-x-auto no-scrollbar px-4 pb-1"
        >
          {dateKeys.map((dateKey) => {
            const { label, sub } = formatDateTab(dateKey, today)
            const meta = dateMeta.get(dateKey)!
            const isSelected = dateKey === selectedDate
            const isToday = dateKey === today

            return (
              <button
                key={dateKey}
                ref={isSelected ? activeTabRef : undefined}
                onClick={() => setSelectedDate(dateKey)}
                className={cn(
                  'flex flex-col items-center px-3 py-2 rounded-card min-w-[64px] flex-shrink-0 transition-all border',
                  isSelected
                    ? 'bg-lt-green/15 border-lt-green/40 text-lt-green'
                    : 'bg-lt-card border-[rgba(255,255,255,0.07)] text-lt-muted2 hover:border-lt-green/20'
                )}
              >
                <span className={cn(
                  'font-condensed text-xs font-700 uppercase tracking-wide',
                  isToday && !isSelected && 'text-lt-white'
                )}>
                  {label}
                </span>
                <span className="font-condensed text-[10px] mt-0.5 opacity-70">
                  {sub}
                </span>
                {/* Indicators */}
                <div className="flex items-center gap-1 mt-1 h-3">
                  {meta.hasLive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-lt-red animate-pulse-dot" />
                  )}
                  {meta.openQuestions > 0 && !meta.hasLive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-lt-green" />
                  )}
                  {meta.allAnswered && !meta.hasLive && meta.openQuestions === 0 && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-lt-green/60">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Match count for selected day ───────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-lt-muted2 font-condensed text-xs uppercase tracking-wide">
          {dayMatches.length} partido{dayMatches.length !== 1 ? 's' : ''}
        </p>
        {(dateMeta.get(selectedDate)?.openQuestions ?? 0) > 0 && (
          <p className="text-lt-green font-condensed text-xs font-700">
            {dateMeta.get(selectedDate)!.openQuestions} pregunta{dateMeta.get(selectedDate)!.openQuestions !== 1 ? 's' : ''} abierta{dateMeta.get(selectedDate)!.openQuestions !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ── Match cards ────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDate}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.18 }}
          className="space-y-5"
        >
          {dayMatches.map(({ match }) => {
            const matchQuestions = league.questions.filter((q) => q.matchId === match.id)
            const isLive = match.status === 'LIVE' || match.status === 'HALFTIME'
            const hasOpen = matchQuestions.some((q) => q.status === 'OPEN')
            const defaultOpen = isLive || hasOpen

            return (
              <MatchCard
                key={match.id}
                match={match}
                questions={matchQuestions}
                leagueId={league.id}
                scoringLabel={scoringLabel}
                predictions={preds}
                defaultOpen={defaultOpen}
                onPrediction={(questionId, pred) => onPrediction(questionId, pred)}
              />
            )
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ── MatchCard ─────────────────────────────────────────────

function MatchCard({
  match, questions, leagueId, scoringLabel, predictions, onPrediction,
}: {
  match: SMatch
  questions: SQuestion[]
  leagueId: string
  scoringLabel: string
  predictions: Record<string, SPrediction>
  onPrediction: (questionId: string, pred: SPrediction) => void
  defaultOpen?: boolean
}) {
  const isLive = match.status === 'LIVE' || match.status === 'HALFTIME'
  const isFinished = match.status === 'FINISHED'
  const hasOpen = questions.some(q => q.status === 'OPEN')
  // Only auto-expand if match is LIVE and has open questions — everything else starts collapsed
  const [isExpanded, setIsExpanded] = useState(isLive && hasOpen)
  const kickoff = new Date(match.kickoffAt)
  const answeredCount = questions.filter(q => predictions[q.id]).length
  const openQuestions = questions.filter(q => q.status === 'OPEN').length

  // Stats for finished match summary
  const correctCount = questions.filter(q => predictions[q.id]?.isCorrect === true).length
  const totalPointsEarned = questions.reduce((sum, q) => sum + (predictions[q.id]?.pointsEarned ?? 0), 0)

  // Derived counts
  const unansweredOpen = questions.filter(q => q.status === 'OPEN' && !predictions[q.id]).length
  const answeredOpen = questions.filter(q => q.status === 'OPEN' && predictions[q.id]).length

  return (
    <div className={cn(
      'bg-lt-card rounded-card border overflow-hidden transition-colors',
      isLive ? 'border-lt-red/30' : 'border-[rgba(255,255,255,0.07)]'
    )}>
      {/* Match header — clickable to toggle */}
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className={cn(
          'w-full text-left transition-colors',
          isLive && 'bg-lt-red/5',
          isExpanded && 'border-b border-[rgba(255,255,255,0.05)]'
        )}
      >
        {/* Top bar: competition + status + chevron */}
        <div className="flex items-center justify-between px-4 pt-3 pb-0">
          <span className="text-lt-muted2 font-condensed text-[10px] uppercase tracking-widest">
            {match.competition}
          </span>
          <div className="flex items-center gap-1.5">
            <MatchStatusBadge match={match} />
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              className={cn(
                'text-lt-muted2 transition-transform duration-200 flex-shrink-0',
                isExpanded && 'rotate-180'
              )}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Teams + Score — centered with max-width for better proportions */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-center max-w-[400px] mx-auto">
            {/* Home team */}
            <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
              {match.homeLogo ? (
                <Image src={match.homeLogo} alt={match.homeTeam} width={40} height={40} className="object-contain flex-shrink-0" />
              ) : (
                <TeamPlaceholder size={40} />
              )}
              <span className="text-lt-white font-condensed text-xs font-700 text-center leading-tight line-clamp-2">
                {match.homeTeam}
              </span>
            </div>

            {/* Score / Time — center column */}
            <div className="flex flex-col items-center px-3 min-w-[72px]">
              {isLive || isFinished ? (
                <span className={cn(
                  'font-bebas text-3xl leading-none tabular-nums tracking-wide',
                  isLive ? 'text-lt-green' : 'text-lt-white'
                )}>
                  {match.homeScore ?? 0} - {match.awayScore ?? 0}
                </span>
              ) : (
                <span className="font-bebas text-2xl text-lt-white tabular-nums leading-none">
                  {kickoff.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {isLive && match.minutePlayed && (
                <span className="text-lt-red text-[10px] font-condensed font-700 mt-1 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-lt-red animate-pulse-dot" />
                  {formatMatchMinute(match.minutePlayed)}
                </span>
              )}
              {!isLive && !isFinished && (
                <span className="text-lt-muted2 text-[10px] font-condensed mt-0.5">
                  {kickoff.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>

            {/* Away team */}
            <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
              {match.awayLogo ? (
                <Image src={match.awayLogo} alt={match.awayTeam} width={40} height={40} className="object-contain flex-shrink-0" />
              ) : (
                <TeamPlaceholder size={40} />
              )}
              <span className="text-lt-white font-condensed text-xs font-700 text-center leading-tight line-clamp-2">
                {match.awayTeam}
              </span>
            </div>
          </div>
        </div>

        {/* Question status bar — always visible when there are questions */}
        {questions.length > 0 && (
          <div className="px-4 pb-3">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {/* Open questions with pending answers */}
              {unansweredOpen > 0 && (
                <span className="flex items-center gap-1 bg-lt-amber/10 border border-lt-amber/25 text-lt-amber font-condensed text-[10px] font-700 px-2.5 py-1 rounded-full">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {unansweredOpen} sin responder
                </span>
              )}
              {/* Answered open questions */}
              {answeredOpen > 0 && (
                <span className="flex items-center gap-1 bg-lt-green/10 border border-lt-green/25 text-lt-green font-condensed text-[10px] font-700 px-2.5 py-1 rounded-full">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {answeredOpen} respondida{answeredOpen !== 1 ? 's' : ''}
                </span>
              )}
              {/* All answered, no more open — show completed */}
              {openQuestions === 0 && answeredCount === questions.length && questions.length > 0 && (
                <span className="flex items-center gap-1 bg-lt-green/10 text-lt-green font-condensed text-[10px] font-700 px-2.5 py-1 rounded-full">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {answeredCount}/{questions.length} completadas
                </span>
              )}
              {/* Partially answered, none open */}
              {openQuestions === 0 && answeredCount > 0 && answeredCount < questions.length && (
                <span className="flex items-center gap-1 bg-lt-card2 text-lt-muted2 font-condensed text-[10px] px-2.5 py-1 rounded-full">
                  {answeredCount}/{questions.length} respondidas
                </span>
              )}
              {/* No open, never answered */}
              {openQuestions === 0 && answeredCount === 0 && !isFinished && (
                <span className="text-lt-muted2 font-condensed text-[10px]">
                  {questions.length} pregunta{questions.length !== 1 ? 's' : ''} · Pendientes
                </span>
              )}
              {/* Finished match summary when collapsed */}
              {isFinished && !isExpanded && (
                <>
                  <span className="text-lt-muted2 font-condensed text-[10px]">·</span>
                  <span className="text-lt-muted2 font-condensed text-[10px]">
                    {correctCount} acierto{correctCount !== 1 ? 's' : ''}
                  </span>
                  {totalPointsEarned > 0 && (
                    <>
                      <span className="text-lt-muted2 font-condensed text-[10px]">·</span>
                      <span className="text-lt-green font-condensed text-[10px] font-700">
                        +{totalPointsEarned} pts
                      </span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* CTA si está en vivo */}
        {isLive && (
          <div className="px-4 pb-3">
            <Link
              href={`/ligas/${leagueId}/trivia?matchId=${match.id}`}
              onClick={(e) => e.stopPropagation()}
              className="w-full flex items-center justify-center gap-2 bg-lt-red text-white font-condensed font-700 text-sm py-2.5 rounded-btn hover:opacity-90 transition-opacity"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse-dot" />
              ¡JUGAR EN VIVO AHORA!
            </Link>
          </div>
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
  const isScoreType = question.type === 'SCORE'

  // Score input state
  const [homeScore, setHomeScore] = useState<string>(() => {
    if (!prediction?.answer) return ''
    const m = prediction.answer.match(/(\d+)\s*-\s*(\d+)/)
    return m ? m[1] : ''
  })
  const [awayScore, setAwayScore] = useState<string>(() => {
    if (!prediction?.answer) return ''
    const m = prediction.answer.match(/(\d+)\s*-\s*(\d+)/)
    return m ? m[2] : ''
  })

  // For SCORE type, build the answer from inputs
  const scoreAnswer = isScoreType && homeScore !== '' && awayScore !== '' ? `${homeScore}-${awayScore}` : null
  const effectiveSelected = isScoreType ? scoreAnswer : selected

  // The selection differs from what's saved on the server
  const hasUnsavedChange = isOpen && effectiveSelected !== null && effectiveSelected !== (prediction?.answer ?? null)
  // Already saved and no new change
  const isSaved = prediction !== null && effectiveSelected === prediction.answer

  async function save() {
    if (!effectiveSelected || loading || !hasUnsavedChange) return
    setLoading(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/predictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id, answer: effectiveSelected }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar')
      onSave({
        id: data.id,
        questionId: question.id,
        answer: effectiveSelected,
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
            {isScoreType ? (
              /* ── SCORE: numeric inputs ── */
              <div className="bg-lt-card rounded-btn border border-[rgba(255,255,255,0.07)] p-3">
                <div className="flex items-center justify-center gap-3">
                  <div className="flex-1 text-center">
                    <p className="font-condensed text-[10px] text-lt-muted2 uppercase tracking-wider mb-1">{match.homeTeam}</p>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                      disabled={loading}
                      className="w-14 h-12 mx-auto bg-lt-card2 border border-[rgba(255,255,255,0.15)] rounded-btn text-center font-bebas text-2xl text-lt-white focus:border-lt-green focus:outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0"
                    />
                  </div>
                  <span className="font-bebas text-xl text-lt-muted2 mt-4">—</span>
                  <div className="flex-1 text-center">
                    <p className="font-condensed text-[10px] text-lt-muted2 uppercase tracking-wider mb-1">{match.awayTeam}</p>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                      disabled={loading}
                      className="w-14 h-12 mx-auto bg-lt-card2 border border-[rgba(255,255,255,0.15)] rounded-btn text-center font-bebas text-2xl text-lt-white focus:border-lt-green focus:outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* ── Regular: multiple choice ── */
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
            )}

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

function TeamPlaceholder({ size = 32 }: { size?: number }) {
  return <div className="rounded-full bg-lt-card2 border border-[rgba(255,255,255,0.1)] flex-shrink-0" style={{ width: size, height: size }} />
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
