import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserAchievements, CATEGORY_LABELS } from '@/lib/achievements'

/**
 * GET /api/achievements
 * Returns all achievements for the authenticated user with unlock status.
 */
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const achievements = await getUserAchievements(session.user.id)

  const totalUnlocked = achievements.filter((a) => a.unlocked).length
  const totalAchievements = achievements.length

  return NextResponse.json({
    achievements,
    categories: CATEGORY_LABELS,
    stats: {
      unlocked: totalUnlocked,
      total: totalAchievements,
      pct: Math.round((totalUnlocked / totalAchievements) * 100),
    },
  })
}
