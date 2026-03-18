import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TriviaScreen } from './_components/TriviaScreen'

interface Props {
  params: { id: string }
  searchParams: { matchId?: string }
}

export default async function TriviaPage({ params, searchParams }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const matchId = searchParams.matchId
  if (!matchId) redirect(`/ligas/${params.id}`)

  const [member, league, match] = await Promise.all([
    prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId: params.id, userId: session.user.id } },
    }),
    prisma.league.findUnique({
      where: { id: params.id },
      select: { id: true, name: true },
    }),
    prisma.match.findUnique({ where: { id: matchId } }),
  ])

  if (!member || !league || !match) redirect(`/ligas/${params.id}`)

  return (
    <TriviaScreen
      leagueId={params.id}
      leagueName={league.name}
      matchId={matchId}
      initialMatch={{
        id: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeLogo: match.homeLogo,
        awayLogo: match.awayLogo,
        status: match.status,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        minutePlayed: match.minutePlayed,
        kickoffAt: match.kickoffAt.toISOString(),
      }}
    />
  )
}
