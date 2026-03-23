import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Helpers de caché

export async function cacheGet<T>(key: string): Promise<T | null> {
  return redis.get<T>(key)
}

export async function cacheSet(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  if (ttlSeconds) {
    await redis.setex(key, ttlSeconds, value)
  } else {
    await redis.set(key, value)
  }
}

export async function cacheDel(key: string): Promise<void> {
  await redis.del(key)
}

// Keys de caché por entidad
export const CACHE_KEYS = {
  liveMatches: () => 'matches:live',
  leaderboard: (leagueId: string, matchId: string) => `leaderboard:${leagueId}:${matchId}`,
  userBalance: (userId: string) => `wallet:balance:${userId}`,
  venueCheckins: (businessId: string) => `venue:checkins:${businessId}`,
  publicLeagues: (page: number) => `leagues:public:${page}`,
}
