'use client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TQuestion {
  id: string
  text: string
  options: string[]
  correctAnswer: string | null
  pointsValue: number
}

interface TAnswer {
  questionId: string
  answer: string
  isCorrect: boolean | null
  pointsEarned: number
}

interface Props {
  question: TQuestion
  myAnswer: TAnswer | null
}

export function ResultCard({ question, myAnswer }: Props) {
  const correct = myAnswer?.isCorrect ?? false
  const noAnswer = !myAnswer

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      className="flex flex-col items-center gap-6 py-8"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        className={cn(
          'w-24 h-24 rounded-full flex items-center justify-center text-5xl',
          correct
            ? 'bg-lt-green/20 shadow-[0_0_40px_rgba(0,230,118,0.4)]'
            : noAnswer
            ? 'bg-lt-card2'
            : 'bg-lt-red/20'
        )}
      >
        {correct ? '✅' : noAnswer ? '⏱️' : '❌'}
      </motion.div>

      {/* Status text */}
      <div className="text-center">
        {correct ? (
          <>
            <p className="font-bebas text-4xl text-lt-green tracking-wide">¡Correcto!</p>
            <p className="font-condensed text-xl text-lt-green font-700 mt-1">
              +{myAnswer?.pointsEarned ?? question.pointsValue} puntos
            </p>
          </>
        ) : noAnswer ? (
          <>
            <p className="font-bebas text-3xl text-lt-muted2 tracking-wide">Tiempo agotado</p>
            <p className="font-condensed text-sm text-lt-muted2 mt-1">No respondiste a tiempo</p>
          </>
        ) : (
          <>
            <p className="font-bebas text-4xl text-lt-red tracking-wide">Incorrecto</p>
            {myAnswer && (
              <p className="font-condensed text-sm text-lt-muted2 mt-1">
                Tu respuesta: <span className="text-lt-white">{myAnswer.answer}</span>
              </p>
            )}
          </>
        )}
      </div>

      {/* Correct answer (always show) */}
      {question.correctAnswer && (
        <div className={cn(
          'w-full rounded-card border p-4 text-center',
          correct
            ? 'bg-lt-green/10 border-lt-green/30'
            : 'bg-lt-card border-[rgba(255,255,255,0.07)]'
        )}>
          <p className="font-condensed text-xs text-lt-muted2 uppercase tracking-wider mb-1">
            Respuesta correcta
          </p>
          <p className="font-condensed text-base font-700 text-lt-white">
            {question.correctAnswer}
          </p>
        </div>
      )}

      <p className="text-lt-muted2 font-condensed text-xs animate-pulse">
        Siguiente pregunta en breve…
      </p>
    </motion.div>
  )
}
