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

  // ── Points Scoring for Questions (Pari-mutuel / Pot System) ──
  /**
   * Score a resolved question using pot-based distribution.
   * Handles BOTH Answer records (LIVE) and Prediction records (PRE_MATCH).
   * All participants stake pointsValue into a pot; winners split it equally.
   * Applies presentialMultiplier as a bonus on top of the pot share.
   */
  export async function scoreQuestionAnswers(
    questionId: string,
    correctAnswer: string
  ): Promise<{ scored: number; correct: number; totalPot: number; winnersCount: number }> {
    // Optimistic lock: verify question is not already RESOLVED before scoring
    const question = await prisma.leagueQuestion.findUniqueOrThrow({
      where: { id: questionId },
      include: {
        league: {
          select: { id: true, businessId: true, presentialMultiplier: true, scoringMode: true },
        },
        answers: {
          select: { id: true, userId: true, answer: true },
        },
        predictions: {
          select: { id: true, userId: true, answer: true },
        },
      },
    })

    // Guard: prevent double-scoring
    if (question.status === 'RESOLVED' && question.winnersCount !== null) {
      return { scored: 0, correct: 0, totalPot: question.totalPot ?? 0, winnersCount: question.winnersCount ?? 0 }
    }

    const isPool = question.league.scoringMode === 'POOL'

    const allParticipants = [
      ...question.answers.map((a) => ({ ...a, model: 'answer' as const })),
      ...question.predictions.map((p) => ({ ...p, model: 'prediction' as const })),
    ]

    const totalParticipants = allParticipants.length
    const totalPot = isPool ? totalParticipants * question.pointsValue : 0

    const correctOnes = allParticipants.filter(
      (p) => p.answer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
    )
    const incorrectOnes = allParticipants.filter(
      (p) => p.answer.trim().toLowerCase() !== correctAnswer.trim().toLowerCase()
    )
    const winnersCount = correctOnes.length
    const basePerWinner = isPool
      ? (winnersCount > 0 ? Math.floor(totalPot / winnersCount) : 0)
      : question.pointsValue

    const now = new Date()
    const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000)

    // Pre-fetch all checkins for winners in a single query (avoid N+1)
    let activeCheckins: { userId: string }[] = []
    if (question.league.businessId && question.league.presentialMultiplier > 1 && winnersCount > 0) {
      activeCheckins = await prisma.checkin.findMany({
        where: {
          userId: { in: correctOnes.map((p) => p.userId) },
          businessId: question.league.businessId,
          checkedAt: { gte: eightHoursAgo },
          checkedOut: null,
        },
        select: { userId: true },
      })
    }
    const checkedInUserIds = new Set(activeCheckins.map((c) => c.userId))

    // Run all scoring operations inside a transaction
    await prisma.$transaction(async (tx) => {
      // Mark incorrect answers/predictions in batch
      const incorrectAnswerIds = incorrectOnes.filter((p) => p.model === 'answer').map((p) => p.id)
      const incorrectPredictionIds = incorrectOnes.filter((p) => p.model === 'prediction').map((p) => p.id)

      if (incorrectAnswerIds.length > 0) {
        await tx.answer.updateMany({
          where: { id: { in: incorrectAnswerIds } },
          data: { isCorrect: false, pointsEarned: 0 },
        })
      }
      if (incorrectPredictionIds.length > 0) {
        await tx.prediction.updateMany({
          where: { id: { in: incorrectPredictionIds } },
          data: { isCorrect: false, pointsEarned: 0 },
        })
      }

      // Process winners
      for (const participant of correctOnes) {
        let points = basePerWinner

        if (checkedInUserIds.has(participant.userId)) {
          points = Math.round(points * question.league.presentialMultiplier)
        }

        // Mark correct
        if (participant.model === 'answer') {
          await tx.answer.update({
            where: { id: participant.id },
            data: { isCorrect: true, pointsEarned: points },
          })
        } else {
          await tx.prediction.update({
            where: { id: participant.id },
            data: { isCorrect: true, pointsEarned: points },
          })
        }

        // Credit wallet (inline to stay in transaction)
        const wallet = await tx.wallet.upsert({
          where: { userId: participant.userId },
          create: { userId: participant.userId },
          update: {},
        })
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: participant.model === 'answer' ? 'MATCH_WIN' : 'PREDICTION_WIN',
            amount: points,
            description: `Respuesta correcta: ${question.text.substring(0, 50)}`,
            referenceId: questionId,
          },
        })

        // Update LeagueMember.totalPoints
        await tx.leagueMember.updateMany({
          where: { leagueId: question.league.id, userId: participant.userId, status: 'APPROVED' },
          data: { totalPoints: { increment: points } },
        })
      }

      // Store pot metadata
      await tx.leagueQuestion.update({
        where: { id: questionId },
        data: { totalPot, winnersCount },
      })
    })

    // XP and streaks outside the transaction (non-critical, OK if they fail independently)
    for (const participant of correctOnes) {
      try {
        await awardXp(participant.userId, participant.model === 'answer' ? 5 : 10)
        await updateStreak(participant.userId)
      } catch (e) {
        console.error(`[scoring] XP/streak error for user ${participant.userId}:`, e)
      }
    }

    return { scored: totalParticipants, correct: winnersCount, totalPot, winnersCount }
  }

  // ── Score Predictions (Pari-mutuel / Pot System) ──
  /**
   * Resolve all predictions for a match when it finishes.
   * Uses pot-based distribution: all predictors per question stake pointsValue,
   * winners split the pot equally. SCORE type gets 2× pot multiplier.
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
    else winner = 'EMPATE'

    const scoreString = `${match.homeScore}-${match.awayScore}`

    // Get all unresolved predictions for questions linked to this match
    const predictions = await prisma.prediction.findMany({
      where: {
        question: { matchId: match.id },
        isCorrect: null,
      },
      include: {
        question: {
          select: { id: true, type: true, pointsValue: true, leagueId: true, league: { select: { scoringMode: true } } },
        },
      },
    })

    // Group predictions by questionId for pot calculation
    const byQuestion = new Map<string, typeof predictions>()
    for (const pred of predictions) {
      const group = byQuestion.get(pred.questionId) ?? []
      group.push(pred)
      byQuestion.set(pred.questionId, group)
    }

    let totalScored = 0
    let totalCorrect = 0

    for (const [questionId, questionPreds] of Array.from(byQuestion.entries())) {
      const question = questionPreds[0].question
      const isScoreType = question.type === 'SCORE'

      // Determine correctness for each prediction
      const evaluated = questionPreds.map((pred) => {
        let isCorrect = false
        if (question.type === 'WINNER') {
          isCorrect = pred.answer.trim().toUpperCase() === winner.toUpperCase()
        } else if (question.type === 'SCORE') {
          // Match against "X-Y" format, including answers like "Team 1-0 Team" or plain "1-0"
          const scoreMatch = pred.answer.trim().match(/(\d+)\s*-\s*(\d+)/)
          if (scoreMatch) {
            isCorrect = `${scoreMatch[1]}-${scoreMatch[2]}` === scoreString
          }
        }
        return { ...pred, isCorrect }
      })

      const winners = evaluated.filter((p) => p.isCorrect)
      const losers = evaluated.filter((p) => !p.isCorrect)

      const isPool = question.league.scoringMode === 'POOL'

      // POOL: pot split among winners. FIXED: each winner gets pointsValue (2× for SCORE type)
      const potMultiplier = isScoreType ? 2 : 1
      const totalPot = isPool ? questionPreds.length * question.pointsValue * potMultiplier : 0
      const winnersCount = winners.length
      const pointsPerWinner = isPool
        ? (winnersCount > 0 ? Math.floor(totalPot / winnersCount) : 0)
        : question.pointsValue * potMultiplier

      // Mark all losers
      if (losers.length > 0) {
        await prisma.prediction.updateMany({
          where: { id: { in: losers.map((p) => p.id) } },
          data: { isCorrect: false, pointsEarned: 0 },
        })
      }

      // Process winners
      for (const pred of winners) {
        await prisma.prediction.update({
          where: { id: pred.id },
          data: { isCorrect: true, pointsEarned: pointsPerWinner },
        })

        await creditWallet(
          pred.userId,
          pointsPerWinner,
          'PREDICTION_WIN',
          `Predicción correcta: ${match.homeTeam} vs ${match.awayTeam}`,
          pred.id
        )

        await prisma.leagueMember.updateMany({
          where: { leagueId: question.leagueId, userId: pred.userId, status: 'APPROVED' },
          data: { totalPoints: { increment: pointsPerWinner } },
        })

        // Award XP (10 XP for correct prediction)
        await awardXp(pred.userId, 10)
      }

      // Store pot metadata on the question
      await prisma.leagueQuestion.update({
        where: { id: questionId },
        data: { totalPot, winnersCount },
      })

      totalScored += questionPreds.length
      totalCorrect += winnersCount
    }

    return { scored: totalScored, correct: totalCorrect }
  }