'use client'
import { useEffect } from 'react'
import { useTriviaStore } from '@/stores/triviaStore'
import { useSocketEvent } from './useSocket'
import type { LiveQuestion } from '@/types'

export function useTrivia(leagueId: string, matchId: string) {
  const { currentQuestion, selectedAnswer, answered, timeLeft, lastResult,
    setQuestion, selectAnswer, setTimeLeft, setLastResult } = useTriviaStore()

  // question:new
  useSocketEvent<{ question: LiveQuestion; expiresAt: number }>('question:new', ({ question, expiresAt }) => {
    setQuestion({ ...question, expiresAt })
  })

  // question:closed
  useSocketEvent<{ questionId: string }>('question:closed', () => {
    setQuestion(null)
  })

  // question:resolved
  useSocketEvent<{ questionId: string; correctAnswer: string; pointsMap: Record<string, number> }>(
    'question:resolved',
    ({ correctAnswer, pointsMap }) => {
      if (selectedAnswer) {
        const correct = selectedAnswer === correctAnswer
        // userId will be resolved in component
        setLastResult({ correct, points: Object.values(pointsMap)[0] ?? 0 })
      }
    }
  )

  // Countdown timer
  useEffect(() => {
    if (!currentQuestion) return
    const now = Date.now()
    const remaining = Math.max(0, Math.floor((currentQuestion.expiresAt - now) / 1000))
    setTimeLeft(remaining)

    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, Math.floor((currentQuestion.expiresAt - Date.now()) / 1000)))
    }, 250)

    return () => clearInterval(interval)
  }, [currentQuestion, setTimeLeft])

  async function submitAnswer(answer: string) {
    if (answered || !currentQuestion) return
    selectAnswer(answer)
    await fetch('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: currentQuestion.id, answer }),
    })
  }

  return { currentQuestion, selectedAnswer, answered, timeLeft, lastResult, submitAnswer }
}
