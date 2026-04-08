'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface Props {
  leagueId: string
  initialBannerUrl: string | null
  initialThemeColor: string
}

const THEME_COLORS = [
  { name: 'Verde', value: '#00E676' },
  { name: 'Rojo', value: '#FF1744' },
  { name: 'Azul', value: '#2979FF' },
  { name: 'Ámbar', value: '#FFB300' },
  { name: 'Morado', value: '#AA00FF' },
  { name: 'Cyan', value: '#00E5FF' },
  { name: 'Rosa', value: '#FF4081' },
  { name: 'Naranja', value: '#FF6D00' },
]

export function CustomizeTab({ leagueId, initialBannerUrl, initialThemeColor }: Props) {
  const [bannerUrl, setBannerUrl] = useState<string | null>(initialBannerUrl)
  const [themeColor, setThemeColor] = useState(initialThemeColor || '#00E676')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(file: File) {
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Solo se permiten imágenes (JPEG, PNG, WebP)' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'La imagen no puede superar 2MB' })
      return
    }

    setUploading(true)
    setMessage(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'banners')

      const res = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Error al subir imagen' })
        return
      }

      const data = await res.json()
      setBannerUrl(data.url)
      setMessage({ type: 'success', text: 'Banner subido correctamente' })
    } catch {
      setMessage({ type: 'error', text: 'Error al subir imagen' })
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
    e.target.value = ''
  }

  async function handleRemoveBanner() {
    setBannerUrl(null)
    setMessage(null)
  }

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/admin/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bannerUrl, themeColor }),
      })

      if (!res.ok) {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Error al guardar' })
        return
      }

      setMessage({ type: 'success', text: 'Personalización guardada' })
    } catch {
      setMessage({ type: 'error', text: 'Error al guardar cambios' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-condensed text-base font-700 text-lt-white uppercase tracking-wide">
        Personalizar liga
      </h2>

      {/* Banner Upload */}
      <div>
        <label className="block font-condensed text-xs text-lt-muted2 uppercase tracking-wide mb-2">
          Banner de la liga
        </label>
        <p className="font-condensed text-xs text-lt-muted mb-3">
          Se muestra como encabezado en la vista de la liga. Ideal para promociones, logos o branding. Recomendado: 1200x400px.
        </p>

        {bannerUrl && (
          <div className="relative mb-3 rounded-card overflow-hidden border border-[rgba(255,255,255,0.07)]">
            <Image
              src={bannerUrl}
              alt="Banner de la liga"
              width={1200}
              height={400}
              className="w-full h-40 object-cover"
            />
            <button
              onClick={handleRemoveBanner}
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-black/60 rounded-full text-lt-red hover:bg-black/80 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-card p-6 text-center cursor-pointer transition-all',
            dragOver
              ? 'border-lt-green bg-lt-green/5'
              : 'border-[rgba(255,255,255,0.15)] hover:border-lt-green/40 hover:bg-lt-card2'
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-lt-green/30 border-t-lt-green rounded-full animate-spin" />
              <p className="font-condensed text-sm text-lt-muted2">Subiendo imagen...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-lt-muted2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="font-condensed text-sm text-lt-muted2">
                {bannerUrl ? 'Arrastra o haz clic para cambiar' : 'Arrastra una imagen o haz clic para seleccionar'}
              </p>
              <p className="font-condensed text-xs text-lt-muted">JPEG, PNG o WebP — máx. 2MB</p>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Theme Color */}
      <div>
        <label className="block font-condensed text-xs text-lt-muted2 uppercase tracking-wide mb-2">
          Color de la liga
        </label>
        <p className="font-condensed text-xs text-lt-muted mb-3">
          Se aplica al badge de tipo, barra de acento, puntos y elementos destacados de la liga.
        </p>

        <div className="flex flex-wrap gap-3">
          {THEME_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => setThemeColor(color.value)}
              className={cn(
                'flex flex-col items-center gap-1.5 p-2 rounded-card border-2 transition-all',
                themeColor === color.value
                  ? 'border-white bg-lt-card2'
                  : 'border-transparent hover:border-[rgba(255,255,255,0.15)]'
              )}
            >
              <div
                className="w-10 h-10 rounded-full border-2 border-[rgba(255,255,255,0.1)]"
                style={{ backgroundColor: color.value }}
              />
              <span className="font-condensed text-[10px] text-lt-muted2">{color.name}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-card overflow-hidden">
          <div className="h-2" style={{ backgroundColor: themeColor }} />
          <div className="bg-lt-card p-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: themeColor }} />
            <span className="font-condensed text-xs" style={{ color: themeColor }}>
              Vista previa del color
            </span>
          </div>
        </div>
      </div>

      {message && (
        <p className={cn(
          'font-condensed text-sm px-3 py-2 rounded-btn border',
          message.type === 'success'
            ? 'text-lt-green bg-lt-green/10 border-lt-green/30'
            : 'text-lt-red bg-lt-red/10 border-lt-red/30'
        )}>
          {message.text}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3.5 rounded-btn bg-lt-green text-lt-black font-condensed text-base font-700 disabled:opacity-50 active:scale-[0.98] transition-all"
      >
        {saving ? 'Guardando...' : 'Guardar personalización'}
      </button>
    </div>
  )
}
