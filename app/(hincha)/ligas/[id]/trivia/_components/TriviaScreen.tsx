'use client'
import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'
import { useTriviaSocket } from '@/hooks/useTriviaSocket'
import { MatchHeader } from './MatchHeader'
import { QuestionCard } from './QuestionCard'
import { ResultCard } from './ResultCard'
import { WaitingCard } from './WaitingCard'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MatchInfo {
  id: string
  homeTeam: string
  awayTeam: string
  homeLogo: string | null
  awayLogo: string | null
  status: string
  homeScore: number | null
  awayScore: number | null
  minutePlayed: number | null
  kickoffAt: string
}

interface TQuestion {
  id: string
  text: string
  options: unknown   // Json from Prisma — cast to string[]
  pointsValue: number
  orderIndex: number
  timing: string
  status: 'PENDING' | 'OPEN' | 'CLOSED' | 'RESOLVED'
  openAt: string | null
  closedAt: string | null
  resolvedAt: string | null
  correctAnswer: string | null
  totalPot: number | null
  winnersCount: number | null
}

interface TAnswer {
  questionId: string
  answer: string
  isCorrect: boolean | null
  pointsEarned: number
}

interface LeaderboardEntry {
  userId: string
  totalPoints: number
  user: { name: string; image: string | null; level: number }
}

interface TriviaData {
  league: { id: string; name: string; scoringMode: 'FIXED' | 'POOL' }
  match: MatchInfo
  questions: TQuestion[]
  answers: TAnswer[]
  leaderboard: LeaderboardEntry[]
  userId: string
  myPoints: number
  myRank: number
}

interface Props {
  leagueId: string
  leagueName: string
  matchId: string
  initialMatch: MatchInfo
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TriviaScreen({ leagueId, leagueName, matchId, initialMatch }: Props) {
  // questionId → shown result already (to not re-show)
  const [shownResults, setShownResults] = useState<Set<string>>(new Set())

  const { data, refetch } = useQuery<TriviaData>({
    queryKey: ['trivia', leagueId, matchId],
    queryFn: async () => {
      const res = await fetch(`/api/leagues/${leagueId}/trivia?matchId=${matchId}`)
      if (!res.ok) throw new Error('Error al cargar')
      return res.json()
    },
    refetchInterval: 3000,
    staleTime: 0,
  })

  const handleRefetch = useCallback(() => { refetch() }, [refetch])
  useTriviaSocket({ leagueId, matchId, onRefetch: handleRefetch })

  // Normalise data
  const match    = data?.match ?? initialMatch
  const rawQs    = data?.questions ?? []
  const questions = rawQs.map((q) => ({
    ...q,
    options: (Array.isArray(q.options) ? q.options : JSON.parse(q.options as string)) as string[],
  }))
  const answers      = data?.answers ?? []
  const leaderboard  = data?.leaderboard ?? []
  const myPoints     = data?.myPoints ?? 0
  const myRank       = data?.myRank ?? 0
  const userId       = data?.userId ?? ''

  // ── State machine ──────────────────────────────────────────────────────────

  const openQuestion = questions.find((q) => q.status === 'OPEN') ?? null

  // Find a recently resolved question we haven't shown yet
  const pendingResult = questions.find((q) => {
    if (q.status !== 'RESOLVED' || !q.resolvedAt) return false
    if (shownResults.has(q.id)) return false
    const age = Date.now() - new Date(q.resolvedAt).getTime()
    return age < 6000 // show result for up to 6s after resolution
  }) ?? null

  // Auto-dismiss result after 4s
  useEffect(() => {
    if (!pendingResult) return
    const t = setTimeout(() => {
      setShownResults((prev) => new Set([...Array.from(prev), pendingResult.id]))
    }, 4000)
    return () => clearTimeout(t)
  }, [pendingResult])

  const myAnswerForResult = pendingResult
    ? answers.find((a) => a.questionId === pendingResult.id) ?? null
    : null

  const isLive     = match.status === 'LIVE' || match.status === 'HALFTIME'
  const isFinished = match.status === 'FINISHED'

  const answeredCount = answers.length
  const totalQs       = questions.length
  const progressPct   = totalQs > 0 ? (answeredCount / totalQs) * 100 : 0

  // ── Submit answer ──────────────────────────────────────────────────────────

  async function handleAnswer(questionId: string, answer: string) {
    await fetch('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, answer }),
    })
    refetch()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-lt-black flex flex-col">
      {/* Match score header */}
      <MatchHeader
        match={match}
        leagueName={leagueName}
        leagueId={leagueId}
        isLive={isLive}
      />

      {/* Progress bar */}
      {totalQs > 0 && (
        <div className="px-4 pt-3 pb-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-condensed text-xs text-lt-muted2">
              {answeredCount}/{totalQs} respondidas
            </span>
            <span className="font-condensed text-xs font-700 text-lt-green">
              {myPoints > 0 ? `+${myPoints} pts` : '0 pts'}
              {myRank > 0 && <span className="text-lt-muted2 font-400"> · #{myRank}</span>}
            </span>
          </div>
          <div className="h-1 bg-lt-card2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-lt-green to-[#00ff88] rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Main play area */}
      <div className="flex-1 px-4 py-5 pb-28">
        <AnimatePresence mode="wait">
          {pendingResult ? (
            <ResultCard
              key={`result-${pendingResult.id}`}
              question={pendingResult}
              myAnswer={myAnswerForResult}
            />
          ) : openQuestion ? (
            <QuestionCard
              key={`q-${openQuestion.id}`}
              question={openQuestion}
              myAnswer={answers.find((a) => a.questionId === openQuestion.id) ?? null}
              questionIndex={questions.indexOf(openQuestion) + 1}
              totalQuestions={totalQs}
              scoringLabel={data?.league.scoringMode === 'POOL' ? 'Sistema pozo' : 'Puntaje fijo'}
              onAnswer={(ans) => handleAnswer(openQuestion.id, ans)}
            />
          ) : (
            <WaitingCard
              key="waiting"
              isFinished={isFinished}
              leaderboard={leaderboard}
              userId={userId}
              answeredCount={answeredCount}
              totalQs={totalQs}
              questions={questions}
              answers={answers}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
