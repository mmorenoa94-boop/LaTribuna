'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface ActiveQuestion {
  id: string
  text: string
  leagueId: string
  matchId: string
  closedAt: string | null
  pointsValue: number
  league: { name: string }
}

/**
 * Global component that polls for OPEN questions in the user's leagues.
 * Shows a pulsing banner at the top of the screen linking to the trivia page.
 * Polls every 5 seconds — lightweight query, only runs when user is NOT already on trivia page.
 */
export function LiveQuestionAlert() {
  const [question, setQuestion] = useState<ActiveQuestion | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const pathname = usePathname()
  const router = useRouter()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Don't poll if already on a trivia page
  const isOnTrivia = pathname.includes('/trivia')

  useEffect(() => {
    if (isOnTrivia) {
      setQuestion(null)
      return
    }

    async function check() {
      try {
        const res = await fetch('/api/leagues/active-questions')
        if (!res.ok) return
        const data = await res.json()
        const qs: ActiveQuestion[] = data.questions ?? []

        // Find first non-dismissed, non-expired question
        const now = Date.now()
        const active = qs.find(
          (q) =>
            !dismissed.has(q.id) &&
            (!q.closedAt || new Date(q.closedAt).getTime() > now)
        )
        setQuestion(active ?? null)
      } catch {
        // Silently fail — not critical
      }
    }

    check()
    intervalRef.current = setInterval(check, 5000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isOnTrivia, dismissed])

  function handleGo() {
    if (!question) return
    router.push(`/ligas/${question.leagueId}/trivia?matchId=${question.matchId}`)
  }

  function handleDismiss(e: React.MouseEvent) {
    e.stopPropagation()
    if (question) {
      setDismissed((prev) => new Set(prev).add(question.id))
      setQuestion(null)
    }
  }

  // Countdown
  const [timeLeft, setTimeLeft] = useState<string | null>(null)
  useEffect(() => {
    if (!question?.closedAt) { setTimeLeft(null); return }
    function tick() {
      const left = Math.max(0, Math.floor((new Date(question!.closedAt!).getTime() - Date.now()) / 1000))
      if (left <= 0) { setTimeLeft(null); setQuestion(null); return }
      const m = Math.floor(left / 60)
      const s = left % 60
      setTimeLeft(m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`)
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [question])

  return (
    <AnimatePresence>
      {question && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          onClick={handleGo}
          className="fixed top-0 left-0 right-0 z-[70] cursor-pointer safe-top"
        >
          <div className="mx-3 mt-2 bg-gradient-to-r from-lt-red to-[#FF4444] rounded-card p-3 shadow-lg shadow-lt-red/20 border border-lt-red/40">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="w-3 h-3 rounded-full bg-white animate-pulse-dot flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-condensed text-xs text-white/70 uppercase tracking-wider leading-none mb-0.5">
                    {question.league.name}
                  </p>
                  <p className="font-condensed text-sm text-white font-700 leading-tight truncate">
                    {question.text}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {timeLeft && (
                  <span className="font-bebas text-lg text-white/90 tabular-nums">
                    {timeLeft}
                  </span>
                )}
                <span className="bg-white text-lt-red font-condensed font-700 text-xs px-3 py-1.5 rounded-btn uppercase">
                  Jugar
                </span>
                <button
                  onClick={handleDismiss}
                  className="text-white/50 hover:text-white p-1"
                  aria-label="Cerrar"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
