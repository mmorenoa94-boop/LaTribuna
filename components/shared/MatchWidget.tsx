import Image from 'next/image'
import { LiveDot } from './LiveDot'
import { cn, formatMatchMinute } from '@/lib/utils'
import type { Match } from '@prisma/client'

interface MatchWidgetProps {
  match: Match
  compact?: boolean
  className?: string
}

export function MatchWidget({ match, compact, className }: MatchWidgetProps) {
  const isLive = match.status === 'LIVE' || match.status === 'HALFTIME'
  const finished = match.status === 'FINISHED'

  return (
    <div className={cn(
      'flex items-center gap-3 bg-lt-card rounded-card px-4 py-3 border border-[rgba(255,255,255,0.07)]',
      className
    )}>
      {/* Home */}
      <div className={cn('flex items-center gap-2', compact ? 'flex-1 justify-end' : 'flex-1 justify-end')}>
        <span className="text-lt-white font-condensed text-sm font-600 text-right leading-tight">
          {match.homeTeam}
        </span>
        {match.homeLogo && (
          <Image src={match.homeLogo} alt={match.homeTeam} width={28} height={28} className="object-contain" />
        )}
      </div>

      {/* Score / Status */}
      <div className="flex flex-col items-center min-w-[56px]">
        {(isLive || finished) ? (
          <span className={cn(
            'font-bebas text-2xl leading-none tracking-wide',
            isLive ? 'text-lt-green' : 'text-lt-white'
          )}>
            {match.homeScore ?? 0} - {match.awayScore ?? 0}
          </span>
        ) : (
          <span className="text-lt-muted2 font-condensed text-sm">
            {new Date(match.kickoffAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {isLive && (
          match.status === 'HALFTIME'
            ? <span className="text-lt-amber text-[10px] font-condensed mt-0.5">HT</span>
            : <span className="text-lt-red text-[10px] font-condensed mt-0.5">{formatMatchMinute(match.minutePlayed)}</span>
        )}
      </div>

      {/* Away */}
      <div className="flex items-center gap-2 flex-1">
        {match.awayLogo && (
          <Image src={match.awayLogo} alt={match.awayTeam} width={28} height={28} className="object-contain" />
        )}
        <span className="text-lt-white font-condensed text-sm font-600 leading-tight">
          {match.awayTeam}
        </span>
      </div>

      {isLive && !compact && <LiveDot />}
    </div>
  )
}
