import Link from 'next/link'
import { cn, formatPoints } from '@/lib/utils'
import type { LeagueWithDetails } from '@/types'

interface LeagueCardProps {
  league: LeagueWithDetails
  userPoints?: number
  className?: string
}

const TYPE_LABELS: Record<string, string> = {
  PUBLIC: 'Pública',
  PRIVATE: 'Privada',
  INVITE_ONLY: 'Con invitación',
  BUSINESS: 'Local',
}

export function LeagueCard({ league, userPoints, className }: LeagueCardProps) {
  return (
    <Link
      href={`/ligas/${league.id}`}
      className={cn(
        'block bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4',
        'hover:border-lt-green/30 transition-all card-hover-green',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lt-white font-condensed text-lg font-700 leading-tight truncate">
            {league.name}
          </h3>
          {league.description && (
            <p className="text-lt-muted2 text-sm font-barlow mt-0.5 line-clamp-1">
              {league.description}
            </p>
          )}
        </div>
        <span className="flex-shrink-0 text-[10px] font-condensed font-600 px-2 py-0.5 rounded-full bg-lt-card2 border border-lt-muted text-lt-muted2 uppercase tracking-wider">
          {TYPE_LABELS[league.type] ?? league.type}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-lt-muted2">
          <UsersIcon className="w-4 h-4" />
          <span className="font-condensed">{league._count.members}/{league.maxMembers}</span>
        </div>

        {userPoints !== undefined && (
          <div className="flex items-center gap-1.5 text-lt-green ml-auto">
            <StarIcon className="w-4 h-4" />
            <span className="font-condensed font-700">{formatPoints(userPoints)} pts</span>
          </div>
        )}
      </div>

      {league.business && (
        <div className="mt-2 pt-2 border-t border-[rgba(255,255,255,0.05)] text-lt-amber text-xs font-condensed">
          📍 {league.business.name}
        </div>
      )}
    </Link>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}
