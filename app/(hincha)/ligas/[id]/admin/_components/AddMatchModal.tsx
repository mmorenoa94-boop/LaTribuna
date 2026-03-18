'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface Props {
  leagueId: string
  open: boolean
  onClose: () => void
  onCreated: (match: MatchRow) => void
  editMatch?: MatchRow | null
}

export interface MatchRow {
  id: string
  homeTeam: string
  awayTeam: string
  competition: string
  venue: string | null
  kickoffAt: string
  status: string
  questionCount: number
}

// ── Ligas populares ───────────────────────────────────────────────────────────
const POPULAR_LEAGUES = [
  { id: 0,   name: 'Todas',                flag: '🌐' },
  { id: 239, name: 'Liga BetPlay',         flag: '🇨🇴' },
  { id: 240, name: 'Copa Colombia',        flag: '🇨🇴' },
  { id: 2,   name: 'Champions League',    flag: '🏆' },
  { id: 3,   name: 'Europa League',       flag: '🏆' },
  { id: 128, name: 'Liga Argentina',      flag: '🇦🇷' },
  { id: 71,  name: 'Brasileirao',         flag: '🇧🇷' },
  { id: 140, name: 'La Liga',             flag: '🇪🇸' },
  { id: 39,  name: 'Premier League',      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
]

const STATUS_SHORT_MAP: Record<string, { label: string; color: string }> = {
  NS:  { label: 'Programado', color: 'text-lt-muted2' },
  '1H': { label: 'En vivo',   color: 'text-lt-red' },
  HT:  { label: 'Descanso',   color: 'text-lt-amber' },
  '2H': { label: 'En vivo',   color: 'text-lt-red' },
  ET:  { label: 'Prórroga',   color: 'text-lt-red' },
  FT:  { label: 'Finalizado', color: 'text-lt-muted' },
  CANC: { label: 'Cancelado', color: 'text-lt-red' },
  TBD: { label: 'Por definir', color: 'text-lt-muted2' },
}

interface ApiResult {
  externalId: string
  homeTeam: string
  awayTeam: string
  homeLogo: string | null
  awayLogo: string | null
  competition: string
  country: string
  leagueId: number
  venue: string | null
  kickoffAt: string
  statusShort: string
  alreadyImported: boolean
}

const COMPETITIONS_MANUAL = [
  'Liga BetPlay Dimayor', 'Copa Colombia', 'Superliga Colombia',
  'Copa Libertadores', 'Copa Sudamericana', 'Champions League',
  'Liga España', 'Premier League', 'Selección Colombia', 'Otro',
]

export function AddMatchModal({ leagueId, open, onClose, onCreated, editMatch }: Props) {
  const [tab, setTab] = useState<'search' | 'manual'>('search')

  // ── Search state ──────────────────────────────────────────────────────────
  const [searchDate, setSearchDate]         = useState(() =>
    new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
  )
  const [selectedLeague, setSelectedLeague] = useState(0) // 0 = todas
  const [fixtures, setFixtures]             = useState<ApiResult[]>([])
  const [loadingSearch, setLoadingSearch]   = useState(false)
  const [searchError, setSearchError]       = useState('')
  const [importingId, setImportingId]       = useState<string | null>(null)

  // ── Manual state ──────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    homeTeam: '', awayTeam: '', competition: 'Liga BetPlay Dimayor',
    venue: '', kickoffAt: '',
  })
  const [manualLoading, setManualLoading] = useState(false)
  const [manualError, setManualError]     = useState('')

  // When opening in edit mode, switch to manual tab and pre-fill
  useEffect(() => {
    if (open && editMatch) {
      setTab('manual')
      const kickoffLocal = new Date(editMatch.kickoffAt)
      const offset = kickoffLocal.getTimezoneOffset()
      const local = new Date(kickoffLocal.getTime() - offset * 60000)
      setForm({
        homeTeam: editMatch.homeTeam,
        awayTeam: editMatch.awayTeam,
        competition: editMatch.competition,
        venue: editMatch.venue ?? '',
        kickoffAt: local.toISOString().slice(0, 16),
      })
    } else if (open && !editMatch) {
      setTab('search')
      setForm({ homeTeam: '', awayTeam: '', competition: 'Liga BetPlay Dimayor', venue: '', kickoffAt: '' })
    }
  }, [open, editMatch])

  // Auto-search when tab opens or date/league changes
  useEffect(() => {
    if (open && tab === 'search' && !editMatch) doSearch()
  }, [open, searchDate, selectedLeague, tab])

  async function doSearch() {
    setLoadingSearch(true)
    setSearchError('')
    try {
      const params = new URLSearchParams({ date: searchDate })
      if (selectedLeague) params.set('leagueId', String(selectedLeague))
      const res = await fetch(`/api/fixtures/search?${params}`)
      const data = await res.json()
      if (!res.ok) { setSearchError(data.error ?? 'Error'); return }
      setFixtures(data.fixtures ?? [])
    } catch {
      setSearchError('Error al conectar con API-Football')
    } finally {
      setLoadingSearch(false)
    }
  }

  async function importFixture(f: ApiResult) {
    setImportingId(f.externalId)
    try {
      const res = await fetch('/api/fixtures/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalId: f.externalId,
          leagueId,
          date: searchDate,
          season: new Date(f.kickoffAt).getFullYear(),
        }),
      })
      if (res.ok) {
        const match = await res.json()
        onCreated(match)
      }
    } finally {
      setImportingId(null)
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.homeTeam.trim() || !form.awayTeam.trim() || !form.kickoffAt) {
      setManualError('Completa los campos obligatorios')
      return
    }
    setManualLoading(true)
    setManualError('')
    try {
      const url = editMatch
        ? `/api/leagues/${leagueId}/admin/matches/${editMatch.id}`
        : `/api/leagues/${leagueId}/admin/matches`
      const res = await fetch(url, {
        method: editMatch ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json()
        setManualError(d.error ?? (editMatch ? 'Error al editar' : 'Error al crear el partido'))
        return
      }
      const match = await res.json()
      onCreated({ ...match, questionCount: editMatch?.questionCount ?? 0 })
      if (!editMatch) {
        setForm({ homeTeam: '', awayTeam: '', competition: 'Liga BetPlay Dimayor', venue: '', kickoffAt: '' })
      }
    } finally {
      setManualLoading(false)
    }
  }

  function formatKickoff(iso: string) {
    return new Date(iso).toLocaleTimeString('es-CO', {
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota',
    })
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-[60]"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="fixed bottom-0 left-0 right-0 bg-lt-card rounded-t-2xl z-[70] flex flex-col max-h-[94vh]"
          >
            {/* Handle */}
            <div className="flex-shrink-0 flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-lt-muted" />
            </div>

            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 pb-3">
              <h2 className="font-bebas text-2xl text-lt-white tracking-wide">{editMatch ? 'Editar partido' : 'Agregar partido'}</h2>
              <button onClick={onClose} className="text-lt-muted2 hover:text-lt-white p-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Tabs (hide when editing) */}
            {!editMatch && <div className="flex-shrink-0 flex gap-1 px-5 mb-3">
              {(['search', 'manual'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'flex-1 py-2 rounded-btn font-condensed text-sm font-700 transition-all',
                    tab === t
                      ? 'bg-lt-green text-lt-black'
                      : 'bg-lt-card2 text-lt-muted2 hover:text-lt-white'
                  )}
                >
                  {t === 'search' ? '🔍 Buscar partido' : '✏️ Manual'}
                </button>
              ))}
            </div>}

            {/* ── SEARCH TAB ────────────────────────────────────────────────── */}
            {tab === 'search' && (
              <div className="flex flex-col overflow-hidden flex-1">
                {/* Filters */}
                <div className="flex-shrink-0 px-5 pb-3 flex gap-2">
                  <input
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="flex-1 bg-lt-card2 border border-[rgba(255,255,255,0.07)] rounded-btn px-3 py-2 text-lt-white font-condensed text-sm focus:outline-none focus:border-lt-green/50 [color-scheme:dark]"
                  />
                  <button
                    onClick={doSearch}
                    disabled={loadingSearch}
                    className="px-3 py-2 bg-lt-green/15 border border-lt-green/40 rounded-btn text-lt-green font-condensed text-sm hover:bg-lt-green/25 disabled:opacity-50"
                  >
                    {loadingSearch ? '...' : '↻'}
                  </button>
                </div>

                {/* League filter pills */}
                <div className="flex-shrink-0 px-5 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
                  {POPULAR_LEAGUES.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setSelectedLeague(l.id)}
                      className={cn(
                        'flex-shrink-0 px-3 py-1.5 rounded-full font-condensed text-xs border transition-all whitespace-nowrap',
                        selectedLeague === l.id
                          ? 'bg-lt-green/15 border-lt-green text-lt-green'
                          : 'bg-lt-card2 border-[rgba(255,255,255,0.07)] text-lt-muted2 hover:border-lt-green/30'
                      )}
                    >
                      {l.flag} {l.name}
                    </button>
                  ))}
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto px-5 pb-6">
                  {loadingSearch ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-2 border-lt-green/30 border-t-lt-green rounded-full animate-spin" />
                    </div>
                  ) : searchError ? (
                    <div className="text-center py-8">
                      <p className="text-lt-red font-condensed text-sm">{searchError}</p>
                    </div>
                  ) : fixtures.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-2xl mb-2">⚽</p>
                      <p className="font-condensed text-sm text-lt-muted2">
                        No hay partidos para este día
                      </p>
                      <p className="font-condensed text-xs text-lt-muted mt-1">
                        Prueba otra fecha o usa el modo Manual
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {/* Competition groups */}
                      {Object.entries(
                        fixtures.reduce<Record<string, ApiResult[]>>((acc, f) => {
                          const key = `${f.competition} (${f.country})`
                          if (!acc[key]) acc[key] = []
                          acc[key].push(f)
                          return acc
                        }, {})
                      ).map(([comp, matches]) => (
                        <div key={comp}>
                          <p className="font-condensed text-xs text-lt-muted2 uppercase tracking-wide py-2">
                            {comp}
                          </p>
                          <div className="flex flex-col gap-2">
                            {matches.map((f) => {
                              const st = STATUS_SHORT_MAP[f.statusShort] ?? { label: f.statusShort, color: 'text-lt-muted2' }
                              const isImporting = importingId === f.externalId
                              return (
                                <div
                                  key={f.externalId}
                                  className={cn(
                                    'bg-lt-card2 rounded-card border p-3 flex items-center gap-3',
                                    f.alreadyImported
                                      ? 'border-lt-green/30 opacity-60'
                                      : 'border-[rgba(255,255,255,0.07)]'
                                  )}
                                >
                                  {/* Teams */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      {f.homeLogo && (
                                        <Image src={f.homeLogo} alt="" width={20} height={20} className="object-contain flex-shrink-0" />
                                      )}
                                      <span className="font-condensed text-sm text-lt-white truncate">{f.homeTeam}</span>
                                      <span className="font-bebas text-sm text-lt-muted2 flex-shrink-0">VS</span>
                                      <span className="font-condensed text-sm text-lt-white truncate">{f.awayTeam}</span>
                                      {f.awayLogo && (
                                        <Image src={f.awayLogo} alt="" width={20} height={20} className="object-contain flex-shrink-0" />
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className={cn('font-condensed text-xs', st.color)}>{st.label}</span>
                                      <span className="text-lt-muted2 font-condensed text-xs">·</span>
                                      <span className="font-condensed text-xs text-lt-muted2">{formatKickoff(f.kickoffAt)}</span>
                                      {f.venue && (
                                        <>
                                          <span className="text-lt-muted2 font-condensed text-xs">·</span>
                                          <span className="font-condensed text-xs text-lt-muted2 truncate">{f.venue}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* Import button */}
                                  <button
                                    onClick={() => !f.alreadyImported && importFixture(f)}
                                    disabled={f.alreadyImported || isImporting}
                                    className={cn(
                                      'flex-shrink-0 px-3 py-2 rounded-btn font-condensed text-xs font-700 transition-all',
                                      f.alreadyImported
                                        ? 'bg-lt-green/10 text-lt-green border border-lt-green/30 cursor-default'
                                        : 'bg-lt-green text-lt-black hover:bg-lt-green/90 active:scale-95 disabled:opacity-50'
                                    )}
                                  >
                                    {isImporting ? '...' : f.alreadyImported ? '✓ Ya' : '+ Agregar'}
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── MANUAL TAB ────────────────────────────────────────────────── */}
            {tab === 'manual' && (
              <form onSubmit={handleManualSubmit} className="overflow-y-auto flex-1 px-5 pb-6 flex flex-col gap-4">
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
                  <div>
                    <label className="block font-condensed text-xs text-lt-muted2 uppercase tracking-wide mb-1.5">Local *</label>
                    <input
                      value={form.homeTeam}
                      onChange={(e) => setForm((f) => ({ ...f, homeTeam: e.target.value }))}
                      placeholder="América de Cali"
                      className="w-full bg-lt-card2 border border-[rgba(255,255,255,0.07)] rounded-btn px-3 py-2.5 text-lt-white font-condensed text-sm placeholder:text-lt-muted focus:outline-none focus:border-lt-green/50"
                    />
                  </div>
                  <span className="font-bebas text-xl text-lt-muted2 pb-2">VS</span>
                  <div>
                    <label className="block font-condensed text-xs text-lt-muted2 uppercase tracking-wide mb-1.5">Visitante *</label>
                    <input
                      value={form.awayTeam}
                      onChange={(e) => setForm((f) => ({ ...f, awayTeam: e.target.value }))}
                      placeholder="Junior FC"
                      className="w-full bg-lt-card2 border border-[rgba(255,255,255,0.07)] rounded-btn px-3 py-2.5 text-lt-white font-condensed text-sm placeholder:text-lt-muted focus:outline-none focus:border-lt-green/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-condensed text-xs text-lt-muted2 uppercase tracking-wide mb-1.5">Competencia *</label>
                  <select
                    value={form.competition}
                    onChange={(e) => setForm((f) => ({ ...f, competition: e.target.value }))}
                    className="w-full bg-lt-card2 border border-[rgba(255,255,255,0.07)] rounded-btn px-3 py-2.5 text-lt-white font-condensed text-sm focus:outline-none focus:border-lt-green/50 appearance-none"
                  >
                    {COMPETITIONS_MANUAL.map((c) => <option key={c} value={c} className="bg-lt-card">{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-condensed text-xs text-lt-muted2 uppercase tracking-wide mb-1.5">Fecha y hora *</label>
                  <input
                    type="datetime-local"
                    value={form.kickoffAt}
                    onChange={(e) => setForm((f) => ({ ...f, kickoffAt: e.target.value }))}
                    className="w-full bg-lt-card2 border border-[rgba(255,255,255,0.07)] rounded-btn px-3 py-2.5 text-lt-white font-condensed text-sm focus:outline-none focus:border-lt-green/50 [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block font-condensed text-xs text-lt-muted2 uppercase tracking-wide mb-1.5">
                    Estadio <span className="normal-case font-400">(opcional)</span>
                  </label>
                  <input
                    value={form.venue}
                    onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
                    placeholder="Estadio Pascual Guerrero"
                    className="w-full bg-lt-card2 border border-[rgba(255,255,255,0.07)] rounded-btn px-3 py-2.5 text-lt-white font-condensed text-sm placeholder:text-lt-muted focus:outline-none focus:border-lt-green/50"
                  />
                </div>

                {manualError && (
                  <p className="font-condensed text-sm text-lt-red bg-lt-red/10 border border-lt-red/30 rounded-btn px-3 py-2">
                    {manualError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={manualLoading}
                  className="w-full py-3.5 rounded-btn bg-lt-green text-lt-black font-condensed text-base font-700 disabled:opacity-50 active:scale-[0.98] transition-all"
                  style={{ marginBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}
                >
                  {manualLoading ? (editMatch ? 'Guardando…' : 'Creando…') : (editMatch ? 'Guardar cambios' : 'Agregar partido')}
                </button>
              </form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
