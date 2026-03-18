'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NuevaLigaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    maxMembers: 50,
    allowRemote: false,
    matchMode: 'PER_MATCH' as 'PER_MATCH' | 'SEASON',
  })

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/businesses/me/leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al crear la liga')
      router.push('/dashboard/ligas')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear')
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-lt-card2 border border-lt-muted rounded-btn px-4 py-3 text-lt-white font-barlow text-sm focus:outline-none focus:border-lt-amber transition-colors placeholder:text-lt-muted2'

  return (
    <div className="px-4 md:px-8 pt-4 md:pt-8 max-w-lg animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/ligas" className="text-lt-muted2 hover:text-lt-white transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div>
          <p className="text-lt-muted2 text-sm font-condensed">Ligas</p>
          <h1 className="text-lt-white font-bebas text-3xl leading-tight">Nueva Liga</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nombre */}
        <div>
          <label className="block text-lt-white font-condensed text-sm mb-1.5">
            Nombre de la liga <span className="text-lt-red">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Ej: Liga del Sports Bar"
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
            onChange={(e) => update('description', e.target.value)}
            placeholder="Describe tu liga en una frase"
            maxLength={120}
            className={inputCls}
          />
        </div>

        {/* Max miembros */}
        <div>
          <label className="block text-lt-white font-condensed text-sm mb-1.5">Máximo de miembros</label>
          <select
            value={form.maxMembers}
            onChange={(e) => update('maxMembers', Number(e.target.value))}
            className="w-full bg-lt-card2 border border-lt-muted text-lt-white font-condensed text-sm rounded-btn px-4 py-3 focus:outline-none focus:border-lt-amber"
          >
            {[10, 20, 50, 100, 200, 500].map((n) => (
              <option key={n} value={n}>{n} jugadores</option>
            ))}
          </select>
        </div>

        {/* Modalidad */}
        <div>
          <label className="block text-lt-white font-condensed text-sm mb-2">Modalidad</label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: 'PER_MATCH', label: 'Partido a partido', desc: 'Cada partido es independiente' },
              { value: 'SEASON', label: 'Temporada', desc: 'Acumula puntos en varios partidos' },
            ] as const).map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => update('matchMode', value)}
                className={`py-3 px-3 rounded-btn border font-condensed text-sm text-left transition-all ${
                  form.matchMode === value
                    ? 'bg-lt-amber/20 border-lt-amber text-lt-amber'
                    : 'bg-lt-card border-lt-muted text-lt-white hover:border-lt-amber/30'
                }`}
              >
                <p className="font-600">{label}</p>
                <p className="text-xs mt-0.5 opacity-70">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Permitir remotos */}
        <div className="flex items-center justify-between bg-lt-card2 rounded-btn px-4 py-3 border border-lt-muted">
          <div>
            <p className="text-lt-white font-condensed text-sm font-600">Permitir remotos</p>
            <p className="text-lt-muted2 text-xs font-barlow">Jugadores que no están en el local</p>
          </div>
          <button
            type="button"
            onClick={() => update('allowRemote', !form.allowRemote)}
            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.allowRemote ? 'bg-lt-amber' : 'bg-lt-muted'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.allowRemote ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>

        {error && <p className="text-lt-red text-sm font-condensed">{error}</p>}

        <button
          type="submit"
          disabled={!form.name.trim() || loading}
          className="w-full bg-lt-amber text-lt-black font-condensed font-700 text-base py-3.5 rounded-btn disabled:opacity-40 transition-opacity"
        >
          {loading ? 'Creando...' : 'Crear liga'}
        </button>
      </form>
    </div>
  )
}
