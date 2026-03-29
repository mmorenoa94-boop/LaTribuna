import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LeagueAdminPanel } from './_components/LeagueAdminPanel'

export const dynamic = 'force-dynamic'

export default async function LeagueAdminPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) redirect('/login')
  if (session.user.role !== 'NEGOCIO') redirect('/home')

  const league = await prisma.league.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { members: true } },
    },
  })

  if (!league || league.creatorId !== session.user.id) notFound()

  const members = await prisma.leagueMember.findMany({
    where: { leagueId: league.id },
    include: { user: { select: { id: true, name: true, image: true, email: true } } },
    orderBy: [{ status: 'asc' }, { joinedAt: 'desc' }],
  })

  return (
    <div className="px-4 md:px-8 pt-4 md:pt-8 max-w-2xl animate-fade-in">
      <LeagueAdminPanel
        league={{
          id: league.id,
          name: league.name,
          description: league.description,
          inviteCode: league.inviteCode,
          allowRemote: league.allowRemote,
          requireApproval: league.requireApproval,
          allowMemberInvites: league.allowMemberInvites,
          minConsumption: league.minConsumption,
          minConsumptionAmount: league.minConsumptionAmount,
          type: league.type,
          matchMode: league.matchMode,
          scoringMode: league.scoringMode,
          maxMembers: league.maxMembers,
          status: league.status,
          memberCount: league._count.members,
          bannerUrl: league.bannerUrl,
          themeColor: league.themeColor ?? '#00E676',
        }}
        members={members.map((m) => ({
          id: m.userId,
          name: m.user.name,
          email: m.user.email ?? '',
          image: m.user.image,
          status: m.status,
          points: m.totalPoints,
          joinedAt: m.joinedAt.toISOString(),
          isCreator: m.userId === league.creatorId,
          consumptionVerified: m.consumptionVerified,
        }))}
      />
    </div>
  )
}
