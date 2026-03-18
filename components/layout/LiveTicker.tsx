'use client'
import { useQuery } from '@tanstack/react-query'
import { LiveDot } from '@/components/shared/LiveDot'
import type { Match } from '@prisma/client'

export function LiveTicker() {
  const { data: matches } = useQuery<Match[]>({
    queryKey: ['matches', 'live'],
    queryFn: () => fetch('/api/matches/live').then((r) => r.json()),
    refetchInterval: 30_000,
  })

  if (!matches?.length) return null

  const items = [...matches, ...matches] // duplicate for seamless loop

  return (
    <div className="w-full bg-lt-dark border-b border-[rgba(255,255,255,0.07)] overflow-hidden h-9 flex items-center">
      <div className="flex-shrink-0 flex items-center px-3 bg-lt-red h-full z-10">
        <LiveDot label="EN VIVO" />
      </div>
      <div className="overflow-hidden flex-1">
        <div className="flex gap-8 animate-ticker whitespace-nowrap">
          {items.map((m, i) => (
            <span key={`${m.id}-${i}`} className="inline-flex items-center gap-2 text-lt-white font-condensed text-sm">
              <span className="text-lt-muted2">{m.homeTeam}</span>
              <span className="text-lt-green font-700">
                {m.homeScore ?? 0} - {m.awayScore ?? 0}
              </span>
              <span className="text-lt-muted2">{m.awayTeam}</span>
              <span className="text-lt-muted mx-2">·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
