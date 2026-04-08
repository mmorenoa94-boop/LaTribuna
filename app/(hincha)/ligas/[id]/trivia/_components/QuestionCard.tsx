'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TQuestion {
  id: string
  text: string
  type?: string
  options: string[]
  pointsValue: number
  orderIndex: number
  closedAt: string | null
  openAt: string | null
}

interface TAnswer {
  questionId: string
  answer: string
}

interface Props {
  question: TQuestion
  myAnswer: TAnswer | null
  questionIndex: number
  totalQuestions: number
  scoringLabel?: string
  homeTeam?: string
  awayTeam?: string
  onAnswer: (answer: string) => void
}

export function QuestionCard({ question, myAnswer, questionIndex, totalQuestions, scoringLabel = 'Puntaje fijo', homeTeam, awayTeam, onAnswer }: Props) {
  const hasAnswered = myAnswer !== null
  const [submitting, setSubmitting] = useState(false)
  const [optimistic, setOptimistic] = useState<string | null>(myAnswer?.answer ?? null)
  const [pendingSelection, setPendingSelection] = useState<string | null>(null)
  const [locked, setLocked] = useState(hasAnswered)
  const [homeScore, setHomeScore] = useState<string>('')
  const [awayScore, setAwayScore] = useState<string>('')
  const isScoreType = question.type === 'SCORE'

  // Parse existing score answer
  useEffect(() => {
    if (myAnswer?.answer && isScoreType) {
      const m = myAnswer.answer.match(/(\d+)\s*-\s*(\d+)/)
      if (m) { setHomeScore(m[1]); setAwayScore(m[2]) }
    }
  }, [myAnswer?.answer, isScoreType])
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (!question.closedAt) return 30
    return Math.max(0, Math.floor((new Date(question.closedAt).getTime() - Date.now()) / 1000))
  })

  // Sync optimistic with server answer when it changes
  useEffect(() => {
    if (myAnswer?.answer) setOptimistic(myAnswer.answer)
  }, [myAnswer?.answer])

  // Calculate total duration for bar width
  const totalDuration = useRef<number>(30)
  useEffect(() => {
    if (question.openAt && question.closedAt) {
      totalDuration.current = Math.max(
        1,
        Math.floor(
          (new Date(question.closedAt).getTime() - new Date(question.openAt).getTime()) / 1000
        )
      )
    }
  }, [question.openAt, question.closedAt])

  // Countdown — always runs while question is open
  useEffect(() => {
    const interval = setInterval(() => {
      if (!question.closedAt) return
      const left = Math.max(0, Math.floor((new Date(question.closedAt).getTime() - Date.now()) / 1000))
      setTimeLeft(left)
    }, 250)
    return () => clearInterval(interval)
  }, [question.closedAt])

  const expired = timeLeft <= 0
  const timerPct = Math.min(100, (timeLeft / totalDuration.current) * 100)
  const urgent = timeLeft <= 5 && !expired

  async function handleSelect(option: string) {
    if (submitting || expired) return
    if (locked) return // Already locked in
    setPendingSelection(option)
  }

  async function handleLockIn() {
    if (!pendingSelection || submitting || expired || locked) return
    setSubmitting(true)
    setOptimistic(pendingSelection)
    setLocked(true)
    await onAnswer(pendingSelection)
    setSubmitting(false)
    setPendingSelection(null)
  }

  const selected = locked ? optimistic : pendingSelection

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      className="flex flex-col gap-5"
    >
      {/* Header: question counter + timer */}
      <div className="flex items-center justify-between">
        <span className="font-condensed text-xs text-lt-muted2 uppercase tracking-wider">
          Pregunta {questionIndex} de {totalQuestions}
        </span>
        {!expired ? (
          <span className={cn(
            'font-bebas text-3xl leading-none tabular-nums transition-colors',
            urgent ? 'text-lt-red' : 'text-lt-green'
          )}>
            {String(Math.floor(timeLeft / 60)).padStart(1, '0')}:{String(timeLeft % 60).padStart(2, '0')}
          </span>
        ) : hasAnswered ? (
          <span className="flex items-center gap-1.5 text-lt-green font-condensed text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Respondida
          </span>
        ) : (
          <span className="font-condensed text-sm text-lt-red">Tiempo agotado</span>
        )}
      </div>

      {/* Timer bar */}
      {!expired && (
        <div className="h-1 w-full bg-lt-card2 rounded-full overflow-hidden -mt-3">
          <motion.div
            className={cn('h-full rounded-full', urgent ? 'bg-lt-red' : 'bg-lt-green')}
            animate={{ width: `${Math.max(0, timerPct)}%` }}
            transition={{ duration: 0.25, ease: 'linear' }}
          />
        </div>
      )}

      {/* Question text */}
      <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4">
        <p className="font-condensed text-xl font-700 text-lt-white leading-snug">
          {question.text}
        </p>
        <p className="font-condensed text-xs text-lt-muted2 mt-1">
          🏆 {scoringLabel} · {question.pointsValue} pts
        </p>
      </div>

      {/* Options / Score Input */}
      {isScoreType ? (
        /* ── SCORE: numeric inputs ── */
        <div className="space-y-4">
          <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-5">
            <p className="text-center text-lt-muted2 font-condensed text-xs uppercase tracking-wider mb-4">
              Escribe tu marcador
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="flex-1 text-center">
                <p className="font-condensed text-sm text-lt-white font-700 mb-2 truncate">{homeTeam ?? 'Local'}</p>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={homeScore}
                  onChange={(e) => { setHomeScore(e.target.value); setLocked(false) }}
                  disabled={expired || (locked && hasAnswered)}
                  className="w-20 h-16 mx-auto bg-lt-card2 border border-[rgba(255,255,255,0.15)] rounded-card text-center font-bebas text-4xl text-lt-white focus:border-lt-green focus:outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
              </div>
              <span className="font-bebas text-3xl text-lt-muted2 mt-6">—</span>
              <div className="flex-1 text-center">
                <p className="font-condensed text-sm text-lt-white font-700 mb-2 truncate">{awayTeam ?? 'Visitante'}</p>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={awayScore}
                  onChange={(e) => { setAwayScore(e.target.value); setLocked(false) }}
                  disabled={expired || (locked && hasAnswered)}
                  className="w-20 h-16 mx-auto bg-lt-card2 border border-[rgba(255,255,255,0.15)] rounded-card text-center font-bebas text-4xl text-lt-white focus:border-lt-green focus:outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Lock-in for score */}
          {!locked && homeScore !== '' && awayScore !== '' && !expired && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={async () => {
                if (submitting || expired || locked) return
                setSubmitting(true)
                const answer = `${homeScore}-${awayScore}`
                setOptimistic(answer)
                setLocked(true)
                await onAnswer(answer)
                setSubmitting(false)
              }}
              disabled={submitting}
              className={cn(
                'w-full py-4 rounded-btn font-condensed text-base font-700 transition-all active:scale-[0.97]',
                'bg-lt-green text-lt-black shadow-[0_0_24px_rgba(0,230,118,0.3)]',
                submitting && 'opacity-60'
              )}
            >
              {submitting ? 'Enviando...' : '🔒 Envío definitivo'}
            </motion.button>
          )}
        </div>
      ) : (
        /* ── Regular: multiple choice ── */
        <div className="grid gap-3">
          <AnimatePresence>
            {(question.options as string[]).map((option, i) => {
              const isSelected = selected === option
              const isDisabled = expired

              return (
                <motion.button
                  key={option}
                  onClick={() => handleSelect(option)}
                  disabled={isDisabled || submitting}
                  whileTap={isDisabled ? {} : { scale: 0.97 }}
                  className={cn(
                    'w-full text-left px-4 py-4 rounded-btn border font-condensed text-base font-600',
                    'flex items-center gap-3 transition-all duration-200',
                    isSelected
                      ? 'bg-lt-green/15 border-lt-green text-lt-white shadow-[0_0_16px_rgba(0,230,118,0.2)]'
                      : isDisabled
                      ? 'bg-lt-card border-[rgba(255,255,255,0.05)] text-lt-muted2 cursor-default'
                      : 'bg-lt-card border-[rgba(255,255,255,0.07)] text-lt-white hover:border-lt-green/40 hover:bg-lt-card2 active:scale-[0.98]'
                  )}
                >
                  <span className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bebas flex-shrink-0 transition-colors',
                    isSelected
                      ? 'bg-lt-green text-lt-black'
                      : isDisabled
                      ? 'bg-lt-card2 text-lt-muted2'
                      : 'bg-lt-card2 text-lt-muted2'
                  )}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="leading-snug">{option}</span>
                  {isSelected && (
                    <span className="ml-auto">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-lt-green">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                </motion.button>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Lock-in button (for non-score types) */}
      {!isScoreType && !locked && pendingSelection && !expired && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleLockIn}
          disabled={submitting}
          className={cn(
            'w-full py-4 rounded-btn font-condensed text-base font-700 transition-all active:scale-[0.97]',
            'bg-lt-green text-lt-black shadow-[0_0_24px_rgba(0,230,118,0.3)]',
            submitting && 'opacity-60'
          )}
        >
          {submitting ? 'Enviando...' : '🔒 Envío definitivo'}
        </motion.button>
      )}

      {locked && !expired && (
        <p className="text-center text-lt-green font-condensed text-sm flex items-center justify-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Respuesta enviada
        </p>
      )}
      {locked && expired && (
        <p className="text-center text-lt-muted2 font-condensed text-sm">
          Esperando que se resuelva la pregunta…
        </p>
      )}
      {!locked && !pendingSelection && !expired && !isScoreType && (
        <p className="text-center text-lt-muted2 font-condensed text-sm">
          Selecciona una opción y confirma tu respuesta
        </p>
      )}
    </motion.div>
  )
}
