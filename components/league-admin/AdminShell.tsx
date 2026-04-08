'use client'
import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { InviteTab } from './InviteTab'
import { MatchesTab } from './MatchesTab'
import { MembersTab } from './MembersTab'
import { CustomizeTab } from './CustomizeTab'
import { SettingsTab } from './SettingsTab'
import type { LeagueAdminData, MemberAdminData, MatchRow, QuestionRow } from './types'

type Tab = 'invite' | 'matches' | 'members' | 'customize' | 'settings'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'invite', label: 'Invitar', icon: '🔗' },
  { key: 'matches', label: 'Partidos', icon: '⚽' },
  { key: 'members', label: 'Miembros', icon: '👥' },
  { key: 'customize', label: 'Marca', icon: '🎨' },
  { key: 'settings', label: 'Ajustes', icon: '⚙️' },
]

interface Props {
  league: LeagueAdminData
  members: MemberAdminData[]
  initialMatches: MatchRow[]
  initialQuestions: QuestionRow[]
  initialMatchId: string | null
  /** URL to go back to (e.g. /ligas or /dashboard/ligas) */
  backHref: string
  /** Default active tab */
  defaultTab?: Tab
}

export function AdminShell({
  league: initialLeague,
  members: initialMembers,
  initialMatches,
  initialQuestions,
  initialMatchId,
  backHref,
  defaultTab = 'invite',
}: Props) {
  const [tab, setTab] = useState<Tab>(defaultTab)
  const [leagueState, setLeagueState] = useState(initialLeague)
  const [memberList, setMemberList] = useState(initialMembers)

  const pendingCount = memberList.filter((m) => m.status === 'PENDING').length

  return (
    <div className="min-h-screen bg-lt-black pb-28">
      {/* Header */}
      <div className="bg-lt-card border-b border-[rgba(255,255,255,0.07)] px-4 pt-3 pb-0">
        <div className="flex items-center gap-3 pb-3">
          <Link href={backHref} className="text-lt-muted2 hover:text-lt-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-condensed text-xs text-lt-muted2 uppercase tracking-wide">{leagueState.name}</p>
            <h1 className="font-bebas text-2xl text-lt-white leading-none tracking-wide">Panel Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/ligas/${leagueState.id}/tv`}
              target="_blank"
              className="flex items-center gap-1.5 bg-lt-card2 border border-[rgba(255,255,255,0.12)] text-lt-muted2 hover:text-lt-green hover:border-lt-green/30 font-condensed text-xs px-2.5 py-1.5 rounded-full transition-colors"
              title="Modo TV — proyectar en pantalla"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              TV
            </Link>
            <span className="bg-lt-green/15 border border-lt-green/30 text-lt-green font-condensed text-xs px-2.5 py-1 rounded-full">
              Admin
            </span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 font-condensed text-sm font-700 border-b-2 transition-all flex-shrink-0 relative',
                tab === key
                  ? 'text-lt-green border-lt-green'
                  : 'text-lt-muted2 border-transparent hover:text-lt-white'
              )}
            >
              <span>{icon}</span>
              <span className="hidden sm:inline">{label}</span>
              {key === 'members' && pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-lt-red text-white text-[9px] font-700 flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 pt-4">
        {tab === 'invite' && (
          <InviteTab
            league={leagueState}
            onCodeRegenerated={(code) => setLeagueState((l) => ({ ...l, inviteCode: code }))}
          />
        )}

        {tab === 'matches' && (
          <MatchesTab
            leagueId={leagueState.id}
            initialMatches={initialMatches}
            initialQuestions={initialQuestions}
            initialMatchId={initialMatchId}
          />
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
      </div>
    </div>
  )
}
