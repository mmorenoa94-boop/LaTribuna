'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

type Modal = 'crear' | 'unirse' | null
type UserRole = 'HINCHA' | 'NEGOCIO' | 'SUPER_ADMIN'

interface CrearForm {
  name: string
  description: string
  type: 'PRIVATE' | 'INVITE_ONLY' | 'PUBLIC'
  allowRemote: boolean
  maxMembers: number
}

const TIPO_OPTIONS = [
  { value: 'PRIVATE',     label: 'Privada',         desc: 'Solo tú puedes invitar' },
  { value: 'INVITE_ONLY', label: 'Con invitación',   desc: 'Cualquiera con código puede entrar' },
  { value: 'PUBLIC',      label: 'Pública',          desc: 'Aparece en el explorador' },
] as const

export function LigasActions({ role }: { role: UserRole }) {
  const router = useRouter()
  const [modal, setModal] = useState<Modal>(null)

  return (
    <>
      {/* Botones de acción */}
      <div className="flex gap-2">
        <button
          onClick={() => setModal('crear')}
          className="flex-1 flex items-center justify-center gap-2 bg-lt-green text-lt-black font-condensed font-700 text-sm py-2.5 rounded-btn hover:opacity-90 transition-opacity active:scale-[0.97]"
        >
          <PlusIcon className="w-4 h-4" />
          Crear liga
        </button>
        <button
          onClick={() => setModal('unirse')}
          className="flex-1 flex items-center justify-center gap-2 bg-lt-card border border-lt-muted text-lt-white font-condensed font-700 text-sm py-2.5 rounded-btn hover:border-lt-green/40 transition-colors active:scale-[0.97]"
        >
          <HashIcon className="w-4 h-4" />
          Unirme con código
        </button>
      </div>

      {/* Backdrop + modales */}
      <AnimatePresence>
        {modal && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModal(null)}
              className="fixed inset-0 bg-black/70 z-[60]"
            />
            {modal === 'crear' && (
              <CrearModal role={role} onClose={() => setModal(null)} onSuccess={() => { setModal(null); router.refresh() }} />
            )}
            {modal === 'unirse' && (
              <UnirseModal onClose={() => setModal(null)} onSuccess={() => { setModal(null); router.refresh() }} />
            )}
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// ── Modal: Crear liga ──────────────────────────────────

function CrearModal({ role, onClose, onSuccess }: { role: UserRole; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<CrearForm>({
    name: '', description: '', type: 'INVITE_ONLY', allowRemote: false, maxMembers: 50,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<{ inviteCode: string; id: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function set<K extends keyof CrearForm>(key: K, value: CrearForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al crear la liga')
      setCreated({ inviteCode: data.inviteCode, id: data.id })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear la liga')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-lt-card2 border border-lt-muted rounded-btn px-4 py-3 text-lt-white font-barlow text-sm focus:outline-none focus:border-lt-green transition-colors placeholder:text-lt-muted2'

  return (
    <BottomSheet title="Crear nueva liga" onClose={created ? onSuccess : onClose}>
      {created ? (
        // ── Estado de éxito ──
        <div className="flex flex-col items-center gap-5 py-4">
          <div className="w-16 h-16 rounded-full bg-lt-green/20 border border-lt-green flex items-center justify-center">
            <CheckIcon className="w-8 h-8 text-lt-green" />
          </div>
          <div className="text-center">
            <p className="text-lt-white font-condensed text-xl font-700">¡Liga creada!</p>
            <p className="text-lt-muted2 text-sm font-barlow mt-1">Comparte con tus amigos para que se unan</p>
          </div>
          <div className="w-full bg-lt-card2 rounded-card border border-lt-green/30 p-4 text-center">
            <p className="text-lt-muted2 text-xs font-condensed mb-2 uppercase tracking-wider">Código de invitación</p>
            <CopyableCode code={created.inviteCode} />
          </div>
          <ShareInviteLink inviteCode={created.inviteCode} leagueName={form.name} />
          <button
            onClick={onSuccess}
            className="w-full bg-lt-green text-lt-black font-condensed font-700 text-base py-3.5 rounded-btn"
          >
            Ver mi liga →
          </button>
        </div>
      ) : (
        // ── Formulario ──
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Nombre */}
          <div>
            <label className="block text-lt-white font-condensed text-sm mb-1.5">
              Nombre <span className="text-lt-red">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ej: Los Gallos de la 80"
              maxLength={60}
              className={inputCls}
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-lt-white font-condensed text-sm mb-1.5">
              Descripción <span className="text-lt-muted2">(opcional)</span>
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Una frase para describir tu liga"
              maxLength={120}
              className={inputCls}
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-lt-white font-condensed text-sm mb-2">Visibilidad</label>
            <div className="grid grid-cols-3 gap-1.5">
              {TIPO_OPTIONS.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('type', value)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2.5 rounded-btn border text-center transition-all',
                    form.type === value
                      ? 'bg-lt-green/15 border-lt-green text-lt-green'
                      : 'bg-lt-card2 border-lt-muted text-lt-muted2 hover:border-lt-muted2'
                  )}
                >
                  <span className="font-condensed text-xs font-700 leading-none">{label}</span>
                  <span className="text-[10px] font-barlow leading-tight opacity-75">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Permitir remotos — solo visible para Negocios */}
          {role !== 'HINCHA' && (
            <div className="flex items-center justify-between bg-lt-card2 rounded-btn px-4 py-3 border border-lt-muted">
              <div>
                <p className="text-lt-white font-condensed text-sm font-600">Permitir remotos</p>
                <p className="text-lt-muted2 text-xs font-barlow">Jugadores fuera del local pueden unirse</p>
              </div>
              <Toggle value={form.allowRemote} onChange={(v) => set('allowRemote', v)} />
            </div>
          )}

          {/* Max miembros */}
          <div className="flex items-center justify-between bg-lt-card2 rounded-btn px-4 py-3 border border-lt-muted">
            <div>
              <p className="text-lt-white font-condensed text-sm font-600">Máximo de miembros</p>
              <p className="text-lt-muted2 text-xs font-barlow">Cuántos jugadores puede tener</p>
            </div>
            <select
              value={form.maxMembers}
              onChange={(e) => set('maxMembers', Number(e.target.value))}
              className="bg-lt-card border border-lt-muted text-lt-white font-condensed text-sm rounded-btn px-3 py-1.5 focus:outline-none focus:border-lt-green"
            >
              {[10, 20, 50, 100, 200].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-lt-red text-sm font-condensed">{error}</p>}

          <button
            type="submit"
            disabled={!form.name.trim() || loading}
            className="w-full bg-lt-green text-lt-black font-condensed font-700 text-base py-3.5 rounded-btn disabled:opacity-40 transition-opacity mt-1"
          >
            {loading ? 'Creando...' : 'Crear liga'}
          </button>
        </form>
      )}
    </BottomSheet>
  )
}

// ── Modal: Unirse con código ───────────────────────────

function UnirseModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (leagueId: string) => void }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => { inputRef.current?.focus() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length !== 6) {
      setError('El código tiene 6 caracteres')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/leagues/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'No se pudo unir a la liga')
      router.push(`/ligas/${data.league.id}`)
      onSuccess(data.league.id)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al unirse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <BottomSheet title="Unirme a una liga" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-lt-card2 border border-lt-muted flex items-center justify-center mx-auto mb-3">
            <HashIcon className="w-7 h-7 text-lt-green" />
          </div>
          <p className="text-lt-muted2 font-condensed text-sm">
            Pídele el código a quien administra la liga
          </p>
        </div>

        <div>
          <label className="block text-lt-white font-condensed text-sm mb-1.5 text-center">
            Código de invitación
          </label>
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={(e) => {
              setError('')
              setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
            }}
            placeholder="ABC123"
            maxLength={6}
            className="w-full bg-lt-card2 border border-lt-muted rounded-btn px-4 py-4 text-lt-white font-bebas text-3xl text-center tracking-[0.3em] focus:outline-none focus:border-lt-green transition-colors placeholder:text-lt-muted placeholder:font-bebas"
          />
          <p className={cn(
            'text-xs font-condensed text-center mt-1.5 transition-colors',
            code.length > 0 ? 'text-lt-muted2' : 'text-transparent'
          )}>
            {code.length}/6 caracteres
          </p>
        </div>

        {error && <p className="text-lt-red text-sm font-condensed text-center">{error}</p>}

        <button
          type="submit"
          disabled={code.length !== 6 || loading}
          className="w-full bg-lt-green text-lt-black font-condensed font-700 text-base py-3.5 rounded-btn disabled:opacity-40 transition-opacity"
        >
          {loading ? 'Buscando liga...' : 'Unirme →'}
        </button>
      </form>
    </BottomSheet>
  )
}

// ── Subcomponentes ─────────────────────────────────────

function BottomSheet({
  title, onClose, children,
}: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      key="sheet"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 26, stiffness: 280 }}
      className="fixed bottom-0 left-0 right-0 z-[70] bg-lt-dark rounded-t-[20px] border-t border-[rgba(255,255,255,0.1)] flex flex-col max-h-[92vh]"
    >
      {/* Handle — fijo arriba */}
      <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-lt-muted" />
      </div>
      {/* Header — fijo */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-[rgba(255,255,255,0.06)]">
        <h2 className="text-lt-white font-condensed text-xl font-700">{title}</h2>
        <button onClick={onClose} className="text-lt-muted2 hover:text-lt-white transition-colors p-1">
          <XIcon className="w-5 h-5" />
        </button>
      </div>
      {/* Contenido scrollable con espacio al final */}
      <div className="overflow-y-auto flex-1 px-5 py-5 pb-8" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px) + 1.5rem)' }}>
        {children}
      </div>
    </motion.div>
  )
}

function CopyableCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="flex items-center justify-center gap-3 w-full group"
    >
      <span className="font-bebas text-4xl tracking-[0.3em] text-lt-green">{code}</span>
      <span className={cn(
        'text-xs font-condensed transition-colors',
        copied ? 'text-lt-green' : 'text-lt-muted2 group-hover:text-lt-white'
      )}>
        {copied ? '✓ Copiado' : 'Copiar'}
      </span>
    </button>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors flex-shrink-0',
        value ? 'bg-lt-green' : 'bg-lt-muted'
      )}
    >
      <span className={cn(
        'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all',
        value ? 'left-[22px]' : 'left-0.5'
      )} />
    </button>
  )
}

// ── Compartir link de invitación ──────────────────────
function ShareInviteLink({ inviteCode, leagueName }: { inviteCode: string; leagueName: string }) {
  const [copied, setCopied] = useState(false)
  const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${inviteCode}`

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Únete a ${leagueName} en La Tribuna`,
          text: `¡Te invito a jugar trivia deportiva en mi liga "${leagueName}"!`,
          url: link,
        })
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full flex gap-2">
      <button
        onClick={handleShare}
        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-btn bg-lt-card border border-lt-muted text-lt-white font-condensed text-sm font-700 hover:border-lt-green/40 transition-colors active:scale-[0.97]"
      >
        <ShareIcon className="w-4 h-4" />
        Compartir link
      </button>
      <button
        onClick={handleCopyLink}
        className={cn(
          'flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-btn border font-condensed text-sm font-600 transition-all',
          copied
            ? 'bg-lt-green/20 border-lt-green text-lt-green'
            : 'bg-lt-card border-lt-muted text-lt-white hover:border-lt-green/40'
        )}
      >
        {copied ? '✓ Copiado' : 'Copiar link'}
      </button>
    </div>
  )
}

// Icons
function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  )
}
function HashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <line x1="4" y1="9" x2="20" y2="9" strokeLinecap="round" />
      <line x1="4" y1="15" x2="20" y2="15" strokeLinecap="round" />
      <line x1="10" y1="3" x2="8" y2="21" strokeLinecap="round" />
      <line x1="16" y1="3" x2="14" y2="21" strokeLinecap="round" />
    </svg>
  )
}
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m20 6-11 11-5-5" />
    </svg>
  )
}
