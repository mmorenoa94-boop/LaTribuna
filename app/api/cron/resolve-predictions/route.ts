import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Auto-resolve predictions when matches finish.
 * Finds FINISHED matches with unresolved predictions and scores them.
 * Called every 2 minutes.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find finished matches that have unresolved predictions
    const matchesWithPending = await prisma.match.findMany({
      where: {
        status: 'FINISHED',
        homeScore: { not: null },
        awayScore: { not: null },
        leagueMatches: {
          some: {
            league: {
              questions: {
                some: {
                  predictions: {
                    some: { isCorrect: null },
                  },
                },
              },
            },
          },
        },
      },
      select: {
        id: true,
        homeTeam: true,
        awayTeam: true,
        homeScore: true,
        awayScore: true,
      },
    })

    let totalScored = 0
    let totalCorrect = 0

    for (const match of matchesWithPending) {
      // Determine winner
      let winner: string
      if (match.homeScore! > match.awayScore!) winner = match.homeTeam
      else if (match.awayScore! > match.homeScore!) winner = match.awayTeam
      else winner = 'EMPATE'

      const scoreString = `${match.homeScore}-${match.awayScore}`

      // Get unresolved predictions for this match
      const predictions = await prisma.prediction.findMany({
        where: {
          question: { matchId: match.id },
          isCorrect: null,
        },
        include: {
          question: {
            select: { id: true, type: true, pointsValue: true, leagueId: true },
          },
        },
      })

      for (const pred of predictions) {
        let isCorrect = false
        let points = 0

        if (pred.question.type === 'WINNER') {
          isCorrect = pred.answer.trim().toUpperCase() === winner.toUpperCase()
          points = isCorrect ? pred.question.pointsValue : 0
        } else if (pred.question.type === 'SCORE') {
          isCorrect = pred.answer.trim() === scoreString
          points = isCorrect ? pred.question.pointsValue * 2 : 0
        }

        await prisma.prediction.update({
          where: { id: pred.id },
          data: { isCorrect, pointsEarned: points },
        })

        if (isCorrect) {
          totalCorrect++

          // Credit wallet
          const wallet = await prisma.wallet.upsert({
            where: { userId: pred.userId },
            create: { userId: pred.userId },
            update: {},
          })
          await prisma.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: 'PREDICTION_WIN',
              amount: points,
              description: `Predicción correcta: ${match.homeTeam} vs ${match.awayTeam}`,
              referenceId: pred.id,
            },
          })

          // Update LeagueMember totalPoints
          await prisma.leagueMember.updateMany({
            where: { leagueId: pred.question.leagueId, userId: pred.userId, status: 'APPROVED' },
            data: { totalPoints: { increment: points } },
          })
        }

        totalScored++
      }
    }

    return NextResponse.json({
      matches: matchesWithPending.length,
      scored: totalScored,
      correct: totalCorrect,
    })
  } catch (error) {
    console.error('[cron/resolve-predictions]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
