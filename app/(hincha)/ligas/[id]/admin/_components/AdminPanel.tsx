'use client'
import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { AddMatchModal, type MatchRow } from './AddMatchModal'
import { AddQuestionModal, type QuestionRow } from './AddQuestionModal'
import { QuestionItem } from './QuestionItem'
import { MembersTab } from './MembersTab'

type Tab = 'matches' | 'members'

interface Props {
  leagueId: string
  leagueName: string
  creatorId: string
  sessionUserId: string
  initialMatches: MatchRow[]
  initialQuestions: QuestionRow[]
  initialMatchId: string | null
}

export function AdminPanel({
  leagueId,
  leagueName,
  creatorId,
  sessionUserId,
  initialMatches,
  initialQuestions,
  initialMatchId,
}: Props) {
  const [activeTab, setActiveTab]         = useState<Tab>('matches')
  const [matches, setMatches]             = useState<MatchRow[]>(initialMatches)
  const [questions, setQuestions]         = useState<QuestionRow[]>(initialQuestions)
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(initialMatchId)
  const [loadingQs, setLoadingQs]         = useState(false)

  const [showAddMatch, setShowAddMatch]       = useState(false)
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [editQuestion, setEditQuestion]       = useState<QuestionRow | null>(null)

  const selectedMatch = matches.find((m) => m.id === selectedMatchId) ?? null

  // ── Navigate to a match's questions ─────────────────────────────────────────
  async function selectMatch(matchId: string) {
    setSelectedMatchId(matchId)
    setLoadingQs(true)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/admin/questions?matchId=${matchId}`)
      if (res.ok) setQuestions(await res.json())
    } finally {
      setLoadingQs(false)
    }
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleMatchCreated(m: MatchRow) {
    setMatches((prev) => [...prev, m])
    setShowAddMatch(false)
    selectMatch(m.id)
  }

  function handleQuestionCreated(q: QuestionRow) {
    if (editQuestion) {
      setQuestions((prev) => prev.map((x) => (x.id === q.id ? q : x)))
    } else {
      setQuestions((prev) => [...prev, q])
    }
    setShowAddQuestion(false)
    setEditQuestion(null)
    setMatches((prev) =>
      prev.map((m) =>
        m.id === selectedMatchId
          ? { ...m, questionCount: editQuestion ? m.questionCount : m.questionCount + 1 }
          : m
      )
    )
  }

  function handleQuestionUpdated(q: QuestionRow) {
    setQuestions((prev) => prev.map((x) => (x.id === q.id ? q : x)))
  }

  function handleQuestionDeleted(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
    setMatches((prev) =>
      prev.map((m) =>
        m.id === selectedMatchId ? { ...m, questionCount: Math.max(0, m.questionCount - 1) } : m
      )
    )
  }

  function handleEdit(q: QuestionRow) {
    setEditQuestion(q)
    setShowAddQuestion(true)
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function formatKickoff(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Bogota',
    })
  }

  const STATUS_COLORS: Record<string, string> = {
    SCHEDULED: 'text-lt-muted2',
    LIVE:      'text-lt-red',
    HALFTIME:  'text-lt-amber',
    FINISHED:  'text-lt-muted',
    CANCELLED: 'text-lt-red',
  }

  const pendingCount = questions.filter((q) => q.status === 'PENDING').length
  const openCount    = questions.filter((q) => q.status === 'OPEN').length

  // When navigating to question view, hide the tab bar
  const showTabs = !selectedMatchId

  return (
    <div className="min-h-screen bg-lt-black pb-28">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-lt-card border-b border-[rgba(255,255,255,0.07)] px-4 pt-3 pb-0">
        <div className="flex items-center gap-3 pb-3">
          <Link
            href={`/ligas/${leagueId}`}
            className="text-lt-muted2 hover:text-lt-white transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div>
            <p className="font-condensed text-xs text-lt-muted2 uppercase tracking-wide">{leagueName}</p>
            <h1 className="font-bebas text-2xl text-lt-white leading-none tracking-wide">Panel Admin</h1>
          </div>
          <span className="ml-auto bg-lt-green/15 border border-lt-green/30 text-lt-green font-condensed text-xs px-2.5 py-1 rounded-full">
            Admin
          </span>
        </div>

        {/* ── Tab bar (only when not in question detail) ─────────────────── */}
        {showTabs && (
          <div className="flex gap-1">
            {([
              { key: 'matches' as Tab, label: 'Partidos', icon: '⚽' },
              { key: 'members' as Tab, label: 'Miembros', icon: '👥' },
            ] as const).map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 font-condensed text-sm font-700 border-b-2 transition-all',
                  activeTab === t.key
                    ? 'text-lt-green border-lt-green'
                    : 'text-lt-muted2 border-transparent hover:text-lt-white'
                )}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pt-4">
        <AnimatePresence mode="wait" initial={false}>

          {/* ── TAB: Matches ──────────────────────────────────────────────── */}
          {activeTab === 'matches' && (
            <motion.div
              key="matches-tab"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
            >
              {!selectedMatchId ? (
                /* Match list */
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-condensed text-base font-700 text-lt-white uppercase tracking-wide">
                      Partidos ({matches.length})
                    </h2>
                    <button
                      onClick={() => setShowAddMatch(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-btn bg-lt-green text-lt-black font-condensed text-sm font-700 active:scale-95 transition-all"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Agregar partido
                    </button>
                  </div>

                  {matches.length === 0 ? (
                    <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-8 text-center">
                      <p className="text-4xl mb-3">⚽</p>
                      <p className="font-condensed text-base text-lt-white font-700">Sin partidos todavía</p>
                      <p className="font-condensed text-sm text-lt-muted2 mt-1">
                        Agrega el primer partido para empezar a crear preguntas
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {matches.map((match) => (
                        <motion.button
                          key={match.id}
                          onClick={() => selectMatch(match.id)}
                          whileTap={{ scale: 0.98 }}
                          className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4 text-left hover:border-lt-green/30 transition-colors w-full"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1">
                              <p className="font-condensed text-base font-700 text-lt-white">{match.homeTeam}</p>
                              <span className="font-bebas text-lg text-lt-muted2">VS</span>
                              <p className="font-condensed text-base font-700 text-lt-white">{match.awayTeam}</p>
                            </div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-lt-muted2 flex-shrink-0">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-condensed text-xs text-lt-muted2">{match.competition}</span>
                            <span className="font-condensed text-xs text-lt-muted2">·</span>
                            <span className="font-condensed text-xs text-lt-muted2">{formatKickoff(match.kickoffAt)}</span>
                            <span className="font-condensed text-xs text-lt-muted2">·</span>
                            <span className={cn('font-condensed text-xs font-700', STATUS_COLORS[match.status] ?? 'text-lt-muted2')}>
                              {match.status === 'SCHEDULED' ? 'Programado'
                                : match.status === 'LIVE' ? '🔴 En vivo'
                                : match.status === 'FINISHED' ? 'Finalizado'
                                : match.status}
                            </span>
                          </div>
                          <div className="mt-2.5 flex items-center gap-1.5">
                            <span className="font-condensed text-xs text-lt-green font-700">
                              {match.questionCount} pregunta{match.questionCount !== 1 ? 's' : ''}
                            </span>
                            {match.questionCount === 0 && (
                              <span className="font-condensed text-xs text-lt-muted2">— toca para agregar</span>
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Question management */
                <div className="flex flex-col gap-4">
                  {/* Match sub-header */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedMatchId(null)}
                      className="text-lt-muted2 hover:text-lt-white transition-colors"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-condensed text-base font-700 text-lt-white truncate">
                        {selectedMatch?.homeTeam} vs {selectedMatch?.awayTeam}
                      </p>
                      <p className="font-condensed text-xs text-lt-muted2">
                        {selectedMatch && formatKickoff(selectedMatch.kickoffAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => { setEditQuestion(null); setShowAddQuestion(true) }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-btn bg-lt-green text-lt-black font-condensed text-sm font-700 active:scale-95 transition-all flex-shrink-0"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Pregunta
                    </button>
                  </div>

                  {/* Stats row */}
                  {questions.length > 0 && (
                    <div className="flex gap-3">
                      <div className="flex-1 bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-3 text-center">
                        <p className="font-bebas text-2xl text-lt-white">{questions.length}</p>
                        <p className="font-condensed text-xs text-lt-muted2">Total</p>
                      </div>
                      <div className="flex-1 bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-3 text-center">
                        <p className="font-bebas text-2xl text-lt-muted2">{pendingCount}</p>
                        <p className="font-condensed text-xs text-lt-muted2">Pendientes</p>
                      </div>
                      <div className="flex-1 bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-3 text-center">
                        <p className={cn('font-bebas text-2xl', openCount > 0 ? 'text-lt-green' : 'text-lt-muted2')}>{openCount}</p>
                        <p className="font-condensed text-xs text-lt-muted2">Abiertas</p>
                      </div>
                    </div>
                  )}

                  {/* Questions */}
                  {loadingQs ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-2 border-lt-green/30 border-t-lt-green rounded-full animate-spin" />
                    </div>
                  ) : questions.length === 0 ? (
                    <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-8 text-center">
                      <p className="text-3xl mb-3">❓</p>
                      <p className="font-condensed text-base text-lt-white font-700">Sin preguntas todavía</p>
                      <p className="font-condensed text-sm text-lt-muted2 mt-1">
                        Crea la primera pregunta para este partido
                      </p>
                      <button
                        onClick={() => setShowAddQuestion(true)}
                        className="mt-4 px-5 py-2.5 rounded-btn bg-lt-green text-lt-black font-condensed text-sm font-700"
                      >
                        + Nueva pregunta
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <AnimatePresence>
                        {questions.map((q) => (
                          <QuestionItem
                            key={q.id}
                            question={q}
                            leagueId={leagueId}
                            onUpdated={handleQuestionUpdated}
                            onDeleted={handleQuestionDeleted}
                            onEdit={handleEdit}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ── TAB: Members ──────────────────────────────────────────────── */}
          {activeTab === 'members' && (
            <motion.div
              key="members-tab"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.18 }}
            >
              <MembersTab
                leagueId={leagueId}
                creatorId={creatorId}
                sessionUserId={sessionUserId}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <AddMatchModal
        leagueId={leagueId}
        open={showAddMatch}
        onClose={() => setShowAddMatch(false)}
        onCreated={handleMatchCreated}
      />

      {selectedMatch && (
        <AddQuestionModal
          leagueId={leagueId}
          matchId={selectedMatch.id}
          homeTeam={selectedMatch.homeTeam}
          awayTeam={selectedMatch.awayTeam}
          open={showAddQuestion}
          onClose={() => { setShowAddQuestion(false); setEditQuestion(null) }}
          onCreated={handleQuestionCreated}
          editQuestion={editQuestion}
        />
      )}
    </div>
  )
}
