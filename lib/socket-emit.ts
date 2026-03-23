import { redis } from './redis'

const EVENT_QUEUE_KEY = 'lt:socket:events'

interface SocketEvent {
  room: string
  event: string
  data: unknown
  timestamp: number
}

/**
 * Emit a socket event from a Next.js API route.
 * Pushes to Redis queue, which the socket server polls and broadcasts.
 */
export async function emitSocketEvent(
  room: string,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  const socketEvent: SocketEvent = {
    room,
    event,
    data,
    timestamp: Date.now(),
  }

  await redis.rpush(EVENT_QUEUE_KEY, JSON.stringify(socketEvent))
}

// ── Convenience helpers ──

/** Emit when a question is opened */
export async function emitQuestionOpen(leagueId: string, matchId: string, data: {
  questionId: string
  text: string
  type: string
  options: unknown
  pointsValue: number
  closedAt: string | null
}) {
  await emitSocketEvent(
    `league:${leagueId}:match:${matchId}`,
    'question:open',
    data
  )
}

/** Emit when a question is closed */
export async function emitQuestionClose(leagueId: string, matchId: string, data: {
  questionId: string
}) {
  await emitSocketEvent(
    `league:${leagueId}:match:${matchId}`,
    'question:close',
    data
  )
}

/** Emit when a question is resolved with correct answer */
export async function emitQuestionResolve(leagueId: string, matchId: string, data: {
  questionId: string
  correctAnswer: string
  scored: number
  correct: number
}) {
  await emitSocketEvent(
    `league:${leagueId}:match:${matchId}`,
    'question:resolve',
    data
  )
}

/** Emit match score update */
export async function emitMatchUpdate(matchId: string, data: {
  homeScore: number | null
  awayScore: number | null
  status: string
  minutePlayed: number | null
}) {
  await emitSocketEvent(
    `match:${matchId}`,
    'match:update',
    { matchId, ...data }
  )
}

/** Emit leaderboard update after scoring */
export async function emitLeaderboardUpdate(leagueId: string, matchId: string, data: {
  rankings: Array<{ userId: string; name: string; totalPoints: number; rank: number }>
}) {
  await emitSocketEvent(
    `league:${leagueId}:match:${matchId}`,
    'leaderboard:update',
    data
  )
}

/** Emit power-up fired */
export async function emitPowerUpFire(leagueId: string, matchId: string, data: {
  powerupId: string
  question: string
  options: unknown
  rewardText: string
  durationSecs: number
  expiresAt: string
}) {
  await emitSocketEvent(
    `league:${leagueId}:match:${matchId}`,
    'powerup:fire',
    data
  )
}
