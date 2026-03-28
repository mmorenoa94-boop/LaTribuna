import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/leagues/:id/leaderboard?matchId=xxx
 *
 * Without matchId: returns overall ranking with per-match point history
 * With matchId: returns ranking for that specific match only
 *
 * Each entry includes: userId, name, image, level, totalPoints,
 * pointsByMatch (array), and positionChange (vs previous match)
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const isMember = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: params.id, userId: session.user.id } },
  })
  if (!isMember) return NextResponse.json({ error: 'No eres miembro' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const filterMatchId = searchParams.get('matchId')

  // Get all league matches sorted by kickoff
  const leagueMatches = await prisma.leagueMatch.findMany({
    where: { leagueId: params.id },
    include: { match: { select: { id: true, homeTeam: true, awayTeam: true, kickoffAt: true, status: true, homeScore: true, awayScore: true } } },
    orderBy: { match: { kickoffAt: 'asc' } },
  })

  // Get all league members
  const members = await prisma.leagueMember.findMany({
    where: { leagueId: params.id },
    include: {
      user: { select: { id: true, name: true, image: true, level: true } },
    },
  })

  const matchIds = leagueMatches.map((lm) => lm.matchId)

  // Get all questions for these matches in this league
  const questions = await prisma.leagueQuestion.findMany({
    where: { leagueId: params.id, matchId: { in: matchIds } },
    select: { id: true, matchId: true, text: true, pointsValue: true, status: true, correctAnswer: true },
  })
  const questionIds = questions.map((q) => q.id)
  const questionMap = new Map(questions.map((q) => [q.id, q]))

  // Get all answers and predictions for these questions
  const [answers, predictions] = await Promise.all([
    prisma.answer.findMany({
      where: { questionId: { in: questionIds } },
      select: { userId: true, questionId: true, pointsEarned: true, isCorrect: true },
    }),
    prisma.prediction.findMany({
      where: { questionId: { in: questionIds } },
      select: { userId: true, questionId: true, pointsEarned: true, isCorrect: true },
    }),
  ])

  // Build per-user per-match point totals
  // Map<userId, Map<matchId, { points, correct, total }>>
  const userMatchPoints = new Map<string, Map<string, { points: number; correct: number; total: number }>>()

  function addPoints(userId: string, questionId: string, pointsEarned: number, isCorrect: boolean | null) {
    const q = questionMap.get(questionId)
    if (!q || !q.matchId) return

    if (!userMatchPoints.has(userId)) userMatchPoints.set(userId, new Map())
    const userMap = userMatchPoints.get(userId)!
    if (!userMap.has(q.matchId)) userMap.set(q.matchId, { points: 0, correct: 0, total: 0 })
    const entry = userMap.get(q.matchId)!
    entry.points += pointsEarned
    entry.total += 1
    if (isCorrect === true) entry.correct += 1
  }

  for (const a of answers) addPoints(a.userId, a.questionId, a.pointsEarned, a.isCorrect)
  for (const p of predictions) addPoints(p.userId, p.questionId, p.pointsEarned, p.isCorrect)

  // Build match list for the dropdown
  const matchList = leagueMatches.map((lm) => ({
    id: lm.match.id,
    homeTeam: lm.match.homeTeam,
    awayTeam: lm.match.awayTeam,
    kickoffAt: lm.match.kickoffAt.toISOString(),
    status: lm.match.status,
    homeScore: lm.match.homeScore,
    awayScore: lm.match.awayScore,
  }))

  const matchOrder = leagueMatches.map((lm) => lm.matchId)

  // Find the most recent match that has scored points (pointsEarned > 0)
  // This is used to calculate position change arrows
  let lastScoredMatchId: string | null = null
  for (let i = matchOrder.length - 1; i >= 0; i--) {
    const mid = matchOrder[i]
    const userIds = Array.from(userMatchPoints.keys())
    const hasPoints = userIds.some((uid) => {
      const d = userMatchPoints.get(uid)?.get(mid)
      return d && d.points > 0
    })
    if (hasPoints) { lastScoredMatchId = mid; break }
  }

  // Build response entries
  const entries = members.map((m) => {
    const matchBreakdown = matchOrder.map((matchId) => {
      const pts = userMatchPoints.get(m.userId)?.get(matchId)
      return {
        matchId,
        points: pts?.points ?? 0,
        correct: pts?.correct ?? 0,
        total: pts?.total ?? 0,
      }
    })

    // If filtering by matchId, use match-specific points for sorting
    const matchSpecificPoints = filterMatchId
      ? (userMatchPoints.get(m.userId)?.get(filterMatchId)?.points ?? 0)
      : m.totalPoints

    return {
      userId: m.userId,
      user: m.user,
      totalPoints: m.totalPoints,
      matchPoints: matchSpecificPoints,
      positionChange: 0, // computed after sorting
      matchBreakdown,
    }
  })

  // Sort by relevant points
  entries.sort((a, b) => b.matchPoints - a.matchPoints)

  // Calculate position changes by comparing current rank vs rank without last scored match
  if (lastScoredMatchId) {
    // "Previous" total = current totalPoints minus points from the last scored match
    const prevTotals = entries.map((e) => ({
      userId: e.userId,
      prevTotal: e.totalPoints - (userMatchPoints.get(e.userId)?.get(lastScoredMatchId!)?.points ?? 0),
    }))
    // Sort previous totals to get previous ranking
    prevTotals.sort((a, b) => b.prevTotal - a.prevTotal)
    const prevRankMap = new Map<string, number>()
    prevTotals.forEach((p, i) => prevRankMap.set(p.userId, i + 1))

    // Apply position changes (current rank = index + 1)
    entries.forEach((e, i) => {
      const currentRank = i + 1
      const prevRank = prevRankMap.get(e.userId) ?? currentRank
      e.positionChange = prevRank - currentRank // positive = moved up
    })
  }

  return NextResponse.json({
    matches: matchList,
    leaderboard: entries,
  })
}
