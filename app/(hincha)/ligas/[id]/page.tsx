import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LigaTabs } from './_components/LigaTabs'
import type { SLeague, SPrediction } from './_components/types'

const TYPE_LABELS: Record<string, string> = {
  PUBLIC: 'Pública', PRIVATE: 'Privada', INVITE_ONLY: 'Con invitación', BUSINESS: 'Local',
}
const TYPE_COLORS: Record<string, string> = {
  PUBLIC: 'text-lt-blue border-lt-blue/40 bg-lt-blue/10',
  PRIVATE: 'text-lt-muted2 border-lt-muted bg-lt-card2',
  INVITE_ONLY: 'text-lt-green border-lt-green/40 bg-lt-green/10',
  BUSINESS: 'text-lt-amber border-lt-amber/40 bg-lt-amber/10',
}

export default async function LigaDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const [league, userMember, predictions] = await Promise.all([
    prisma.league.findUnique({
      where: { id: params.id },
      include: {
        business: {
          select: { id: true, name: true, logoUrl: true, city: true },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, image: true, level: true } },
          },
          orderBy: { totalPoints: 'desc' },
        },
        matches: {
          include: { match: true },
          orderBy: { match: { kickoffAt: 'asc' } },
        },
        questions: {
          where: { timing: 'PRE_MATCH', status: { not: 'PENDING' } },
          orderBy: [{ matchId: 'asc' }, { orderIndex: 'asc' }],
        },
        prizes: { orderBy: { position: 'asc' } },
        _count: { select: { members: true } },
      },
    }),
    prisma.leagueMember.findUnique({
      where: {
        leagueId_userId: { leagueId: params.id, userId: session.user.id },
      },
    }),
    prisma.prediction.findMany({
      where: { userId: session.user.id, question: { leagueId: params.id } },
    }),
  ])

  if (!league) notFound()
  if (!userMember) redirect('/ligas')

  // Serialize para pasar a client components (Dates → string)
  const sLeague: SLeague = {
    id: league.id,
    name: league.name,
    description: league.description,
    creatorId: league.creatorId,
    inviteCode: league.inviteCode,
    type: league.type,
    status: league.status,
    maxMembers: league.maxMembers,
    allowRemote: league.allowRemote,
    minConsumption: league.minConsumption,
    minConsumptionAmount: league.minConsumptionAmount,
    seasonEndDate: league.seasonEndDate?.toISOString() ?? null,
    business: league.business,
    members: league.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      totalPoints: m.totalPoints,
      consumptionVerified: m.consumptionVerified,
      joinedAt: m.joinedAt.toISOString(),
      user: m.user,
    })),
    matches: league.matches.map((lm) => ({
      id: lm.id,
      matchId: lm.matchId,
      match: {
        id: lm.match.id,
        externalId: lm.match.externalId,
        homeTeam: lm.match.homeTeam,
        awayTeam: lm.match.awayTeam,
        homeLogo: lm.match.homeLogo,
        awayLogo: lm.match.awayLogo,
        competition: lm.match.competition,
        kickoffAt: lm.match.kickoffAt.toISOString(),
        status: lm.match.status as SLeague['matches'][0]['match']['status'],
        homeScore: lm.match.homeScore,
        awayScore: lm.match.awayScore,
        minutePlayed: lm.match.minutePlayed,
      },
    })),
    questions: league.questions.map((q) => ({
      id: q.id,
      matchId: q.matchId,
      text: q.text,
      type: q.type,
      options: q.options as string[],
      pointsValue: q.pointsValue,
      orderIndex: q.orderIndex,
      timing: q.timing as 'PRE_MATCH' | 'LIVE',
      status: q.status as 'PENDING' | 'OPEN' | 'CLOSED' | 'RESOLVED',
      openAt: q.openAt?.toISOString() ?? null,
      closedAt: q.closedAt?.toISOString() ?? null,
      resolvedAt: q.resolvedAt?.toISOString() ?? null,
      correctAnswer: q.correctAnswer,
    })),
    prizes: league.prizes,
    _count: league._count,
  }

  const sPredictions: SPrediction[] = predictions.map((p) => ({
    id: p.id,
    questionId: p.questionId,
    answer: p.answer,
    isCorrect: p.isCorrect,
    pointsEarned: p.pointsEarned,
  }))

  const userPosition = sLeague.members.findIndex((m) => m.userId === session.user.id) + 1
  const isCreator = league.creatorId === session.user.id
  const typeColor = TYPE_COLORS[league.type] ?? TYPE_COLORS.PRIVATE

  return (
    <div className="flex flex-col min-h-full animate-fade-in">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="relative px-4 pt-4 pb-5 bg-glow-green">
        <Link
          href="/ligas"
          className="inline-flex items-center gap-1 text-lt-muted2 text-sm font-condensed mb-4 hover:text-lt-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
          </svg>
          Mis ligas
        </Link>

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Tipo badge */}
            <span className={`inline-block text-[10px] font-condensed font-600 px-2 py-0.5 rounded-full border uppercase tracking-wider mb-2 ${typeColor}`}>
              {TYPE_LABELS[league.type] ?? league.type}
            </span>

            <h1 className="text-lt-white font-bebas text-4xl leading-tight tracking-wide line-clamp-2">
              {league.name}
            </h1>
            {league.description && (
              <p className="text-lt-muted2 font-barlow text-sm mt-1 leading-snug">
                {league.description}
              </p>
            )}
          </div>

          {/* Puntos del usuario */}
          <div className="flex-shrink-0 bg-lt-card2 border border-lt-green/30 rounded-card px-3 py-2 text-center min-w-[64px]">
            <p className="text-lt-green font-bebas text-3xl leading-none">{userMember.totalPoints}</p>
            <p className="text-lt-muted2 text-[10px] font-condensed uppercase tracking-wide">pts</p>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
          <span className="text-lt-muted2 font-condensed text-xs">
            👥 {league._count.members}/{league.maxMembers}
          </span>
          {userPosition > 0 && (
            <span className="text-lt-green font-condensed text-xs font-600">
              #{userPosition} clasificación
            </span>
          )}
          {league.business && (
            <span className="text-lt-amber font-condensed text-xs">
              📍 {league.business.name}
              {league.business.city ? `, ${league.business.city}` : ''}
            </span>
          )}
          {league.status === 'FINISHED' && (
            <span className="text-lt-muted2 font-condensed text-xs px-2 py-0.5 rounded-full bg-lt-muted/20 border border-lt-muted uppercase tracking-wider">
              Finalizada
            </span>
          )}
        </div>

        {/* Botón Admin — solo para el creador */}
        {isCreator && (
          <Link
            href={`/ligas/${league.id}/admin`}
            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-btn bg-lt-card2 border border-lt-green/30 text-lt-green font-condensed text-sm font-700 hover:bg-lt-green/10 active:scale-[0.98] transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
            Panel Admin
          </Link>
        )}
      </div>

      {/* ── Tabs ───────────────────────────────────────── */}
      <LigaTabs
        league={sLeague}
        userId={session.user.id}
        userPoints={userMember.totalPoints}
        userPosition={userPosition}
        isCreator={isCreator}
        predictions={sPredictions}
      />
    </div>
  )
}
