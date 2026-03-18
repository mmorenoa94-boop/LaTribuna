'use client'
import { useState, useEffect } from 'react'
import { useSocketEvent } from './useSocket'
import type { LeaderboardEntry } from '@/types'

export function useLeaderboard(leagueId: string, matchId: string) {
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([])

  useSocketEvent<{ rankings: LeaderboardEntry[] }>('leaderboard:update', ({ rankings }) => {
    setRankings(rankings)
  })

  useEffect(() => {
    fetch(`/api/leagues/${leagueId}/results/${matchId}`)
      .then((r) => r.json())
      .then((data) => { if (data.rankings) setRankings(data.rankings) })
      .catch(() => null)
  }, [leagueId, matchId])

  return rankings
}
