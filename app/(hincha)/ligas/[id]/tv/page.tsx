'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'
import { cn } from '@/lib/utils'

// ── Types ──
interface TVData {
  league: {
    id: string
    name: string
    description: string | null
    inviteCode: string
    type: string
    scoringMode: string
    business: { name: string; logoUrl: string | null } | null
    prizes: { position: number; description: string }[]
    _count: { members: number }
  }
  leaderboard: {
    rank: number
    name: string
    image: string | null
    level: number
    totalPoints: number
  }[]
  matches: {
    id: string
    homeTeam: string
    awayTeam: string
    homeLogo: string | null
    awayLogo: string | null
    competition: string
    kickoffAt: string
    status: string
    homeScore: number | null
    awayScore: number | null
    minutePlayed: number | null
  }[]
  activeQuestion: {
    id: string
    text: string
    type: string
    options: string[]
    pointsValue: number
    timing: string
    closedAt: string | null
    _count: { answers: number; predictions: number }
  } | null
  lastResolved: {
    id: string
    text: string
    correctAnswer: string | null
    winnersCount: number | null
    totalPot: number | null
    resolvedAt: string | null
  } | null
  timestamp: string
}

const POLL_INTERVAL = 6000 // 6 seconds
const MEDAL = ['🥇', '🥈', '🥉']

// ── Main Page ──
export default function TVModePage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<TVData | null>(null)
  const [error, setError] = useState(false)
  const [clock, setClock] = useState(new Date())

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/leagues/${id}/tv`)
      if (!res.ok) throw new Error()
      setData(await res.json())
      setError(false)
    } catch {
      setError(true)
    }
  }, [id])

  // Poll for data
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchData])

  // Clock tick every second (for countdowns)
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  if (error && !data) {
    return (
      <div className="min-h-screen bg-[#0A0C0F] flex items-center justify-center">
        <p className="text-lt-muted2 font-condensed text-xl">No se pudo cargar la liga</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0A0C0F] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-lt-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const { league, leaderboard, matches, activeQuestion, lastResolved } = data
  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/invite/${league.inviteCode}`
    : ''

  const liveMatch = matches.find((m) => m.status === 'LIVE' || m.status === 'HALFTIME')
  const scheduledMatch = matches.find((m) => m.status === 'SCHEDULED')
  const featuredMatch = liveMatch ?? scheduledMatch ?? matches[0]

  // Show last resolved result for 30 seconds after resolution
  const showLastResult = lastResolved?.resolvedAt &&
    (new Date().getTime() - new Date(lastResolved.resolvedAt).getTime()) < 30000

  return (
    <div className="min-h-screen bg-[#0A0C0F] text-white overflow-hidden flex flex-col">
      {/* ── Header bar ── */}
      <header className="flex-shrink-0 flex items-center justify-between px-8 py-4 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-4">
          {league.business?.logoUrl && (
            <Image
              src={league.business.logoUrl}
              alt={league.business.name}
              width={48} height={48}
              className="rounded-full object-cover"
            />
          )}
          <div>
            <h1 className="font-bebas text-3xl text-lt-white tracking-wide leading-none">
              {league.name}
            </h1>
            {league.business && (
              <p className="font-condensed text-sm text-lt-muted2 mt-0.5">
                {league.business.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="font-condensed text-xs text-lt-muted2 uppercase tracking-wider">Jugadores</p>
            <p className="font-bebas text-2xl text-lt-green leading-none">{league._count.members}</p>
          </div>
          <div className="text-right">
            <p className="font-condensed text-xs text-lt-muted2 uppercase tracking-wider">Sistema</p>
            <p className="font-condensed text-sm text-lt-white font-700">
              {league.scoringMode === 'POOL' ? 'Pozo' : 'Fijo'}
            </p>
          </div>
        </div>
      </header>

      {/* ── Main content: 3-column layout ── */}
      <div className="flex-1 flex min-h-0">

        {/* ── LEFT: Leaderboard ── */}
        <div className="w-[45%] border-r border-[rgba(255,255,255,0.06)] flex flex-col">
          <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.04)]">
            <h2 className="font-bebas text-xl text-lt-muted2 tracking-widest uppercase">
              Clasificación
            </h2>
          </div>

          <div className="flex-1 overflow-hidden px-4 py-2">
            {leaderboard.length === 0 ? (
              <p className="text-lt-muted2 font-condensed text-base text-center mt-8">
                Sin jugadores aún
              </p>
            ) : (
              <div className="space-y-1">
                {leaderboard.map((entry, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 rounded-btn transition-all',
                      i === 0 && 'bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20',
                      i === 1 && 'bg-gradient-to-r from-gray-400/10 to-transparent border border-gray-400/15',
                      i === 2 && 'bg-gradient-to-r from-amber-700/10 to-transparent border border-amber-700/15',
                      i > 2 && 'border border-transparent'
                    )}
                  >
                    {/* Rank */}
                    <span className="w-8 text-center font-bebas text-lg flex-shrink-0">
                      {i < 3 ? MEDAL[i] : (
                        <span className="text-lt-muted2">{entry.rank}</span>
                      )}
                    </span>

                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-lt-card2 flex-shrink-0">
                      {entry.image ? (
                        <Image src={entry.image} alt={entry.name} width={36} height={36} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bebas text-lg text-lt-green">
                          {entry.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Name + level */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'font-condensed text-sm font-700 truncate',
                        i < 3 ? 'text-lt-white' : 'text-lt-muted'
                      )}>
                        {entry.name}
                      </p>
                      <p className="font-condensed text-[10px] text-lt-muted2">
                        Nivel {entry.level}
                      </p>
                    </div>

                    {/* Points */}
                    <span className={cn(
                      'font-bebas text-xl tabular-nums flex-shrink-0',
                      i === 0 ? 'text-yellow-400' :
                      i < 3 ? 'text-lt-white' :
                      'text-lt-muted2'
                    )}>
                      {entry.totalPoints.toLocaleString()}
                    </span>
                    <span className="font-condensed text-[10px] text-lt-muted2 uppercase">pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Match + Question + QR ── */}
        <div className="w-[55%] flex flex-col">

          {/* Match ticker */}
          {featuredMatch && (
            <div className={cn(
              'px-8 py-5 border-b border-[rgba(255,255,255,0.06)]',
              liveMatch && 'bg-lt-red/5'
            )}>
              <div className="flex items-center justify-center gap-6">
                {/* Home */}
                <div className="flex items-center gap-3 flex-1 justify-end">
                  <span className="font-condensed text-lg font-700 text-lt-white text-right">
                    {featuredMatch.homeTeam}
                  </span>
                  {featuredMatch.homeLogo ? (
                    <Image src={featuredMatch.homeLogo} alt="" width={48} height={48} className="object-contain flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-lt-card2 border border-[rgba(255,255,255,0.1)] flex-shrink-0" />
                  )}
                </div>

                {/* Score */}
                <div className="flex flex-col items-center min-w-[100px]">
                  {featuredMatch.status === 'LIVE' || featuredMatch.status === 'HALFTIME' || featuredMatch.status === 'FINISHED' ? (
                    <span className={cn(
                      'font-bebas text-5xl leading-none tabular-nums',
                      featuredMatch.status === 'FINISHED' ? 'text-lt-white' : 'text-lt-green'
                    )}>
                      {featuredMatch.homeScore ?? 0} - {featuredMatch.awayScore ?? 0}
                    </span>
                  ) : (
                    <span className="font-bebas text-4xl text-lt-white tabular-nums leading-none">
                      {new Date(featuredMatch.kickoffAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}

                  {featuredMatch.status === 'LIVE' && featuredMatch.minutePlayed && (
                    <span className="flex items-center gap-1.5 mt-1.5">
                      <span className="w-2 h-2 rounded-full bg-lt-red animate-pulse-dot" />
                      <span className="text-lt-red font-condensed text-sm font-700">{featuredMatch.minutePlayed}&apos;</span>
                    </span>
                  )}
                  {featuredMatch.status === 'HALFTIME' && (
                    <span className="text-lt-amber font-condensed text-xs font-700 mt-1">ENTRETIEMPO</span>
                  )}
                  {featuredMatch.status === 'FINISHED' && (
                    <span className="text-lt-muted2 font-condensed text-xs mt-1">FINAL</span>
                  )}
                  {featuredMatch.status === 'SCHEDULED' && (
                    <span className="text-lt-muted2 font-condensed text-xs mt-1">
                      {new Date(featuredMatch.kickoffAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>

                {/* Away */}
                <div className="flex items-center gap-3 flex-1">
                  {featuredMatch.awayLogo ? (
                    <Image src={featuredMatch.awayLogo} alt="" width={48} height={48} className="object-contain flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-lt-card2 border border-[rgba(255,255,255,0.1)] flex-shrink-0" />
                  )}
                  <span className="font-condensed text-lg font-700 text-lt-white">
                    {featuredMatch.awayTeam}
                  </span>
                </div>
              </div>

              {/* Competition label */}
              <p className="text-center text-lt-muted2 font-condensed text-xs uppercase tracking-widest mt-2">
                {featuredMatch.competition}
              </p>
            </div>
          )}

          {/* Active question OR last result OR QR */}
          <div className="flex-1 flex flex-col items-center justify-center px-8 py-6">
            {activeQuestion ? (
              <ActiveQuestionDisplay question={activeQuestion} clock={clock} />
            ) : showLastResult && lastResolved ? (
              <LastResultDisplay result={lastResolved} />
            ) : (
              <QRInviteDisplay inviteUrl={inviteUrl} inviteCode={league.inviteCode} memberCount={league._count.members} />
            )}
          </div>

          {/* Prizes bar */}
          {league.prizes.length > 0 && (
            <div className="px-8 py-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-center gap-8">
              {league.prizes.map((prize, i) => (
                <div key={prize.position} className="flex items-center gap-2">
                  <span className="text-xl">{MEDAL[i] ?? `#${prize.position}`}</span>
                  <span className="font-condensed text-sm text-lt-muted">{prize.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Footer bar ── */}
      <footer className="flex-shrink-0 flex items-center justify-between px-8 py-2.5 border-t border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
        <p className="font-condensed text-xs text-lt-muted2">
          La Tribuna · El juego de los que sí saben
        </p>
        <p className="font-condensed text-xs text-lt-muted2 tabular-nums">
          {clock.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      </footer>
    </div>
  )
}

// ── Active Question Display ──
function ActiveQuestionDisplay({
  question,
  clock,
}: {
  question: TVData['activeQuestion'] & {}
  clock: Date
}) {
  const timeLeft = question.closedAt
    ? Math.max(0, Math.floor((new Date(question.closedAt).getTime() - clock.getTime()) / 1000))
    : null

  const totalResponses = question._count.answers + question._count.predictions

  return (
    <div className="w-full max-w-[600px] text-center animate-fade-in">
      {/* Timing badge */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <span className={cn(
          'font-condensed text-xs font-700 uppercase tracking-widest px-3 py-1 rounded-full',
          question.timing === 'LIVE'
            ? 'bg-lt-red/15 text-lt-red border border-lt-red/30'
            : 'bg-lt-green/15 text-lt-green border border-lt-green/30'
        )}>
          {question.timing === 'LIVE' ? '🔴 En vivo' : '⏰ Pre-partido'}
        </span>
        <span className="font-condensed text-sm text-lt-green font-700">
          +{question.pointsValue} pts
        </span>
      </div>

      {/* Question text */}
      <h2 className="font-bebas text-4xl text-lt-white leading-tight mb-6">
        {question.text}
      </h2>

      {/* Options */}
      {question.type !== 'SCORE' && (
        <div className="grid gap-3 mb-6">
          {(question.options as string[]).map((opt, i) => (
            <div
              key={i}
              className="bg-lt-card border border-[rgba(255,255,255,0.1)] rounded-btn px-5 py-3 flex items-center gap-3"
            >
              <span className="w-8 h-8 rounded-full bg-lt-card2 flex items-center justify-center font-bebas text-base text-lt-muted2 flex-shrink-0">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="font-condensed text-lg text-lt-white font-700">{opt}</span>
            </div>
          ))}
        </div>
      )}

      {question.type === 'SCORE' && (
        <p className="text-lt-muted2 font-condensed text-lg mb-6">
          Escribe tu predicción de marcador en la app
        </p>
      )}

      {/* Countdown + responses */}
      <div className="flex items-center justify-center gap-6">
        {timeLeft !== null && timeLeft > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-lt-red animate-pulse-dot" />
            <span className={cn(
              'font-bebas text-3xl tabular-nums',
              timeLeft <= 10 ? 'text-lt-red' : 'text-lt-white'
            )}>
              {timeLeft}s
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="font-condensed text-sm text-lt-muted2">Respuestas:</span>
          <span className="font-bebas text-2xl text-lt-green">{totalResponses}</span>
        </div>
      </div>
    </div>
  )
}

// ── Last Result Display ──
function LastResultDisplay({
  result,
}: {
  result: NonNullable<TVData['lastResolved']>
}) {
  return (
    <div className="w-full max-w-[500px] text-center animate-fade-in">
      <p className="font-condensed text-xs text-lt-muted2 uppercase tracking-widest mb-3">
        Resultado
      </p>
      <h3 className="font-condensed text-lg text-lt-muted mb-2">{result.text}</h3>
      <p className="font-bebas text-4xl text-lt-green mb-4">{result.correctAnswer}</p>
      <div className="flex items-center justify-center gap-4">
        <span className="font-condensed text-sm text-lt-muted2">
          {result.winnersCount ?? 0} ganador{(result.winnersCount ?? 0) !== 1 ? 'es' : ''}
        </span>
        {result.totalPot != null && result.totalPot > 0 && (
          <>
            <span className="text-lt-muted2">·</span>
            <span className="font-condensed text-sm text-lt-green font-700">
              Pozo: {result.totalPot} pts
            </span>
          </>
        )}
      </div>
    </div>
  )
}

// ── QR Invite Display ──
function QRInviteDisplay({
  inviteUrl,
  inviteCode,
  memberCount,
}: {
  inviteUrl: string
  inviteCode: string
  memberCount: number
}) {
  return (
    <div className="text-center animate-fade-in">
      <p className="font-bebas text-2xl text-lt-white tracking-wide mb-1">
        ¡Únete a la trivia!
      </p>
      <p className="font-condensed text-sm text-lt-muted2 mb-6">
        Escanea el QR o ingresa el código
      </p>

      {/* QR Code */}
      <div className="bg-white rounded-2xl p-5 inline-block mb-5">
        {inviteUrl ? (
          <QRCodeSVG
            value={inviteUrl}
            size={220}
            level="M"
            bgColor="#FFFFFF"
            fgColor="#0A0C0F"
          />
        ) : (
          <div className="w-[220px] h-[220px] bg-gray-200 rounded" />
        )}
      </div>

      {/* Invite code */}
      <div className="mb-4">
        <p className="font-condensed text-xs text-lt-muted2 uppercase tracking-widest mb-1">
          Código de invitación
        </p>
        <p className="font-bebas text-5xl text-lt-green tracking-[0.15em] leading-none">
          {inviteCode}
        </p>
      </div>

      <p className="font-condensed text-sm text-lt-muted2">
        {memberCount} jugador{memberCount !== 1 ? 'es' : ''} ya dentro
      </p>
    </div>
  )
}
