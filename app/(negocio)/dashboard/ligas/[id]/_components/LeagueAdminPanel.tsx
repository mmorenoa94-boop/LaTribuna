'use client'
import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { InviteTab } from './InviteTab'
import { MatchesTab } from './MatchesTab'
import { SettingsTab } from './SettingsTab'
import { MembersTab } from './MembersTab'
import { CustomizeTab } from '@/app/(hincha)/ligas/[id]/admin/_components/CustomizeTab'

export interface LeagueData {
  id: string
  name: string
  description: string | null
  inviteCode: string
  allowRemote: boolean
  requireApproval: boolean
  allowMemberInvites: boolean
  minConsumption: boolean
  minConsumptionAmount: number | null
  matchMode: string
  scoringMode: string
  maxMembers: number
  type: string
  status: string
  memberCount: number
  bannerUrl: string | null
  themeColor: string
}

export interface MemberData {
  id: string
  name: string
  email: string
  image: string | null
  status: string
  points: number
  joinedAt: string
  isCreator: boolean
  consumptionVerified: boolean
}

type Tab = 'invite' | 'matches' | 'members' | 'customize' | 'settings'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'invite', label: 'Invitar', icon: '🔗' },
  { key: 'matches', label: 'Partidos', icon: '⚽' },
  { key: 'members', label: 'Miembros', icon: '👥' },
  { key: 'customize', label: 'Marca', icon: '🎨' },
  { key: 'settings', label: 'Ajustes', icon: '⚙️' },
]

export function LeagueAdminPanel({ league, members }: { league: LeagueData; members: MemberData[] }) {
  const [tab, setTab] = useState<Tab>('invite')
  const [leagueState, setLeagueState] = useState(league)
  const [memberList, setMemberList] = useState(members)

  const pendingCount = memberList.filter((m) => m.status === 'PENDING').length

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/ligas" className="text-lt-muted2 hover:text-lt-white transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-lt-muted2 text-sm font-condensed">Administrar liga</p>
          <h1 className="text-lt-white font-bebas text-3xl leading-tight truncate">{leagueState.name}</h1>
        </div>
      </div>

      {/* Tab bar — scrollable on mobile */}
      <div className="flex gap-1 bg-lt-card rounded-btn p-1 mb-6 overflow-x-auto no-scrollbar">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex-shrink-0 flex items-center justify-center gap-1 px-3 py-2.5 rounded-btn font-condensed text-xs sm:text-sm font-600 transition-all relative whitespace-nowrap',
              tab === key
                ? 'bg-lt-amber/20 text-lt-amber'
                : 'text-lt-muted2 hover:text-lt-white'
            )}
          >
            <span className="text-base">{icon}</span>
            <span className="hidden sm:inline">{label}</span>
            {key === 'members' && pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-lt-red text-white text-[10px] font-700 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'invite' && (
        <InviteTab league={leagueState} onCodeRegenerated={(code) => setLeagueState((l) => ({ ...l, inviteCode: code }))} />
      )}
      {tab === 'matches' && (
        <MatchesTab leagueId={leagueState.id} />
      )}
      {tab === 'members' && (
        <MembersTab
          leagueId={leagueState.id}
          members={memberList}
          onMembersChange={setMemberList}
        />
      )}
      {tab === 'customize' && (
        <CustomizeTab
          leagueId={leagueState.id}
          initialBannerUrl={leagueState.bannerUrl}
          initialThemeColor={leagueState.themeColor}
        />
      )}
      {tab === 'settings' && (
        <SettingsTab league={leagueState} onUpdate={setLeagueState} />
      )}
    </>
  )
}
