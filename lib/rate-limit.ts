import { redis } from './redis'

interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

/**
 * Simple sliding-window rate limiter using Redis.
 * @param key - unique key (e.g. `checkin:${userId}`)
 * @param limit - max requests
 * @param windowSecs - time window in seconds
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSecs: number
): Promise<RateLimitResult> {
  const now = Date.now()
  const windowMs = windowSecs * 1000
  const windowStart = now - windowMs

  // Use Redis pipeline
  const pipe = redis.pipeline()
  pipe.zremrangebyscore(key, 0, windowStart)
  pipe.zadd(key, { score: now, member: `${now}:${Math.random()}` })
  pipe.zcard(key)
  pipe.expire(key, windowSecs)

  const results = await pipe.exec()
  const count = results[2] as number

  return {
    success: count <= limit,
    remaining: Math.max(0, limit - count),
    reset: Math.ceil(windowSecs - (now - windowStart) / 1000),
  }
}
