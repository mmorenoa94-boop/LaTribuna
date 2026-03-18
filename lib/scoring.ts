import { prisma } from './prisma'
import { creditWallet } from './wallet'

// ── Level System ──
// XP thresholds per level (cumulative)
const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  300,    // Level 3
  600,    // Level 4
  1000,   // Level 5
  1500,   // Level 6
  2200,   // Level 7
  3000,   // Level 8
  4000,   // Level 9
  5200,   // Level 10
  6600,   // Level 11
  8200,   // Level 12
  10000,  // Level 13
  12000,  // Level 14
  14500,  // Level 15
  17500,  // Level 16
  21000,  // Level 17
  25000,  // Level 18
  30000,  // Level 19
  36000,  // Level 20
]

export function getLevelForXp(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

export function getXpForNextLevel(level: number): number {
  if (level >= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  return LEVEL_THRESHOLDS[level] // next level's threshold
}

export function getXpProgress(xp: number, level: number): { current: number; needed: number; pct: number } {
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? currentThreshold + 5000
  const current = xp - currentThreshold
  const needed = nextThreshold - currentThreshold
  return { current, needed, pct: Math.min(100, Math.round((current / needed) * 100)) }
}

// ── Award XP ──
/**
 * Awards XP to a user, recalculates level.
 * Returns the new level (useful for "level up!" notifications).
 */
export async function awardXp(userId: string, xpAmount: number): Promise<{ newXp: number; newLevel: number; leveledUp: boolean }> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { xp: true, level: true } })
  const newXp = user.xp + xpAmount
  const newLevel = getLevelForXp(newXp)
  const leveledUp = newLevel > user.level

  await prisma.user.update({
    where: { id: userId },
    data: { xp: newXp, level: newLevel },
  })

  return { newXp, newLevel, leveledUp }
}

// ── Streak System ──
/**
 * Updates user's daily streak. Call once per day when user plays.
 * Returns current streak and bonus XP if applicable.
 */
export async function updateStreak(userId: string): Promise<{ streak: number; bonusXp: number }> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { streak: true, streakLastAt: true },
  })

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // If already played today, return current streak
  if (user.streakLastAt) {
    const lastDate = new Date(user.streakLastAt)
    const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate())

    if (lastDay.getTime() === today.getTime()) {
      return { streak: user.streak, bonusXp: 0 }
    }

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (lastDay.getTime() === yesterday.getTime()) {
      // Consecutive day — increment streak
      const newStreak = user.streak + 1
      const bonusXp = calculateStreakBonus(newStreak)

      await prisma.user.update({
        where: { id: userId },
        data: { streak: newStreak, streakLastAt: now },
      })

      if (bonusXp > 0) {
        await awardXp(userId, bonusXp)
      }

      return { streak: newStreak, bonusXp }
    }
  }

  // First play or streak broken — reset to 1
  await prisma.user.update({
    where: { id: userId },
    data: { streak: 1, streakLastAt: now },
  })

  return { streak: 1, bonusXp: 0 }
}

function calculateStreakBonus(streak: number): number {
  if (streak >= 30) return 50
  if (streak >= 14) return 30
  if (streak >= 7) return 20
  if (streak >= 3) return 10
  return 0
}

// ── Points Scoring for Questions ──
/**
 * Score answers for a resolved question.
 * Awards points to wallet AND updates LeagueMember.totalPoints.
 * Applies presentialMultiplier if user has active check-in at league's business.
 */
export async function scoreQuestionAnswers(
  questionId: string,
  correctAnswer: string
): Promise<{ scored: number; correct: number }> {
  // Get question with league info
  const question = await prisma.leagueQuestion.findUniqueOrThrow({
    where: { id: questionId },
    include: {
      league: {
        select: { id: true, businessId: true, presentialMultiplier: true },
      },
      answers: {
        select: { id: true, userId: true, answer: true },
      },
    },
  })

  let correctCount = 0
  const now = new Date()
  const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000)

  for (const ans of question.answers) {
    const isCorrect = ans.answer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()

    // Calculate base points
    let points = isCorrect ? question.pointsValue : 0

    // Apply presential multiplier if business league and user has active checkin
    if (isCorrect && question.league.businessId && question.league.presentialMultiplier > 1) {
      const activeCheckin = await prisma.checkin.findFirst({
        where: {
          userId: ans.userId,
          businessId: question.league.businessId,
          checkedAt: { gte: eightHoursAgo },
          checkedOut: null,
        },
      })
      if (activeCheckin) {
        points = Math.round(points * question.league.presentialMultiplier)
      }
    }

    // Update answer record
    await prisma.answer.update({
      where: { id: ans.id },
      data: { isCorrect, pointsEarned: points },
    })

    if (isCorrect) {
      correctCount++

      // Credit wallet
      await creditWallet(
        ans.userId,
        points,
        'MATCH_WIN',
        `Respuesta correcta: ${question.text.substring(0, 50)}`,
        questionId
      )

      // Update LeagueMember.totalPoints
      await prisma.leagueMember.updateMany({
        where: { leagueId: question.league.id, userId: ans.userId, status: 'APPROVED' },
        data: { totalPoints: { increment: points } },
      })

      // Award XP (5 XP per correct answer regardless of points)
      await awardXp(ans.userId, 5)

      // Update streak
      await updateStreak(ans.userId)
    }
  }

  return { scored: question.answers.length, correct: correctCount }
}

// ── Score Predictions ──
/**
 * Resolve all predictions for a match when it finishes.
 * For WINNER type: compare with match result.
 * For SCORE type: exact match = bonus points.
 */
export async function scorePredictions(matchId: string): Promise<{ scored: number; correct: number }> {
  const match = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
    select: { id: true, homeTeam: true, awayTeam: true, homeScore: true, awayScore: true, status: true },
  })

  if (match.status !== 'FINISHED' || match.homeScore === null || match.awayScore === null) {
    throw new Error('Match not finished or scores not available')
  }

  // Determine winner
  let winner: string
  if (match.homeScore > match.awayScore) winner = match.homeTeam
  else if (match.awayScore > match.homeScore) winner = match.awayTeam
  else winner = 'DRAW'

  const scoreString = `${match.homeScore}-${match.awayScore}`

  // Get all unresolved predictions for questions linked to this match
  const predictions = await prisma.prediction.findMany({
    where: {
      question: { matchId: match.id },
      isCorrect: null, // only unresolved
    },
    include: {
      question: {
        select: { id: true, type: true, pointsValue: true, leagueId: true },
      },
    },
  })

  let correctCount = 0

  for (const pred of predictions) {
    let isCorrect = false
    let points = 0

    if (pred.question.type === 'WINNER') {
      isCorrect = pred.answer.trim().toLowerCase() === winner.toLowerCase()
      points = isCorrect ? pred.question.pointsValue : 0
    } else if (pred.question.type === 'SCORE') {
      isCorrect = pred.answer.trim() === scoreString
      // Exact score prediction gets 2x bonus
      points = isCorrect ? pred.question.pointsValue * 2 : 0
    }
    // Other prediction types can be added here

    await prisma.prediction.update({
      where: { id: pred.id },
      data: { isCorrect, pointsEarned: points },
    })

    if (isCorrect) {
      correctCount++

      await creditWallet(
        pred.userId,
        points,
        'PREDICTION_WIN',
        `Prediccion correcta: ${match.homeTeam} vs ${match.awayTeam}`,
        pred.id
      )

      // Update LeagueMember.totalPoints
      await prisma.leagueMember.updateMany({
        where: { leagueId: pred.question.leagueId, userId: pred.userId, status: 'APPROVED' },
        data: { totalPoints: { increment: points } },
      })

      // Award XP (10 XP for correct prediction — worth more than trivia)
      await awardXp(pred.userId, 10)
    }
  }

  return { scored: predictions.length, correct: correctCount }
}
