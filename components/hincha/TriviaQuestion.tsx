'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { formatTimer } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { LiveQuestion } from '@/types'

interface TriviaQuestionProps {
  question: LiveQuestion
  timeLeft: number
  selectedAnswer: string | null
  answered: boolean
  onAnswer: (answer: string) => void
}

export function TriviaQuestion({
  question,
  timeLeft,
  selectedAnswer,
  answered,
  onAnswer,
}: TriviaQuestionProps) {
  const timerPct = (timeLeft / ((question.expiresAt - Date.now()) / 1000 + timeLeft)) * 100
  const urgent = timeLeft <= 5

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex flex-col gap-4"
      >
        {/* Timer */}
        <div className="flex items-center justify-between">
          <span className="text-lt-muted2 font-condensed text-sm uppercase tracking-wider">
            Pregunta en vivo
          </span>
          <span className={cn(
            'font-bebas text-3xl tabular-nums leading-none',
            urgent ? 'text-lt-red' : 'text-lt-green'
          )}>
            {formatTimer(timeLeft)}
          </span>
        </div>

        {/* Timer bar */}
        <div className="h-1 w-full bg-lt-card2 rounded-full overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full', urgent ? 'bg-lt-red' : 'bg-lt-green')}
            initial={{ width: '100%' }}
            animate={{ width: `${Math.max(0, timerPct)}%` }}
            transition={{ duration: 0.25, ease: 'linear' }}
          />
        </div>

        {/* Question text */}
        <p className="text-lt-white font-condensed text-xl font-700 leading-snug">
          {question.text}
        </p>

        {/* Options */}
        <div className="grid gap-3">
          {question.options.map((option, i) => {
            const selected = selectedAnswer === option
            return (
              <motion.button
                key={option}
                onClick={() => !answered && onAnswer(option)}
                disabled={answered}
                whileTap={{ scale: answered ? 1 : 0.97 }}
                className={cn(
                  'w-full text-left px-4 py-3.5 rounded-btn border font-condensed text-base font-600 transition-all',
                  'flex items-center gap-3',
                  answered && selected
                    ? 'bg-lt-green/20 border-lt-green text-lt-green'
                    : answered
                    ? 'bg-lt-card border-lt-muted text-lt-muted2 opacity-60'
                    : 'bg-lt-card border-lt-muted text-lt-white hover:border-lt-green/50 hover:bg-lt-card2 active:scale-[0.98]'
                )}
              >
                <span className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bebas flex-shrink-0',
                  selected ? 'bg-lt-green text-lt-black' : 'bg-lt-card2 text-lt-muted2'
                )}>
                  {String.fromCharCode(65 + i)}
                </span>
                {option}
              </motion.button>
            )
          })}
        </div>

        <p className="text-center text-lt-muted2 text-xs font-condensed">
          +{question.pointsValue} pts si aciertas
        </p>
      </motion.div>
    </AnimatePresence>
  )
}
