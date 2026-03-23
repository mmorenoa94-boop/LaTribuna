import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      transports: ['websocket'],
      autoConnect: false,
      auth: {
        token: typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null,
      },
    })
  }
  return socket
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect()
  }
  socket = null
}

// Tipos de eventos
export type SocketEvents = {
  // Cliente → Servidor
  'league:join':   { leagueId: string; matchId: string }
  'league:leave':  { leagueId: string }
  'answer:submit': { questionId: string; answer: string }

  // Servidor → Cliente
  'question:new':          { question: Record<string, unknown>; expiresAt: number }
  'question:closed':       { questionId: string }
  'question:resolved':     { questionId: string; correctAnswer: string; pointsMap: Record<string, number> }
  'leaderboard:update':    { rankings: Array<{ userId: string; name: string; points: number; position: number }> }
  'powerup:fired':         { powerup: Record<string, unknown>; expiresAt: number }
  'match:update':          { matchId: string; homeScore: number; awayScore: number; minute: number; status: string }
  'promo:banner':          { message: string; businessName: string; ttlSeconds: number }
  'venue:checkin':         { userId: string; userName: string }
  'venue:checkout':        { userId: string }
  'consumption:verified':  { userId: string }
}
