'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LeagueInfo {
  id: string
  name: string
  status: string
  consumptionVerified: boolean
  totalPoints: number
  joinedAt: string
}

interface AudienceMember {
  id: string
  name: string
  email: string
  phone: string | null
  city: string | null
  favoriteTeam: string | null
  image: string | null
  registeredAt: string
  leagues: LeagueInfo[]
}

interface LeagueOption {
  id: string
  name: string
}

export default function AudienciaPage() {
  const [audience, setAudience] = useState<AudienceMember[]>([])
  const [leagues, setLeagues] = useState<LeagueOption[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [leagueFilter, setLeagueFilter] = useState('')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  const fetchAudience = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (leagueFilter) params.set('league', leagueFilter)
    try {
      const res = await fetch(`/api/businesses/me/audience?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAudience(data.audience)
        setLeagues(data.leagues)
        setTotal(data.total)
      }
    } finally {
      setLoading(false)
    }
  }, [search, leagueFilter])

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(fetchAudience, 300) // debounce search
    return () => clearTimeout(timer)
  }, [fetchAudience])

  return (
    <div className="px-4 md:px-8 pt-4 md:pt-8 space-y-5 animate-fade-in max-w-3xl pb-24 md:pb-8">
      {/* Header */}
      <div>
        <p className="text-lt-muted2 text-sm font-condensed">CRM</p>
        <h1 className="text-lt-white font-bebas text-3xl leading-tight">Audiencia</h1>
        <p className="text-lt-muted2 font-barlow text-sm mt-1">
          Todos los participantes de tus ligas en un solo lugar
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-3 text-center">
          <p className="font-bebas text-2xl text-lt-amber">{total}</p>
          <p className="font-condensed text-[10px] text-lt-muted2 uppercase">Personas</p>
        </div>
        <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-3 text-center">
          <p className="font-bebas text-2xl text-lt-white">{leagues.length}</p>
          <p className="font-condensed text-[10px] text-lt-muted2 uppercase">Ligas</p>
        </div>
        <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-3 text-center">
          <p className="font-bebas text-2xl text-lt-green">
            {audience.filter((u) => u.leagues.some((l) => l.consumptionVerified)).length}
          </p>
          <p className="font-condensed text-[10px] text-lt-muted2 uppercase">Verificados</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lt-muted2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, correo o teléfono..."
            className="w-full bg-lt-card border border-lt-muted rounded-btn pl-9 pr-4 py-2.5 text-lt-white font-barlow text-sm focus:outline-none focus:border-lt-amber transition-colors placeholder:text-lt-muted2"
          />
        </div>
        {leagues.length > 1 && (
          <select
            value={leagueFilter}
            onChange={(e) => setLeagueFilter(e.target.value)}
            className="bg-lt-card border border-lt-muted rounded-btn px-3 py-2.5 text-lt-white font-condensed text-sm focus:outline-none focus:border-lt-amber transition-colors"
          >
            <option value="">Todas las ligas</option>
            {leagues.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12">
          <span className="w-6 h-6 border-2 border-lt-amber/30 border-t-lt-amber rounded-full animate-spin inline-block" />
        </div>
      ) : audience.length === 0 ? (
        <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-8 text-center">
          <span className="text-3xl block mb-2">👥</span>
          <p className="font-condensed text-sm text-lt-white font-700">
            {search || leagueFilter ? 'Sin resultados' : 'Sin participantes aún'}
          </p>
          <p className="text-lt-muted2 font-barlow text-xs mt-1">
            {search || leagueFilter
              ? 'Intenta con otro término de búsqueda'
              : 'Los miembros aparecerán cuando se unan a tus ligas'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {audience.map((member) => (
            <div
              key={member.id}
              className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] overflow-hidden transition-all"
            >
              {/* Main row */}
              <button
                onClick={() => setExpandedUser(expandedUser === member.id ? null : member.id)}
                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-lt-card2/50 transition-colors"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-lt-card2 border border-[rgba(255,255,255,0.1)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {member.image ? (
                    <Image src={member.image} alt={member.name} width={36} height={36} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bebas text-sm text-lt-muted2">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-condensed text-sm text-lt-white font-600 truncate">{member.name}</p>
                  <p className="font-barlow text-xs text-lt-muted2 truncate">{member.email}</p>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {member.leagues.some((l) => l.consumptionVerified) && (
                    <span className="bg-lt-green/15 text-lt-green border border-lt-green/25 font-condensed text-[10px] font-700 px-1.5 py-0.5 rounded-full">
                      ✓
                    </span>
                  )}
                  <span className="bg-lt-card2 text-lt-muted2 font-condensed text-[10px] px-1.5 py-0.5 rounded-full">
                    {member.leagues.length} {member.leagues.length === 1 ? 'liga' : 'ligas'}
                  </span>
                </div>

                {/* Chevron */}
                <svg
                  className={cn(
                    'w-4 h-4 text-lt-muted2 transition-transform flex-shrink-0',
                    expandedUser === member.id && 'rotate-180'
                  )}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded detail */}
              {expandedUser === member.id && (
                <div className="px-4 pb-4 pt-1 border-t border-[rgba(255,255,255,0.05)] space-y-3 animate-fade-in">
                  {/* Contact info */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <DetailItem label="Correo" value={member.email} />
                    <DetailItem label="Teléfono" value={member.phone ?? '—'} />
                    <DetailItem label="Ciudad" value={member.city ?? '—'} />
                    <DetailItem label="Equipo" value={member.favoriteTeam ?? '—'} />
                    <DetailItem
                      label="Registrado"
                      value={new Date(member.registeredAt).toLocaleDateString('es-CO', {
                        day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Bogota',
                      })}
                    />
                  </div>

                  {/* Leagues */}
                  <div>
                    <p className="font-condensed text-xs text-lt-muted2 uppercase tracking-wide mb-1.5">Ligas</p>
                    <div className="space-y-1.5">
                      {member.leagues.map((l) => (
                        <div
                          key={l.id}
                          className="flex items-center justify-between bg-lt-card2/50 rounded-btn px-3 py-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-condensed text-xs text-lt-white font-600 truncate">{l.name}</span>
                            <span className={cn(
                              'font-condensed text-[10px] font-700 px-1.5 py-0.5 rounded-full border',
                              l.status === 'APPROVED'
                                ? 'text-lt-green bg-lt-green/10 border-lt-green/20'
                                : l.status === 'PENDING'
                                ? 'text-lt-amber bg-lt-amber/10 border-lt-amber/20'
                                : 'text-lt-red bg-lt-red/10 border-lt-red/20'
                            )}>
                              {l.status === 'APPROVED' ? 'Aprobado' : l.status === 'PENDING' ? 'Pendiente' : 'Rechazado'}
                            </span>
                            {l.consumptionVerified && (
                              <span className="font-condensed text-[10px] text-blue-400 bg-blue-400/10 border border-blue-400/20 px-1.5 py-0.5 rounded-full">
                                Consumo ✓
                              </span>
                            )}
                          </div>
                          <span className="font-condensed text-xs text-lt-amber font-700 flex-shrink-0">
                            {l.totalPoints} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-condensed text-[10px] text-lt-muted2 uppercase tracking-wide">{label}</p>
      <p className="font-barlow text-sm text-lt-white truncate">{value}</p>
    </div>
  )
}
