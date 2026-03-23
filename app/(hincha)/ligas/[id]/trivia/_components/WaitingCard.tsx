'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { formatPoints } from '@/lib/utils'

interface LeaderboardEntry {
  userId: string
  totalPoints: number
  user: { name: string; image: string | null; level: number }
}

interface TQuestion {
  id: string
  status: string
  text: string
}

interface TAnswer {
  questionId: string
  isCorrect: boolean | null
  pointsEarned: number
}

interface Props {
  isFinished: boolean
  leaderboard: LeaderboardEntry[]
  userId: string
  answeredCount: number
  totalQs: number
  questions: TQuestion[]
  answers: TAnswer[]
}

export function WaitingCard({
  isFinished,
  leaderboard,
  userId,
  answeredCount,
  totalQs,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  questions,
  answers,
}: Props) {
  // Stats
  const correctCount = answers.filter((a) => a.isCorrect === true).length
  const myPoints = answers.reduce((sum, a) => sum + a.pointsEarned, 0)

  if (isFinished) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="flex flex-col gap-5"
      >
        {/* Final summary */}
        <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-6 text-center">
          <p className="text-4xl mb-3">🏆</p>
          <p className="font-bebas text-3xl text-lt-white tracking-wide">¡Partido finalizado!</p>
          <div className="flex justify-center gap-6 mt-4">
            <div>
              <p className="font-bebas text-3xl text-lt-green">{correctCount}/{totalQs}</p>
              <p className="font-condensed text-xs text-lt-muted2">Correctas</p>
            </div>
            <div className="w-px bg-lt-card2" />
            <div>
              <p className="font-bebas text-3xl text-lt-green">+{myPoints}</p>
              <p className="font-condensed text-xs text-lt-muted2">Puntos</p>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <LeaderboardSection leaderboard={leaderboard} userId={userId} />
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-5"
    >
      {/* Waiting animation */}
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="relative">
          {/* Pulsing rings */}
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border border-lt-green/30"
              animate={{ scale: [1, 1.5 + i * 0.3], opacity: [0.6, 0] }}
              transition={{
                duration: 2,
                delay: i * 0.5,
                repeat: Infinity,
                ease: 'easeOut',
              }}
              style={{ margin: `-${i * 12}px` }}
            />
          ))}
          <div className="w-16 h-16 rounded-full bg-lt-card2 border border-[rgba(255,255,255,0.07)] flex items-center justify-center text-3xl relative z-10">
            ⚽
          </div>
        </div>

        <div className="text-center mt-2">
          <p className="font-condensed text-lg font-700 text-lt-white">Esperando pregunta…</p>
          <p className="font-condensed text-sm text-lt-muted2 mt-1">
            La siguiente aparecerá en cualquier momento
          </p>
        </div>
      </div>

      {/* Resolved questions summary if any */}
      {answers.length > 0 && (
        <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4">
          <p className="font-condensed text-xs text-lt-muted2 uppercase tracking-wider mb-3">Tu progreso</p>
          <div className="flex gap-4">
            <div className="flex-1 text-center">
              <p className="font-bebas text-2xl text-lt-green">{answeredCount}</p>
              <p className="font-condensed text-xs text-lt-muted2">Respondidas</p>
            </div>
            <div className="w-px bg-lt-card2" />
            <div className="flex-1 text-center">
              <p className="font-bebas text-2xl text-lt-green">{correctCount}</p>
              <p className="font-condensed text-xs text-lt-muted2">Correctas</p>
            </div>
            <div className="w-px bg-lt-card2" />
            <div className="flex-1 text-center">
              <p className="font-bebas text-2xl text-lt-green">+{myPoints}</p>
              <p className="font-condensed text-xs text-lt-muted2">Puntos</p>
            </div>
          </div>
        </div>
      )}

      {/* Mini leaderboard */}
      {leaderboard.length > 0 && (
        <LeaderboardSection leaderboard={leaderboard} userId={userId} />
      )}
    </motion.div>
  )
}

function LeaderboardSection({
  leaderboard,
  userId,
}: {
  leaderboard: LeaderboardEntry[]
  userId: string
}) {
  const MEDALS = ['🥇', '🥈', '🥉']

  return (
    <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.05)]">
        <p className="font-condensed text-xs text-lt-muted2 uppercase tracking-wider">Clasificación</p>
      </div>
      <div className="divide-y divide-[rgba(255,255,255,0.04)]">
        {leaderboard.map((entry, idx) => {
          const isMe = entry.userId === userId
          return (
            <div
              key={entry.userId}
              className={cn(
                'flex items-center gap-3 px-4 py-3 transition-colors',
                isMe && 'bg-lt-green/5'
              )}
            >
              {/* Rank */}
              <span className="font-bebas text-lg w-6 text-center leading-none">
                {idx < 3 ? MEDALS[idx] : <span className="text-lt-muted2 text-base">{idx + 1}</span>}
              </span>

              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-lt-card2 flex-shrink-0 overflow-hidden">
                {entry.user.image ? (
                  <Image src={entry.user.image} alt={entry.user.name} width={32} height={32} className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-base">
                    {entry.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name */}
              <span className={cn(
                'font-condensed text-sm flex-1 truncate',
                isMe ? 'text-lt-green font-700' : 'text-lt-white'
              )}>
                {isMe ? 'Tú' : entry.user.name}
              </span>

              {/* Points */}
              <span className={cn(
                'font-condensed text-sm font-700 tabular-nums',
                isMe ? 'text-lt-green' : 'text-lt-muted2'
              )}>
                {formatPoints(entry.totalPoints)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
