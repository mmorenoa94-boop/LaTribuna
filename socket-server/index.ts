import { createServer } from 'http'
import { Server } from 'socket.io'
import { Redis } from '@upstash/redis'

// ── Config ──
const PORT = parseInt(process.env.SOCKET_PORT ?? '4000', 10)
const CORS_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!

// ── Redis for pub/sub polling ──
// Upstash doesn't support native pub/sub, so we use a list-based approach
const redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN })

// ── HTTP + Socket.io ──
const httpServer = createServer()
export const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})

// ── Connection handling ──
io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`)

  // Join league:match room
  socket.on('league:join', ({ leagueId, matchId }: { leagueId: string; matchId: string }) => {
    const room = `league:${leagueId}:match:${matchId}`
    socket.join(room)
    console.log(`[socket] ${socket.id} joined ${room}`)
  })

  // Join league room (general events)
  socket.on('league:subscribe', ({ leagueId }: { leagueId: string }) => {
    socket.join(`league:${leagueId}`)
    console.log(`[socket] ${socket.id} subscribed to league:${leagueId}`)
  })

  // Leave league rooms
  socket.on('league:leave', ({ leagueId }: { leagueId: string }) => {
    const rooms = [...socket.rooms].filter((r) => r.startsWith(`league:${leagueId}`))
    rooms.forEach((r) => socket.leave(r))
  })

  // Join match room (for live score updates)
  socket.on('match:subscribe', ({ matchId }: { matchId: string }) => {
    socket.join(`match:${matchId}`)
    console.log(`[socket] ${socket.id} subscribed to match:${matchId}`)
  })

  socket.on('match:unsubscribe', ({ matchId }: { matchId: string }) => {
    socket.leave(`match:${matchId}`)
  })

  // Answer acknowledgment (actual answer is via REST API)
  socket.on('answer:submit', ({ questionId }: { questionId: string; answer: string }) => {
    socket.emit('answer:ack', { questionId, received: true })
  })

  socket.on('disconnect', () => {
    console.log(`[socket] disconnected: ${socket.id}`)
  })
})

// ── Redis event poller ──
// Since Upstash REST API doesn't support native pub/sub,
// we poll a Redis list for events from the Next.js API routes.
const EVENT_QUEUE_KEY = 'lt:socket:events'

interface SocketEvent {
  room: string
  event: string
  data: any
  timestamp: number
}

async function pollEvents() {
  try {
    // Pop up to 10 events at a time
    const events: SocketEvent[] = []
    for (let i = 0; i < 10; i++) {
      const raw = await redis.lpop(EVENT_QUEUE_KEY)
      if (!raw) break
      try {
        const event = typeof raw === 'string' ? JSON.parse(raw) : raw as SocketEvent
        events.push(event)
      } catch {
        console.error('[socket] Invalid event in queue:', raw)
      }
    }

    for (const evt of events) {
      io.to(evt.room).emit(evt.event, evt.data)
      console.log(`[socket] emitted ${evt.event} to ${evt.room}`)
    }
  } catch (error) {
    console.error('[socket] Poll error:', error)
  }
}

// Poll every 500ms
setInterval(pollEvents, 500)

// ── Start server ──
httpServer.listen(PORT, () => {
  console.log(`[socket-server] listening on :${PORT}`)
  console.log(`[socket-server] CORS: ${CORS_ORIGIN}`)
  console.log(`[socket-server] Redis polling active on ${EVENT_QUEUE_KEY}`)
})
