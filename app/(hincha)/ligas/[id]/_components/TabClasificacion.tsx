'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, formatPoints } from '@/lib/utils'
import type { SLeague, SPrize } from './types'

interface Props {
  league: SLeague
  userId: string
  userPoints: number
  userPosition: number
}

interface LeaderboardMatch {
  id: string
  homeTeam: string
  awayTeam: string
  kickoffAt: string
  status: string
  homeScore: number | null
  awayScore: number | null
}

interface MatchBreakdown {
  matchId: string
  points: number
  correct: number
  total: number
}

interface LeaderboardEntry {
  userId: string
  user: { id: string; name: string; image: string | null; level: number }
  totalPoints: number
  matchPoints: number
  positionChange: number
  matchBreakdown: MatchBreakdown[]
}

interface LeaderboardData {
  matches: LeaderboardMatch[]
  leaderboard: LeaderboardEntry[]
}

const MEDAL: Record<number, { emoji: string; color: string; bg: string; border: string }> = {
  1: { emoji: '🥇', color: 'text-yellow-400',  bg: 'bg-yellow-400/10',  border: 'border-yellow-400/40' },
  2: { emoji: '🥈', color: 'text-slate-300',   bg: 'bg-slate-300/10',   border: 'border-slate-300/40'  },
  3: { emoji: '🥉', color: 'text-orange-400',  bg: 'bg-orange-400/10',  border: 'border-orange-400/40' },
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function TabClasificacion({ league, userId, userPosition }: Props) {
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null) // null = Overall
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<LeaderboardEntry | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  async function fetchLeaderboard(matchId?: string | null) {
    try {
      const url = matchId
        ? `/api/leagues/${league.id}/leaderboard?matchId=${matchId}`
        : `/api/leagues/${league.id}/leaderboard`
      const res = await fetch(url)
      if (res.ok) setData(await res.json())
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchLeaderboard(selectedMatchId)
    const interval = setInterval(() => fetchLeaderboard(selectedMatchId), 15_000)
    return () => clearInterval(interval)
  }, [league.id, selectedMatchId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!data || data.leaderboard.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div className="text-5xl">🏆</div>
        <p className="text-lt-white font-condensed text-lg font-700">Sin clasificación aún</p>
        <p className="text-lt-muted2 font-condensed text-sm">Las posiciones se actualizan en tiempo real</p>
      </div>
    )
  }

  const entries = data.leaderboard
  const selectedMatch = data.matches.find((m) => m.id === selectedMatchId)
  const dropdownLabel = selectedMatch
    ? `${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`
    : 'General'

  const top3 = entries.slice(0, Math.min(3, entries.length))

  return (
    <div className="space-y-5">
      {/* ── Match filter dropdown ──────────────────────── */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(255,255,255,0.15)] bg-lt-card text-lt-white font-condensed text-sm font-700 hover:border-lt-green/40 transition-colors"
        >
          <span className="truncate max-w-[180px]">{dropdownLabel}</span>
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
            className={cn('transition-transform flex-shrink-0', showDropdown && 'rotate-180')}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute z-20 mt-1 left-0 w-64 bg-lt-card border border-[rgba(255,255,255,0.15)] rounded-card shadow-xl overflow-hidden"
            >
              {/* Overall option */}
              <button
                onClick={() => { setSelectedMatchId(null); setShowDropdown(false) }}
                className={cn(
                  'w-full text-left px-4 py-2.5 font-condensed text-sm transition-colors',
                  !selectedMatchId ? 'bg-lt-green/10 text-lt-green font-700' : 'text-lt-white hover:bg-lt-card2'
                )}
              >
                General
              </button>

              {data.matches.length > 0 && (
                <div className="border-t border-[rgba(255,255,255,0.07)]">
                  <p className="px-4 py-1.5 text-lt-muted2 font-condensed text-[10px] uppercase tracking-widest">
                    Por partido
                  </p>
                  {data.matches.map((match) => (
                    <button
                      key={match.id}
                      onClick={() => { setSelectedMatchId(match.id); setShowDropdown(false) }}
                      className={cn(
                        'w-full text-left px-4 py-2 font-condensed text-sm transition-colors',
                        selectedMatchId === match.id
                          ? 'bg-lt-green/10 text-lt-green font-700'
                          : 'text-lt-white hover:bg-lt-card2'
                      )}
                    >
                      <span className="truncate block">{match.homeTeam} vs {match.awayTeam}</span>
                      <span className="text-lt-muted2 text-[10px]">
                        {new Date(match.kickoffAt).toLocaleDateString('es-CO', {
                          day: '2-digit', month: 'short',
                          timeZone: 'America/Bogota',
                        })}
                        {match.status === 'FINISHED' && match.homeScore !== null
                          ? ` · ${match.homeScore}-${match.awayScore}`
                          : ''}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Podium top 3 ──────────────────────────────── */}
      {top3.length >= 2 && (
        <div className="flex items-end justify-center gap-2 pt-2 pb-4">
          {[1, 0, 2].map((i) => {
            const m = top3[i]
            if (!m) return null
            const pos = i + 1
            const medal = MEDAL[pos]
            const isUser = m.userId === userId
            const heightByPos: Record<number, string> = { 1: 'h-36', 2: 'h-28', 3: 'h-24' }
            const pts = selectedMatchId ? m.matchPoints : m.totalPoints

            return (
              <button
                key={m.userId}
                onClick={() => setSelectedPlayer(m)}
                className="flex flex-col items-center gap-2 flex-1"
              >
                <div className="flex flex-col items-center gap-1.5">
                  <div className={cn(
                    'w-12 h-12 rounded-full border-2 overflow-hidden flex-shrink-0',
                    isUser ? 'border-lt-green' : medal.border
                  )}>
                    {m.user.image ? (
                      <Image src={m.user.image} alt={m.user.name} width={48} height={48} className="object-cover w-full h-full" />
                    ) : (
                      <div className={cn('w-full h-full flex items-center justify-center font-bebas text-xl', medal.bg, medal.color)}>
                        {m.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p className={cn(
                    'font-condensed text-xs font-700 text-center w-20 truncate',
                    isUser ? 'text-lt-green' : 'text-lt-white'
                  )}>
                    {isUser ? 'Tú' : m.user.name.split(' ')[0]}
                  </p>
                  <p className="text-lt-muted2 font-condensed text-xs">{formatPoints(pts)} pts</p>
                </div>
                <div className={cn(
                  'w-full rounded-t-lg flex flex-col items-center justify-start pt-2',
                  heightByPos[pos], medal.bg,
                  'border border-b-0', medal.border
                )}>
                  <span className="text-2xl">{medal.emoji}</span>
                  <span className={cn('font-bebas text-2xl leading-none', medal.color)}>#{pos}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Premios ───────────────────────────────────── */}
      {league.prizes.length > 0 && !selectedMatchId && (
        <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4">
          <p className="text-lt-white font-condensed text-sm font-700 uppercase tracking-wider mb-3">
            🎁 Premios de la liga
          </p>
          <div className="space-y-2">
            {league.prizes.map((prize) => (
              <PrizeRow key={prize.id} prize={prize} />
            ))}
          </div>
        </div>
      )}

      {/* ── Ranking completo ──────────────────────────── */}
      <div className="space-y-1.5">
        <p className="text-lt-muted2 font-condensed text-xs uppercase tracking-widest mb-2">
          {selectedMatchId ? 'Ranking del partido' : 'Ranking completo'} — {entries.length} jugadores
        </p>

        {entries.map((m, i) => {
          const pos = i + 1
          const isUser = m.userId === userId
          const medal = MEDAL[pos]
          const pts = selectedMatchId ? m.matchPoints : m.totalPoints

          return (
            <button
              key={m.userId}
              onClick={() => setSelectedPlayer(m)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-btn border transition-colors w-full text-left',
                isUser
                  ? 'bg-lt-green/10 border-lt-green/30'
                  : 'bg-lt-card border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]'
              )}
            >
              {/* Position change arrow + position */}
              <div className="flex items-center gap-1 w-10 flex-shrink-0">
                <PositionArrow change={m.positionChange} />
                <span className={cn(
                  'font-bebas text-lg leading-none',
                  medal ? medal.color : 'text-lt-muted2'
                )}>
                  {pos}
                </span>
              </div>

              {/* Avatar */}
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-lt-card2 border border-lt-muted">
                {m.user.image ? (
                  <Image src={m.user.image} alt={m.user.name} width={32} height={32} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bebas text-sm text-lt-muted2">
                    {m.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name + level */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'font-condensed text-sm font-700 leading-none truncate',
                  isUser ? 'text-lt-green' : 'text-lt-white'
                )}>
                  {isUser ? 'Tú' : m.user.name}
                </p>
                <p className="text-lt-muted2 font-condensed text-xs mt-0.5">
                  Niv. {m.user.level}
                </p>
              </div>

              {/* Points */}
              <span className={cn(
                'font-condensed font-700 text-sm flex-shrink-0 tabular-nums',
                isUser ? 'text-lt-green' : pos <= 3 && medal ? medal.color : 'text-lt-white'
              )}>
                {formatPoints(pts)}
                <span className="text-lt-muted2 font-400 text-xs ml-0.5">pts</span>
              </span>

              {/* Chevron */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-lt-muted2 flex-shrink-0">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )
        })}
      </div>

      {/* ── Player detail modal ───────────────────────── */}
      <AnimatePresence>
        {selectedPlayer && data && (
          <PlayerDetailModal
            player={selectedPlayer}
            matches={data.matches}
            isCurrentUser={selectedPlayer.userId === userId}
            onClose={() => setSelectedPlayer(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── PositionArrow ──────────────────────────────────────

function PositionArrow({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="text-lt-green text-[10px] flex items-center">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <path d="M12 4l-8 8h5v8h6v-8h5z" />
        </svg>
      </span>
    )
  }
  if (change < 0) {
    return (
      <span className="text-lt-red text-[10px] flex items-center">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <path d="M12 20l8-8h-5V4h-6v8H4z" />
        </svg>
      </span>
    )
  }
  return (
    <span className="text-lt-muted2 text-[10px] flex items-center">
      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="4" />
      </svg>
    </span>
  )
}

// ── PlayerDetailModal ──────────────────────────────────

function PlayerDetailModal({ player, matches, isCurrentUser, onClose }: {
  player: LeaderboardEntry
  matches: LeaderboardMatch[]
  isCurrentUser: boolean
  onClose: () => void
}) {
  const matchMap = new Map(matches.map((m) => [m.id, m]))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-lt-dark border border-[rgba(255,255,255,0.1)] rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-2 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-lt-muted2" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[rgba(255,255,255,0.07)]">
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-lt-card2 border border-lt-muted">
            {player.user.image ? (
              <Image src={player.user.image} alt={player.user.name} width={48} height={48} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bebas text-xl text-lt-muted2">
                {player.user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(
              'font-condensed text-base font-700 truncate',
              isCurrentUser ? 'text-lt-green' : 'text-lt-white'
            )}>
              {isCurrentUser ? 'Tú' : player.user.name}
            </p>
            <p className="text-lt-muted2 font-condensed text-xs">
              Niv. {player.user.level} · {formatPoints(player.totalPoints)} pts totales
            </p>
          </div>
          <button onClick={onClose} className="text-lt-muted2 hover:text-lt-white transition-colors p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Match breakdown list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <p className="font-condensed text-xs text-lt-muted2 uppercase tracking-widest">
            Desglose por partido
          </p>

          {player.matchBreakdown.length === 0 ? (
            <p className="text-lt-muted2 font-condensed text-sm text-center py-6">Sin partidos aún</p>
          ) : (
            player.matchBreakdown.map((mb) => {
              const match = matchMap.get(mb.matchId)
              if (!match) return null

              return (
                <div
                  key={mb.matchId}
                  className="bg-lt-card rounded-btn border border-[rgba(255,255,255,0.06)] p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-condensed text-sm font-700 text-lt-white truncate mr-2">
                      {match.homeTeam} vs {match.awayTeam}
                    </span>
                    <span className={cn(
                      'font-condensed text-sm font-700 tabular-nums flex-shrink-0',
                      mb.points > 0 ? 'text-lt-green' : 'text-lt-muted2'
                    )}>
                      {mb.points > 0 ? '+' : ''}{formatPoints(mb.points)} pts
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lt-muted2 font-condensed text-[10px]">
                      {new Date(match.kickoffAt).toLocaleDateString('es-CO', {
                        day: '2-digit', month: 'short',
                        timeZone: 'America/Bogota',
                      })}
                    </span>
                    {match.status === 'FINISHED' && match.homeScore !== null && (
                      <span className="text-lt-muted2 font-condensed text-[10px]">
                        {match.homeScore}-{match.awayScore}
                      </span>
                    )}
                    <span className="text-lt-muted2 font-condensed text-[10px]">
                      {mb.correct}/{mb.total} correctas
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── PrizeRow ───────────────────────────────────────────

function PrizeRow({ prize }: { prize: SPrize }) {
  const medal = MEDAL[prize.position]
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg w-6 text-center">{medal?.emoji ?? `#${prize.position}`}</span>
      <p className="flex-1 text-lt-white font-condensed text-sm">{prize.description}</p>
      {prize.pointsValue > 0 && (
        <span className="text-lt-green font-condensed text-xs font-600">+{formatPoints(prize.pointsValue)} pts</span>
      )}
    </div>
  )
}
