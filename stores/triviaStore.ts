import { create } from 'zustand'
import type { LiveQuestion, LivePowerUp } from '@/types'

interface TriviaState {
  currentQuestion: LiveQuestion | null
  activePowerUp: LivePowerUp | null
  selectedAnswer: string | null
  answered: boolean
  timeLeft: number
  lastResult: { correct: boolean; points: number } | null

  setQuestion: (q: LiveQuestion | null) => void
  setPowerUp: (p: LivePowerUp | null) => void
  selectAnswer: (answer: string) => void
  setTimeLeft: (t: number) => void
  setLastResult: (r: { correct: boolean; points: number } | null) => void
  reset: () => void
}

export const useTriviaStore = create<TriviaState>((set) => ({
  currentQuestion: null,
  activePowerUp: null,
  selectedAnswer: null,
  answered: false,
  timeLeft: 0,
  lastResult: null,

  setQuestion: (q) => set({ currentQuestion: q, selectedAnswer: null, answered: false }),
  setPowerUp: (p) => set({ activePowerUp: p }),
  selectAnswer: (answer) => set({ selectedAnswer: answer, answered: true }),
  setTimeLeft: (t) => set({ timeLeft: t }),
  setLastResult: (r) => set({ lastResult: r }),
  reset: () => set({ currentQuestion: null, selectedAnswer: null, answered: false, timeLeft: 0, lastResult: null }),
}))
