'use client'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface MatchInfo {
  homeTeam: string
  awayTeam: string
  homeLogo: string | null
  awayLogo: string | null
  status: string
  homeScore: number | null
  awayScore: number | null
  minutePlayed: number | null
  kickoffAt: string
}

interface Props {
  match: MatchInfo
  leagueName: string
  leagueId: string
  isLive: boolean
}

export function MatchHeader({ match, leagueName, leagueId, isLive }: Props) {
  const showScore = match.homeScore != null && match.awayScore != null
  const isHalftime = match.status === 'HALFTIME'
  const isFinished = match.status === 'FINISHED'

  return (
    <div className="bg-lt-card border-b border-[rgba(255,255,255,0.07)] px-4 pt-3 pb-4">
      {/* Top row: back + live badge */}
      <div className="flex items-center justify-between mb-3">
        <Link
          href={`/ligas/${leagueId}`}
          className="flex items-center gap-1.5 text-lt-muted2 hover:text-lt-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="font-condensed text-sm">{leagueName}</span>
        </Link>

        {isLive && (
          <span className="flex items-center gap-1.5 bg-lt-red/20 border border-lt-red/40 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-lt-red animate-pulse-dot" />
            <span className="font-condensed text-xs font-700 text-lt-red uppercase tracking-wide">
              {isHalftime ? 'Descanso' : `En Vivo${match.minutePlayed ? ` ${match.minutePlayed}'` : ''}`}
            </span>
          </span>
        )}
        {isFinished && (
          <span className="font-condensed text-xs text-lt-muted2 uppercase tracking-wide">Finalizado</span>
        )}
        {!isLive && !isFinished && (
          <span className="font-condensed text-xs text-lt-muted2">
            {new Date(match.kickoffAt).toLocaleTimeString('es-CO', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'America/Bogota',
            })}
          </span>
        )}
      </div>

      {/* Score row */}
      <div className="flex items-center justify-between gap-3">
        {/* Home */}
        <div className="flex flex-col items-center gap-1.5 flex-1">
          {match.homeLogo ? (
            <Image src={match.homeLogo} alt={match.homeTeam} width={36} height={36} className="object-contain" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-lt-card2 flex items-center justify-center text-lg">⚽</div>
          )}
          <span className="font-condensed text-xs text-lt-white text-center leading-tight line-clamp-2">
            {match.homeTeam}
          </span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-3">
          {showScore ? (
            <>
              <span className={cn(
                'font-bebas text-4xl leading-none tabular-nums',
                isLive ? 'text-lt-white' : 'text-lt-muted2'
              )}>
                {match.homeScore}
              </span>
              <span className="font-bebas text-2xl text-lt-muted2 leading-none">-</span>
              <span className={cn(
                'font-bebas text-4xl leading-none tabular-nums',
                isLive ? 'text-lt-white' : 'text-lt-muted2'
              )}>
                {match.awayScore}
              </span>
            </>
          ) : (
            <span className="font-bebas text-2xl text-lt-muted2 leading-none">VS</span>
          )}
        </div>

        {/* Away */}
        <div className="flex flex-col items-center gap-1.5 flex-1">
          {match.awayLogo ? (
            <Image src={match.awayLogo} alt={match.awayTeam} width={36} height={36} className="object-contain" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-lt-card2 flex items-center justify-center text-lg">⚽</div>
          )}
          <span className="font-condensed text-xs text-lt-white text-center leading-tight line-clamp-2">
            {match.awayTeam}
          </span>
        </div>
      </div>
    </div>
  )
}
