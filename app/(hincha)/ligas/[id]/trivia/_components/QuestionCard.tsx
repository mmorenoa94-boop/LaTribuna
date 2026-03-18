'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TQuestion {
  id: string
  text: string
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
  onAnswer: (answer: string) => void
}

export function QuestionCard({ question, myAnswer, questionIndex, totalQuestions, onAnswer }: Props) {
  const already = myAnswer !== null
  const [submitting, setSubmitting] = useState(false)
  const [optimistic, setOptimistic] = useState<string | null>(myAnswer?.answer ?? null)
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (!question.closedAt) return 30
    return Math.max(0, Math.floor((new Date(question.closedAt).getTime() - Date.now()) / 1000))
  })

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

  // Countdown
  useEffect(() => {
    if (already) return
    const interval = setInterval(() => {
      if (!question.closedAt) return
      const left = Math.max(0, Math.floor((new Date(question.closedAt).getTime() - Date.now()) / 1000))
      setTimeLeft(left)
    }, 250)
    return () => clearInterval(interval)
  }, [question.closedAt, already])

  const timerPct = Math.min(100, (timeLeft / totalDuration.current) * 100)
  const urgent = timeLeft <= 5 && !already

  async function handleSelect(option: string) {
    if (already || submitting || timeLeft <= 0) return
    setSubmitting(true)
    setOptimistic(option)
    await onAnswer(option)
    setSubmitting(false)
  }

  const selected = optimistic

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
        {!already ? (
          <span className={cn(
            'font-bebas text-3xl leading-none tabular-nums transition-colors',
            urgent ? 'text-lt-red' : 'text-lt-green'
          )}>
            {String(Math.floor(timeLeft / 60)).padStart(1, '0')}:{String(timeLeft % 60).padStart(2, '0')}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-lt-green font-condensed text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Respondida
          </span>
        )}
      </div>

      {/* Timer bar */}
      {!already && (
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
          ⚡ +{question.pointsValue} pts si aciertas
        </p>
      </div>

      {/* Options */}
      <div className="grid gap-3">
        <AnimatePresence>
          {(question.options as string[]).map((option, i) => {
            const isSelected = selected === option
            const isDisabled = already || timeLeft <= 0

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

      {already && (
        <p className="text-center text-lt-muted2 font-condensed text-sm">
          Esperando que cierre la pregunta…
        </p>
      )}
    </motion.div>
  )
}
