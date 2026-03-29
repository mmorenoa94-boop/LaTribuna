'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { AddMatchModal, type MatchRow } from './AddMatchModal'
import { AddQuestionModal, type QuestionRow } from './AddQuestionModal'
import { QuestionItem } from './QuestionItem'
import { MembersTab } from './MembersTab'
import { ImportMatchesModal } from './ImportMatchesModal'
import { CustomizeTab } from './CustomizeTab'
import { SettingsTab } from './SettingsTab'
import { GenerateQuestionsModal } from './GenerateQuestionsModal'

type Tab = 'matches' | 'members' | 'customize' | 'settings'

interface Props {
  leagueId: string
  leagueName: string
  leagueDescription: string | null
  leagueMaxMembers: number
  leagueAllowRemote: boolean
  leagueAllowMemberInvites: boolean
  creatorId: string
  sessionUserId: string
  initialMatches: MatchRow[]
  initialQuestions: QuestionRow[]
  initialMatchId: string | null
  initialBannerUrl: string | null
  initialThemeColor: string
  leagueScoringMode: 'FIXED' | 'POOL'
  leagueMatchMode: 'PER_MATCH' | 'SEASON'
  leagueType: 'PRIVATE' | 'INVITE_ONLY' | 'PUBLIC' | 'BUSINESS'
  hasLinkedBusiness: boolean
}

export function AdminPanel({
  leagueId,
  leagueName,
  leagueDescription,
  leagueMaxMembers,
  leagueAllowRemote,
  leagueAllowMemberInvites,
  creatorId,
  sessionUserId,
  initialMatches,
  initialQuestions,
  initialMatchId,
  initialBannerUrl,
  initialThemeColor,
  leagueScoringMode,
  leagueMatchMode,
  leagueType,
  hasLinkedBusiness,
}: Props) {
  const [activeTab, setActiveTab]         = useState<Tab>('matches')
  const [matches, setMatches]             = useState<MatchRow[]>(initialMatches)
  const [questions, setQuestions]         = useState<QuestionRow[]>(initialQuestions)
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(initialMatchId)
  const [loadingQs, setLoadingQs]         = useState(false)

  const [showAddMatch, setShowAddMatch]       = useState(false)
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [editQuestion, setEditQuestion]       = useState<QuestionRow | null>(null)
  const [editMatch, setEditMatch]             = useState<MatchRow | null>(null)
  const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null)
  const [confirmDeleteMatch, setConfirmDeleteMatch] = useState<string | null>(null)
  const [showImportMatches, setShowImportMatches] = useState(false)
  const [showGenerateQuestions, setShowGenerateQuestions] = useState(false)
  const [closingAll, setClosingAll] = useState(false)
  const [openingAll, setOpeningAll] = useState(false)
  const [savingScore, setSavingScore] = useState(false)

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

  // ── Auto-refresh questions every 10s when a match is selected ────────────
  const refreshQuestions = useCallback(async () => {
    if (!selectedMatchId) return
    try {
      const res = await fetch(`/api/leagues/${leagueId}/admin/questions?matchId=${selectedMatchId}`)
      if (res.ok) setQuestions(await res.json())
    } catch { /* ignore */ }
  }, [leagueId, selectedMatchId])

  useEffect(() => {
    if (!selectedMatchId) return
    const interval = setInterval(refreshQuestions, 10_000)
    return () => clearInterval(interval)
  }, [selectedMatchId, refreshQuestions])

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleMatchCreated(m: MatchRow) {
    setMatches((prev) => [...prev, m])
    setShowAddMatch(false)
    selectMatch(m.id)
  }

  function handleQuestionsGenerated(newQuestions: QuestionRow[]) {
    setQuestions(newQuestions) // batch endpoint returns ALL questions for the match
    setMatches((prev) =>
      prev.map((m) =>
        m.id === selectedMatchId
          ? { ...m, questionCount: newQuestions.length }
          : m
      )
    )
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

  function handleEditMatch(m: MatchRow) {
    setEditMatch(m)
    setShowAddMatch(true)
  }

  function handleMatchEdited(m: MatchRow) {
    setMatches((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...m } : x)))
    setShowAddMatch(false)
    setEditMatch(null)
  }

  async function handleDeleteMatch(matchId: string) {
    setDeletingMatchId(matchId)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/admin/matches/${matchId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setMatches((prev) => prev.filter((m) => m.id !== matchId))
        if (selectedMatchId === matchId) {
          setSelectedMatchId(null)
          setQuestions([])
        }
      }
    } finally {
      setDeletingMatchId(null)
      setConfirmDeleteMatch(null)
    }
  }

  function handleMatchesImported(newMatches: MatchRow[]) {
    setMatches((prev) => [...prev, ...newMatches])
    setShowImportMatches(false)
  }

  async function handleCloseAllOpen() {
    if (!selectedMatchId || closingAll) return
    if (!confirm('¿Cerrar todas las preguntas abiertas de este partido?')) return
    setClosingAll(true)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/admin/questions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close-all', matchId: selectedMatchId }),
      })
      if (res.ok) {
        const updated = await res.json()
        setQuestions(updated)
      }
    } finally {
      setClosingAll(false)
    }
  }

  async function handleOpenAllPending() {
    if (!selectedMatchId || openingAll) return
    if (!confirm('¿Abrir todas las preguntas pendientes de este partido?')) return
    setOpeningAll(true)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/admin/questions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'open-all', matchId: selectedMatchId }),
      })
      if (res.ok) {
        const updated = await res.json()
        setQuestions(updated)
      }
    } finally {
      setOpeningAll(false)
    }
  }

  async function handleSaveScore(matchId: string, homeScore: number, awayScore: number, markFinished: boolean) {
    setSavingScore(true)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/admin/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeScore,
          awayScore,
          ...(markFinished ? { status: 'FINISHED' } : {}),
        }),
      })
      if (res.ok) {
        setMatches((prev) =>
          prev.map((m) =>
            m.id === matchId
              ? { ...m, homeScore, awayScore, ...(markFinished ? { status: 'FINISHED' } : {}) }
              : m
          )
        )
      }
    } finally {
      setSavingScore(false)
    }
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
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {([
              { key: 'matches' as Tab, label: 'Partidos', icon: '⚽' },
              { key: 'members' as Tab, label: 'Miembros', icon: '👥' },
              { key: 'customize' as Tab, label: 'Personalizar', icon: '🎨' },
              { key: 'settings' as Tab, label: 'Ajustes', icon: '⚙️' },
            ] as const).map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 font-condensed text-sm font-700 border-b-2 transition-all flex-shrink-0',
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowImportMatches(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-btn bg-lt-card2 border border-[rgba(255,255,255,0.07)] text-lt-muted2 hover:text-lt-white font-condensed text-sm font-700 active:scale-95 transition-all"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        CSV
                      </button>
                      <button
                        onClick={() => setShowAddMatch(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-btn bg-lt-green text-lt-black font-condensed text-sm font-700 active:scale-95 transition-all"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Agregar
                      </button>
                    </div>
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
                        <motion.div
                          key={match.id}
                          className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4 hover:border-lt-green/30 transition-colors w-full"
                        >
                          {/* Confirm delete overlay */}
                          {confirmDeleteMatch === match.id ? (
                            <div className="flex flex-col items-center gap-3 py-2">
                              <p className="font-condensed text-sm text-lt-white text-center">
                                ¿Eliminar <strong>{match.homeTeam} vs {match.awayTeam}</strong> y todas sus preguntas?
                              </p>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => setConfirmDeleteMatch(null)}
                                  className="px-4 py-2 rounded-btn bg-lt-card2 text-lt-muted2 font-condensed text-sm font-700"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => handleDeleteMatch(match.id)}
                                  disabled={deletingMatchId === match.id}
                                  className="px-4 py-2 rounded-btn bg-lt-red text-white font-condensed text-sm font-700 disabled:opacity-50"
                                >
                                  {deletingMatchId === match.id ? 'Eliminando…' : 'Sí, eliminar'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => selectMatch(match.id)}
                                className="w-full text-left"
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
                                      : match.status === 'LIVE' ? 'En vivo'
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
                              </button>

                              {/* Edit / Delete buttons */}
                              <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.07)] flex gap-2">
                                <button
                                  onClick={() => handleEditMatch(match)}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-btn bg-lt-card2 text-lt-muted2 hover:text-lt-white font-condensed text-xs font-700 transition-colors"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                  Editar
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteMatch(match.id)}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-btn bg-lt-red/10 text-lt-red hover:bg-lt-red/20 font-condensed text-xs font-700 transition-colors"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                  Eliminar
                                </button>
                              </div>
                            </>
                          )}
                        </motion.div>
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
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => setShowGenerateQuestions(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-btn bg-lt-amber/15 border border-lt-amber/40 text-lt-amber font-condensed text-sm font-700 active:scale-95 transition-all"
                        title="Generar preguntas desde plantilla"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                        Generar
                      </button>
                      <button
                        onClick={() => { setEditQuestion(null); setShowAddQuestion(true) }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-btn bg-lt-green text-lt-black font-condensed text-sm font-700 active:scale-95 transition-all"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span className="hidden sm:inline">Pregunta</span>
                        <span className="sm:hidden">+</span>
                      </button>
                    </div>
                  </div>

                  {/* Score input */}
                  {selectedMatch && (
                    <ScoreInput
                      match={selectedMatch}
                      saving={savingScore}
                      onSave={(home, away, finished) => handleSaveScore(selectedMatch.id, home, away, finished)}
                    />
                  )}

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

                  {/* Bulk action buttons */}
                  {(pendingCount > 0 || openCount > 0) && (
                    <div className="flex gap-2">
                      {pendingCount > 0 && (
                        <button
                          onClick={handleOpenAllPending}
                          disabled={openingAll}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-btn bg-lt-green/15 border border-lt-green/40 text-lt-green font-condensed text-sm font-700 hover:bg-lt-green/25 transition-colors disabled:opacity-50"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                          {openingAll ? 'Abriendo…' : `Abrir todas (${pendingCount})`}
                        </button>
                      )}
                      {openCount > 0 && (
                        <button
                          onClick={handleCloseAllOpen}
                          disabled={closingAll}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-btn bg-lt-amber/15 border border-lt-amber/40 text-lt-amber font-condensed text-sm font-700 hover:bg-lt-amber/25 transition-colors disabled:opacity-50"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" />
                          </svg>
                          {closingAll ? 'Cerrando…' : `Cerrar todas (${openCount})`}
                        </button>
                      )}
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
                        Genera preguntas desde una plantilla o créalas manualmente
                      </p>
                      <div className="flex gap-2 justify-center mt-4">
                        <button
                          onClick={() => setShowGenerateQuestions(true)}
                          className="px-5 py-2.5 rounded-btn bg-lt-amber/15 border border-lt-amber/40 text-lt-amber font-condensed text-sm font-700"
                        >
                          ⚡ Generar desde plantilla
                        </button>
                        <button
                          onClick={() => setShowAddQuestion(true)}
                          className="px-5 py-2.5 rounded-btn bg-lt-green text-lt-black font-condensed text-sm font-700"
                        >
                          + Manual
                        </button>
                      </div>
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

          {/* ── TAB: Customize ─────────────────────────────────────────── */}
          {activeTab === 'customize' && (
            <motion.div
              key="customize-tab"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.18 }}
            >
              <CustomizeTab
                leagueId={leagueId}
                initialBannerUrl={initialBannerUrl}
                initialThemeColor={initialThemeColor}
              />
            </motion.div>
          )}

          {/* ── TAB: Settings ──────────────────────────────────────────── */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings-tab"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.18 }}
            >
              <SettingsTab
                leagueId={leagueId}
                initialName={leagueName}
                initialDescription={leagueDescription}
                initialMaxMembers={leagueMaxMembers}
                initialAllowRemote={leagueAllowRemote}
                initialAllowMemberInvites={leagueAllowMemberInvites}
                initialScoringMode={leagueScoringMode}
                initialMatchMode={leagueMatchMode}
                initialLeagueType={leagueType}
                hasLinkedBusiness={hasLinkedBusiness}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <AddMatchModal
        leagueId={leagueId}
        open={showAddMatch}
        onClose={() => { setShowAddMatch(false); setEditMatch(null) }}
        onCreated={editMatch ? handleMatchEdited : handleMatchCreated}
        editMatch={editMatch}
      />

      <ImportMatchesModal
        leagueId={leagueId}
        open={showImportMatches}
        onClose={() => setShowImportMatches(false)}
        onImported={handleMatchesImported}
      />

      {selectedMatch && (
        <>
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
          <GenerateQuestionsModal
            leagueId={leagueId}
            matchId={selectedMatch.id}
            homeTeam={selectedMatch.homeTeam}
            awayTeam={selectedMatch.awayTeam}
            open={showGenerateQuestions}
            onClose={() => setShowGenerateQuestions(false)}
            onGenerated={handleQuestionsGenerated}
          />
        </>
      )}
    </div>
  )
}

// ── ScoreInput ──────────────────────────────────────────────────────────────

function ScoreInput({ match, saving, onSave }: {
  match: MatchRow
  saving: boolean
  onSave: (home: number, away: number, markFinished: boolean) => void
}) {
  const [homeScore, setHomeScore] = useState(match.homeScore ?? 0)
  const [awayScore, setAwayScore] = useState(match.awayScore ?? 0)
  const isFinished = match.status === 'FINISHED'

  return (
    <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4">
      <p className="font-condensed text-xs text-lt-muted2 uppercase tracking-wide mb-3">
        Marcador {isFinished && <span className="text-lt-green ml-1">· Finalizado</span>}
      </p>
      <div className="flex items-center gap-3 justify-center">
        <span className="font-condensed text-sm font-700 text-lt-white text-right flex-1 truncate">
          {match.homeTeam}
        </span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={homeScore}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '')
            setHomeScore(v === '' ? 0 : Math.min(99, Number(v)))
          }}
          className="w-14 text-center font-bebas text-2xl text-lt-white bg-lt-card2 border border-[rgba(255,255,255,0.15)] rounded-btn py-1 focus:border-lt-green outline-none [appearance:textfield]"
        />
        <span className="font-bebas text-xl text-lt-muted2">-</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={awayScore}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '')
            setAwayScore(v === '' ? 0 : Math.min(99, Number(v)))
          }}
          className="w-14 text-center font-bebas text-2xl text-lt-white bg-lt-card2 border border-[rgba(255,255,255,0.15)] rounded-btn py-1 focus:border-lt-green outline-none [appearance:textfield]"
        />
        <span className="font-condensed text-sm font-700 text-lt-white flex-1 truncate">
          {match.awayTeam}
        </span>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onSave(homeScore, awayScore, false)}
          disabled={saving}
          className="flex-1 py-2 rounded-btn bg-lt-card2 border border-[rgba(255,255,255,0.07)] text-lt-white font-condensed text-sm font-700 hover:border-lt-green/30 transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar marcador'}
        </button>
        {!isFinished && (
          <button
            onClick={() => {
              if (confirm(`¿Finalizar ${match.homeTeam} ${homeScore} - ${awayScore} ${match.awayTeam}?`)) {
                onSave(homeScore, awayScore, true)
              }
            }}
            disabled={saving}
            className="flex-1 py-2 rounded-btn bg-lt-green text-lt-black font-condensed text-sm font-700 active:scale-95 transition-all disabled:opacity-50"
          >
            Finalizar partido
          </button>
        )}
      </div>
    </div>
  )
}
