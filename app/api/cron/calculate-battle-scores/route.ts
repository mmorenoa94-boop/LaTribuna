import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Calculate battle scores for active battles.
 * Score = total check-ins + total league activity (answers) during battle period.
 * Called every 5 minutes.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Auto-activate battles whose startDate has arrived
    await prisma.battle.updateMany({
      where: {
        status: 'UPCOMING',
        startDate: { lte: new Date() },
      },
      data: { status: 'ACTIVE' },
    })

    // Get active battles
    const battles = await prisma.battle.findMany({
      where: { status: 'ACTIVE' },
      include: {
        participants: {
          include: {
            business: { select: { id: true } },
          },
        },
      },
    })

    if (battles.length === 0) {
      return NextResponse.json({ message: 'No active battles', updated: 0 })
    }

    let updatedCount = 0

    for (const battle of battles) {
      const battleStart = battle.startDate
      const battleEnd = battle.endDate

      for (const participant of battle.participants) {
        // Count check-ins during battle period
        const checkinCount = await prisma.checkin.count({
          where: {
            businessId: participant.businessId,
            checkedAt: { gte: battleStart, lte: battleEnd },
          },
        })

        // Count league activity: total answers from members of business leagues
        const businessLeagues = await prisma.league.findMany({
          where: { businessId: participant.businessId },
          select: { id: true },
        })

        let activityCount = 0
        if (businessLeagues.length > 0) {
          const leagueIds = businessLeagues.map(l => l.id)

          // Count correct answers in these leagues during battle period
          activityCount = await prisma.answer.count({
            where: {
              question: {
                leagueId: { in: leagueIds },
              },
              isCorrect: true,
              answeredAt: { gte: battleStart, lte: battleEnd },
            },
          })
        }

        // Score: 10 points per check-in + 5 points per correct answer
        const newScore = (checkinCount * 10) + (activityCount * 5)

        if (newScore !== participant.score) {
          await prisma.battleParticipant.update({
            where: { id: participant.id },
            data: { score: newScore },
          })
          updatedCount++
        }
      }

      // Update ranks
      const ranked = await prisma.battleParticipant.findMany({
        where: { battleId: battle.id },
        orderBy: { score: 'desc' },
      })

      for (let i = 0; i < ranked.length; i++) {
        await prisma.battleParticipant.update({
          where: { id: ranked[i].id },
          data: { rank: i + 1 },
        })
      }

      // Auto-finish battle if endDate has passed
      if (battleEnd < new Date()) {
        await prisma.battle.update({
          where: { id: battle.id },
          data: { status: 'FINISHED' },
        })
      }
    }

    return NextResponse.json({
      battles: battles.length,
      updated: updatedCount,
    })
  } catch (error) {
    console.error('[cron/calculate-battle-scores]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
