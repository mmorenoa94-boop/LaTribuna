import { prisma } from './prisma'

// ── Achievement Definitions ──
// All achievements are defined in code. The DB only stores which ones a user has unlocked.

export type AchievementCategory = 'PRIMEROS_PASOS' | 'RACHA' | 'RESPUESTAS' | 'ACIERTOS' | 'NIVEL' | 'SOCIAL' | 'ESPECIAL'

export interface AchievementDef {
  id: string
  name: string
  description: string
  icon: string
  category: AchievementCategory
  /** XP bonus awarded when unlocked */
  xpReward: number
  /** Sort order within category */
  order: number
  /** Whether this is a hidden/secret achievement */
  secret?: boolean
}

// ── Category Labels ──
export const CATEGORY_LABELS: Record<AchievementCategory, { label: string; icon: string }> = {
  PRIMEROS_PASOS: { label: 'Primeros pasos', icon: '🎯' },
  RACHA:          { label: 'Racha',          icon: '🔥' },
  RESPUESTAS:     { label: 'Respuestas',     icon: '💬' },
  ACIERTOS:       { label: 'Aciertos',       icon: '✅' },
  NIVEL:          { label: 'Nivel',           icon: '⭐' },
  SOCIAL:         { label: 'Social',          icon: '👥' },
  ESPECIAL:       { label: 'Especial',        icon: '🏆' },
}

// ── All Achievements ──
export const ACHIEVEMENTS: AchievementDef[] = [
  // ─ PRIMEROS PASOS ─
  {
    id: 'first_answer',
    name: 'Primera jugada',
    description: 'Responde tu primera pregunta',
    icon: '🎯',
    category: 'PRIMEROS_PASOS',
    xpReward: 10,
    order: 1,
  },
  {
    id: 'first_correct',
    name: 'Buen ojo',
    description: 'Acierta tu primera pregunta',
    icon: '🎯',
    category: 'PRIMEROS_PASOS',
    xpReward: 15,
    order: 2,
  },
  {
    id: 'profile_complete',
    name: 'Hincha completo',
    description: 'Completa tu perfil al 100%',
    icon: '📝',
    category: 'PRIMEROS_PASOS',
    xpReward: 20,
    order: 3,
  },
  {
    id: 'first_league',
    name: 'Debutante',
    description: 'Únete a tu primera liga',
    icon: '🏟️',
    category: 'PRIMEROS_PASOS',
    xpReward: 10,
    order: 4,
  },

  // ─ RACHA ─
  {
    id: 'streak_3',
    name: 'Calentando motores',
    description: 'Mantén una racha de 3 días',
    icon: '🔥',
    category: 'RACHA',
    xpReward: 15,
    order: 1,
  },
  {
    id: 'streak_7',
    name: 'Semana de fuego',
    description: 'Mantén una racha de 7 días',
    icon: '🔥',
    category: 'RACHA',
    xpReward: 25,
    order: 2,
  },
  {
    id: 'streak_14',
    name: 'Imparable',
    description: 'Mantén una racha de 14 días',
    icon: '🔥',
    category: 'RACHA',
    xpReward: 40,
    order: 3,
  },
  {
    id: 'streak_30',
    name: 'Leyenda de la constancia',
    description: 'Mantén una racha de 30 días',
    icon: '🔥',
    category: 'RACHA',
    xpReward: 75,
    order: 4,
  },

  // ─ RESPUESTAS ─
  {
    id: 'answers_10',
    name: 'Participativo',
    description: 'Responde 10 preguntas',
    icon: '💬',
    category: 'RESPUESTAS',
    xpReward: 15,
    order: 1,
  },
  {
    id: 'answers_50',
    name: 'Activo',
    description: 'Responde 50 preguntas',
    icon: '💬',
    category: 'RESPUESTAS',
    xpReward: 30,
    order: 2,
  },
  {
    id: 'answers_100',
    name: 'Centenario',
    description: 'Responde 100 preguntas',
    icon: '💬',
    category: 'RESPUESTAS',
    xpReward: 50,
    order: 3,
  },
  {
    id: 'answers_500',
    name: 'Veterano',
    description: 'Responde 500 preguntas',
    icon: '💬',
    category: 'RESPUESTAS',
    xpReward: 100,
    order: 4,
  },

  // ─ ACIERTOS ─
  {
    id: 'correct_5',
    name: 'Puntería',
    description: 'Acierta 5 preguntas',
    icon: '✅',
    category: 'ACIERTOS',
    xpReward: 15,
    order: 1,
  },
  {
    id: 'correct_25',
    name: 'Buen criterio',
    description: 'Acierta 25 preguntas',
    icon: '✅',
    category: 'ACIERTOS',
    xpReward: 30,
    order: 2,
  },
  {
    id: 'correct_50',
    name: 'Medio centenar',
    description: 'Acierta 50 preguntas',
    icon: '✅',
    category: 'ACIERTOS',
    xpReward: 50,
    order: 3,
  },
  {
    id: 'correct_100',
    name: 'Sabio del fútbol',
    description: 'Acierta 100 preguntas',
    icon: '✅',
    category: 'ACIERTOS',
    xpReward: 100,
    order: 4,
  },

  // ─ NIVEL ─
  {
    id: 'level_5',
    name: 'Ascenso',
    description: 'Alcanza el nivel 5',
    icon: '⭐',
    category: 'NIVEL',
    xpReward: 25,
    order: 1,
  },
  {
    id: 'level_10',
    name: 'Estrella',
    description: 'Alcanza el nivel 10',
    icon: '⭐',
    category: 'NIVEL',
    xpReward: 50,
    order: 2,
  },
  {
    id: 'level_15',
    name: 'Crack',
    description: 'Alcanza el nivel 15',
    icon: '⭐',
    category: 'NIVEL',
    xpReward: 75,
    order: 3,
  },
  {
    id: 'level_20',
    name: 'Leyenda máxima',
    description: 'Alcanza el nivel 20',
    icon: '⭐',
    category: 'NIVEL',
    xpReward: 150,
    order: 4,
  },

  // ─ SOCIAL ─
  {
    id: 'leagues_3',
    name: 'Multicanchero',
    description: 'Únete a 3 ligas',
    icon: '👥',
    category: 'SOCIAL',
    xpReward: 20,
    order: 1,
  },
  {
    id: 'leagues_5',
    name: 'Ligas mayores',
    description: 'Únete a 5 ligas',
    icon: '👥',
    category: 'SOCIAL',
    xpReward: 40,
    order: 2,
  },
  {
    id: 'checkin_first',
    name: 'Presencial',
    description: 'Haz tu primer check-in en un negocio',
    icon: '📍',
    category: 'SOCIAL',
    xpReward: 15,
    order: 3,
  },

  // ─ ESPECIAL ─
  {
    id: 'perfect_score',
    name: 'Vidente',
    description: 'Acierta un marcador exacto',
    icon: '🔮',
    category: 'ESPECIAL',
    xpReward: 30,
    order: 1,
  },
  {
    id: 'first_live',
    name: 'En vivo',
    description: 'Responde tu primera pregunta en vivo',
    icon: '🔴',
    category: 'ESPECIAL',
    xpReward: 15,
    order: 2,
  },
  {
    id: 'win_streak_3',
    name: 'Hat-trick',
    description: 'Acierta 3 preguntas seguidas',
    icon: '🎩',
    category: 'ESPECIAL',
    xpReward: 25,
    order: 3,
    secret: true,
  },
  {
    id: 'top_3_league',
    name: 'Podio',
    description: 'Termina en el top 3 de una liga',
    icon: '🥇',
    category: 'ESPECIAL',
    xpReward: 50,
    order: 4,
  },
]

export const ACHIEVEMENTS_MAP = new Map(ACHIEVEMENTS.map((a) => [a.id, a]))

// ── Core Logic ──

/**
 * Check and award an achievement if the user doesn't already have it.
 * Returns the achievement definition if newly unlocked, null otherwise.
 */
export async function tryAwardAchievement(
  userId: string,
  achievementId: string
): Promise<AchievementDef | null> {
  const def = ACHIEVEMENTS_MAP.get(achievementId)
  if (!def) return null

  // Check if already unlocked
  const existing = await prisma.userAchievement.findUnique({
    where: { userId_achievementId: { userId, achievementId } },
  })
  if (existing) return null

  // Award it
  await prisma.userAchievement.create({
    data: { userId, achievementId },
  })

  // Award XP bonus
  if (def.xpReward > 0) {
    const { awardXp } = await import('./scoring')
    await awardXp(userId, def.xpReward)
  }

  // Create in-app notification
  await prisma.notification.create({
    data: {
      userId,
      type: 'ACHIEVEMENT',
      title: `${def.icon} Logro desbloqueado`,
      body: `${def.name}: ${def.description} (+${def.xpReward} XP)`,
      data: { achievementId, xpReward: def.xpReward },
    },
  })

  return def
}

/**
 * Check all achievements related to a specific trigger event.
 * Call this after answers, level-ups, streaks, etc.
 * Returns array of newly unlocked achievements.
 */
export async function checkAchievements(
  userId: string,
  trigger: 'answer' | 'correct' | 'streak' | 'level' | 'league' | 'checkin' | 'profile' | 'score_correct' | 'live_answer'
): Promise<AchievementDef[]> {
  const unlocked: AchievementDef[] = []

  async function tryAward(id: string) {
    const result = await tryAwardAchievement(userId, id)
    if (result) unlocked.push(result)
  }

  switch (trigger) {
    case 'answer': {
      // Count total answers + predictions
      const [answerCount, predictionCount] = await Promise.all([
        prisma.answer.count({ where: { userId } }),
        prisma.prediction.count({ where: { userId } }),
      ])
      const total = answerCount + predictionCount

      await tryAward('first_answer')
      if (total >= 10) await tryAward('answers_10')
      if (total >= 50) await tryAward('answers_50')
      if (total >= 100) await tryAward('answers_100')
      if (total >= 500) await tryAward('answers_500')
      break
    }

    case 'correct': {
      // Count correct answers + predictions
      const [correctAnswers, correctPredictions] = await Promise.all([
        prisma.answer.count({ where: { userId, isCorrect: true } }),
        prisma.prediction.count({ where: { userId, isCorrect: true } }),
      ])
      const totalCorrect = correctAnswers + correctPredictions

      await tryAward('first_correct')
      if (totalCorrect >= 5) await tryAward('correct_5')
      if (totalCorrect >= 25) await tryAward('correct_25')
      if (totalCorrect >= 50) await tryAward('correct_50')
      if (totalCorrect >= 100) await tryAward('correct_100')
      break
    }

    case 'streak': {
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { streak: true },
      })
      if (user.streak >= 3) await tryAward('streak_3')
      if (user.streak >= 7) await tryAward('streak_7')
      if (user.streak >= 14) await tryAward('streak_14')
      if (user.streak >= 30) await tryAward('streak_30')
      break
    }

    case 'level': {
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { level: true },
      })
      if (user.level >= 5) await tryAward('level_5')
      if (user.level >= 10) await tryAward('level_10')
      if (user.level >= 15) await tryAward('level_15')
      if (user.level >= 20) await tryAward('level_20')
      break
    }

    case 'league': {
      const memberCount = await prisma.leagueMember.count({
        where: { userId, status: 'APPROVED' },
      })
      await tryAward('first_league')
      if (memberCount >= 3) await tryAward('leagues_3')
      if (memberCount >= 5) await tryAward('leagues_5')
      break
    }

    case 'checkin': {
      await tryAward('checkin_first')
      break
    }

    case 'profile': {
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { profilePct: true },
      })
      if (user.profilePct >= 100) await tryAward('profile_complete')
      break
    }

    case 'score_correct': {
      await tryAward('perfect_score')
      break
    }

    case 'live_answer': {
      await tryAward('first_live')
      break
    }
  }

  return unlocked
}

/**
 * Get all achievements for a user, with unlock status.
 */
export async function getUserAchievements(userId: string) {
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true, unlockedAt: true },
  })

  const unlockedMap = new Map(userAchievements.map((ua) => [ua.achievementId, ua.unlockedAt]))

  return ACHIEVEMENTS.map((def) => ({
    ...def,
    unlocked: unlockedMap.has(def.id),
    unlockedAt: unlockedMap.get(def.id) ?? null,
  }))
}
