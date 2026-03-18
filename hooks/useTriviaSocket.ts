'use client'
import { useEffect, useRef } from 'react'

interface Options {
  leagueId: string
  matchId: string
  onRefetch: () => void
}

export function useTriviaSocket({ leagueId, matchId, onRefetch }: Options) {
  const onRefetchRef = useRef(onRefetch)
  onRefetchRef.current = onRefetch

  useEffect(() => {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000'

    let socket: import('socket.io-client').Socket | null = null

    async function connect() {
      try {
        const { io } = await import('socket.io-client')
        socket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 5,
          timeout: 8000,
        })

        socket.on('connect', () => {
          socket!.emit('league:join', { leagueId, matchId })
          socket!.emit('match:subscribe', { matchId })
        })

        const handleRefetch = () => onRefetchRef.current()

        // Question lifecycle events
        socket.on('question:open', handleRefetch)
        socket.on('question:close', handleRefetch)
        socket.on('question:resolve', handleRefetch)

        // Match score updates
        socket.on('match:update', handleRefetch)

        // Leaderboard changes
        socket.on('leaderboard:update', handleRefetch)

        // Power-up events
        socket.on('powerup:fire', handleRefetch)
      } catch {
        // Socket no disponible → polling como fallback
      }
    }

    connect()

    return () => {
      if (socket) {
        socket.emit('league:leave', { leagueId })
        socket.emit('match:unsubscribe', { matchId })
        socket.disconnect()
      }
    }
  }, [leagueId, matchId])
}
