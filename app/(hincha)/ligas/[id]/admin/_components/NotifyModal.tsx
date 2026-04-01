'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ParticipationMember {
  userId: string
  userName: string | null
  userImage: string | null
  totalQuestions: number
  answeredCount: number
  missingCount: number
  answeredAll: boolean
}

interface ParticipationData {
  totalMembers: number
  respondedCount: number
  missingCount: number
  responded: ParticipationMember[]
  missing: ParticipationMember[]
}

interface Props {
  leagueId: string
  matchId: string
  matchLabel: string
  open: boolean
  onClose: () => void
}

type Tab = 'participation' | 'reminder' | 'mass'

export function NotifyModal({ leagueId, matchId, matchLabel, open, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('participation')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [data, setData] = useState<ParticipationData | null>(null)
  const [message, setMessage] = useState('')
  const [massTitle, setMassTitle] = useState('')
  const [massMessage, setMassMessage] = useState('')
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!open || !matchId) return
    setLoading(true)
    setResult(null)
    fetch(`/api/leagues/${leagueId}/admin/participation?matchId=${matchId}`)
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [open, leagueId, matchId])

  async function handleSendReminder() {
    if (sending || !message.trim()) return
    setSending(true)
    setResult(null)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/admin/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reminder',
          matchId,
          message: message.trim(),
          targetUserIds: data?.missing.map((m) => m.userId),
        }),
      })
      const json = await res.json()
      if (res.ok) {
        setResult({ type: 'success', text: json.message || `Recordatorio enviado a ${json.sent} miembros (${json.pushDelivered ?? 0} push)` })
        setMessage('')
      } else {
        setResult({ type: 'error', text: json.error || 'Error al enviar' })
      }
    } catch {
      setResult({ type: 'error', text: 'Error de conexión' })
    } finally {
      setSending(false)
    }
  }

  async function handleSendMass() {
    if (sending || !massMessage.trim()) return
    setSending(true)
    setResult(null)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/admin/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'mass',
          title: massTitle.trim() || undefined,
          message: massMessage.trim(),
        }),
      })
      const json = await res.json()
      if (res.ok) {
        setResult({ type: 'success', text: json.message || `Notificación enviada a ${json.sent} miembros (${json.pushDelivered ?? 0} push)` })
        setMassTitle('')
        setMassMessage('')
      } else {
        setResult({ type: 'error', text: json.error || 'Error al enviar' })
      }
    } catch {
      setResult({ type: 'error', text: 'Error de conexión' })
    } finally {
      setSending(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop — only visible on desktop behind the centered modal */}
      <div className="absolute inset-0 bg-black/70 sm:block hidden" onClick={onClose} />

      {/* Full-screen on mobile, centered modal on desktop */}
      <div className="relative flex flex-col w-full h-full sm:h-auto sm:max-h-[80vh] sm:max-w-lg sm:m-auto sm:rounded-2xl bg-lt-dark sm:bg-lt-card sm:border sm:border-[rgba(255,255,255,0.1)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.07)] flex-shrink-0 bg-lt-card">
          <div className="min-w-0">
            <h3 className="font-bebas text-xl text-lt-white tracking-wide">Notificaciones</h3>
            <p className="font-condensed text-xs text-lt-muted2 truncate">{matchLabel}</p>
          </div>
          <button onClick={onClose} className="p-2 -mr-1 text-lt-muted2 hover:text-lt-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[rgba(255,255,255,0.07)] flex-shrink-0 bg-lt-card">
          {([
            { key: 'participation' as Tab, label: 'Participación', icon: '📊' },
            { key: 'reminder' as Tab, label: 'Recordatorio', icon: '⏰' },
            { key: 'mass' as Tab, label: 'Mensaje', icon: '📢' },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key); setResult(null) }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 font-condensed text-sm font-700 border-b-2 transition-all',
                activeTab === t.key
                  ? 'text-lt-green border-lt-green'
                  : 'text-lt-muted2 border-transparent hover:text-lt-white'
              )}
            >
              <span className="text-xs">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Result message */}
          {result && (
            <div className={cn(
              'mb-4 px-3 py-2 rounded-btn border font-condensed text-sm',
              result.type === 'success'
                ? 'text-lt-green bg-lt-green/10 border-lt-green/30'
                : 'text-lt-red bg-lt-red/10 border-lt-red/30'
            )}>
              {result.text}
            </div>
          )}

          {/* ── TAB: Participation ────────────────────────── */}
          {activeTab === 'participation' && (
            loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-lt-green/30 border-t-lt-green rounded-full animate-spin" />
              </div>
            ) : data ? (
              <div className="flex flex-col gap-4">
                <div className="flex gap-3">
                  <div className="flex-1 bg-lt-card rounded-card p-3 text-center border border-[rgba(255,255,255,0.07)]">
                    <p className="font-bebas text-2xl text-lt-white">{data.totalMembers}</p>
                    <p className="font-condensed text-xs text-lt-muted2">Miembros</p>
                  </div>
                  <div className="flex-1 bg-lt-card rounded-card p-3 text-center border border-lt-green/20">
                    <p className="font-bebas text-2xl text-lt-green">{data.respondedCount}</p>
                    <p className="font-condensed text-xs text-lt-muted2">Respondieron</p>
                  </div>
                  <div className="flex-1 bg-lt-card rounded-card p-3 text-center border border-lt-amber/20">
                    <p className="font-bebas text-2xl text-lt-amber">{data.missingCount}</p>
                    <p className="font-condensed text-xs text-lt-muted2">Faltan</p>
                  </div>
                </div>

                {data.totalMembers > 0 && (
                  <div className="w-full bg-lt-card2 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-lt-green rounded-full transition-all duration-500"
                      style={{ width: `${(data.respondedCount / data.totalMembers) * 100}%` }}
                    />
                  </div>
                )}

                {data.missing.length > 0 && (
                  <div>
                    <p className="font-condensed text-xs text-lt-amber uppercase tracking-wide mb-2">
                      No han respondido ({data.missing.length})
                    </p>
                    <div className="flex flex-col gap-2">
                      {data.missing.map((m) => (
                        <div key={m.userId} className="flex items-center gap-3 bg-lt-card rounded-card p-3 border border-lt-amber/15">
                          {m.userImage ? (
                            <Image src={m.userImage} alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-lt-amber/20 flex items-center justify-center text-lt-amber font-condensed text-sm font-700">
                              {(m.userName?.[0] ?? '?').toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-condensed text-sm text-lt-white truncate">{m.userName ?? 'Sin nombre'}</p>
                            <p className="font-condensed text-xs text-lt-amber">
                              {m.answeredCount}/{m.totalQuestions} respondidas
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.responded.length > 0 && (
                  <div>
                    <p className="font-condensed text-xs text-lt-green uppercase tracking-wide mb-2">
                      Ya respondieron ({data.responded.length})
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {data.responded.map((m) => (
                        <div key={m.userId} className="flex items-center gap-3 bg-lt-card/50 rounded-card p-2.5 border border-lt-green/10">
                          {m.userImage ? (
                            <Image src={m.userImage} alt="" width={28} height={28} className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-lt-green/15 flex items-center justify-center text-lt-green font-condensed text-xs font-700">
                              {(m.userName?.[0] ?? '?').toUpperCase()}
                            </div>
                          )}
                          <p className="font-condensed text-sm text-lt-muted2 truncate">{m.userName ?? 'Sin nombre'}</p>
                          <span className="ml-auto font-condensed text-xs text-lt-green">✓</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-lt-muted2 font-condensed text-sm text-center py-8">
                No se pudieron cargar los datos
              </p>
            )
          )}

          {/* ── TAB: Reminder ─────────────────────────────── */}
          {activeTab === 'reminder' && (
            <div className="flex flex-col gap-4">
              <div className="bg-lt-amber/10 border border-lt-amber/30 rounded-card p-3">
                <p className="font-condensed text-sm text-lt-amber font-700">⏰ Recordatorio para no-respondedores</p>
                <p className="font-condensed text-xs text-lt-muted2 mt-1">
                  Se enviará notificación in-app a quienes no hayan respondido todas las preguntas de este partido. La verán en su pantalla de inicio y en notificaciones.
                </p>
                {data && data.missingCount > 0 && (
                  <p className="font-condensed text-xs text-lt-amber mt-1.5">
                    {data.missingCount} miembro{data.missingCount !== 1 ? 's' : ''} sin responder
                  </p>
                )}
                {data && data.missingCount === 0 && (
                  <p className="font-condensed text-xs text-lt-green mt-1.5">
                    ✓ Todos los miembros ya respondieron
                  </p>
                )}
              </div>

              <div>
                <label className="block font-condensed text-xs text-lt-muted2 uppercase tracking-wide mb-1.5">
                  Mensaje del recordatorio
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="¡Faltan pocas horas para el cierre! Responde las preguntas antes de que sea tarde."
                  className="w-full bg-lt-card border border-[rgba(255,255,255,0.15)] rounded-btn px-3 py-2.5 font-barlow text-sm text-lt-white placeholder:text-lt-muted resize-none focus:border-lt-amber outline-none"
                  rows={3}
                  maxLength={280}
                />
                <p className="font-condensed text-xs text-lt-muted text-right mt-1">{message.length}/280</p>
              </div>
            </div>
          )}

          {/* ── TAB: Mass message ─────────────────────────── */}
          {activeTab === 'mass' && (
            <div className="flex flex-col gap-4">
              <div className="bg-lt-blue/10 border border-lt-blue/30 rounded-card p-3">
                <p className="font-condensed text-sm text-lt-blue font-700">📢 Mensaje masivo</p>
                <p className="font-condensed text-xs text-lt-muted2 mt-1">
                  Se enviará a todos los miembros de la liga (excepto tú). Lo verán en su pantalla de inicio y en notificaciones.
                </p>
              </div>

              <div>
                <label className="block font-condensed text-xs text-lt-muted2 uppercase tracking-wide mb-1.5">
                  Título (opcional)
                </label>
                <input
                  value={massTitle}
                  onChange={(e) => setMassTitle(e.target.value)}
                  placeholder="Ejemplo: Instrucciones para la jornada"
                  className="w-full bg-lt-card border border-[rgba(255,255,255,0.15)] rounded-btn px-3 py-2.5 font-barlow text-sm text-lt-white placeholder:text-lt-muted focus:border-lt-blue outline-none"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block font-condensed text-xs text-lt-muted2 uppercase tracking-wide mb-1.5">
                  Mensaje
                </label>
                <textarea
                  value={massMessage}
                  onChange={(e) => setMassMessage(e.target.value)}
                  placeholder="Escribe tu mensaje para todos los miembros..."
                  className="w-full bg-lt-card border border-[rgba(255,255,255,0.15)] rounded-btn px-3 py-2.5 font-barlow text-sm text-lt-white placeholder:text-lt-muted resize-none focus:border-lt-blue outline-none"
                  rows={3}
                  maxLength={500}
                />
                <p className="font-condensed text-xs text-lt-muted text-right mt-1">{massMessage.length}/500</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Sticky action button at bottom ──────────────── */}
        {activeTab === 'reminder' && (
          <div className="flex-shrink-0 px-4 py-3 border-t border-[rgba(255,255,255,0.07)] bg-lt-card safe-bottom">
            <button
              onClick={handleSendReminder}
              disabled={sending || !message.trim() || (data?.missingCount === 0)}
              className="w-full py-3 rounded-btn bg-lt-amber text-lt-black font-condensed text-base font-700 disabled:opacity-50 active:scale-[0.98] transition-all"
            >
              {sending ? 'Enviando...' : `Enviar recordatorio${data?.missingCount ? ` (${data.missingCount})` : ''}`}
            </button>
          </div>
        )}

        {activeTab === 'mass' && (
          <div className="flex-shrink-0 px-4 py-3 border-t border-[rgba(255,255,255,0.07)] bg-lt-card safe-bottom">
            <button
              onClick={handleSendMass}
              disabled={sending || !massMessage.trim()}
              className="w-full py-3 rounded-btn bg-lt-blue text-white font-condensed text-base font-700 disabled:opacity-50 active:scale-[0.98] transition-all"
            >
              {sending ? 'Enviando...' : 'Enviar a todos'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
