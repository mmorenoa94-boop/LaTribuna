'use client'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { MatchRow } from './types'

interface Props {
  leagueId: string
  open: boolean
  onClose: () => void
  onImported: (matches: MatchRow[]) => void
}

interface ImportResult {
  success: boolean
  summary: { total_rows: number; imported: number; errors: number }
  imported_matches: Array<{ row: number; local: string; visitante: string; match_id: string }>
  errors: Array<{ row: number; message: string }>
}

type Step = 'upload' | 'preview' | 'importing' | 'result'

export function ImportMatchesModal({ leagueId, open, onClose, onImported }: Props) {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [previewRows, setPreviewRows] = useState<string[][]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setStep('upload')
    setFile(null)
    setPreviewRows([])
    setTotalRows(0)
    setResult(null)
    setError('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  function parseCSVPreview(text: string) {
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    if (lines.length < 2) {
      setError('El archivo no contiene partidos para importar')
      return
    }
    setTotalRows(lines.length - 1) // exclude header
    // Show header + first 5 rows
    const preview = lines.slice(0, 6).map(line => {
      const cells: string[] = []
      let current = ''
      let inQuotes = false
      for (const char of line) {
        if (inQuotes) {
          if (char === '"') inQuotes = false
          else current += char
        } else {
          if (char === '"') inQuotes = true
          else if (char === ',') { cells.push(current.trim()); current = '' }
          else current += char
        }
      }
      cells.push(current.trim())
      return cells
    })
    setPreviewRows(preview)
    setStep('preview')
  }

  function handleFileSelect(f: File) {
    setError('')
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setError('Solo se permiten archivos con extensión .csv')
      return
    }
    if (f.size > 1 * 1024 * 1024) {
      setError('El archivo excede el límite de 1 MB')
      return
    }
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      parseCSVPreview(text)
    }
    reader.readAsText(f, 'UTF-8')
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFileSelect(f)
  }

  async function handleImport() {
    if (!file) return
    setStep('importing')
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`/api/leagues/${leagueId}/admin/matches/import`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al importar')
        setStep('preview')
        return
      }

      setResult(data)
      setStep('result')

      // Notify parent of imported matches
      if (data.imported_matches?.length > 0) {
        const newMatches: MatchRow[] = data.imported_matches.map((m: ImportResult['imported_matches'][0]) => ({
          id: m.match_id,
          homeTeam: m.local,
          awayTeam: m.visitante,
          competition: '',
          venue: null,
          kickoffAt: new Date().toISOString(),
          status: 'SCHEDULED',
          questionCount: 0,
        }))
        onImported(newMatches)
      }
    } catch {
      setError('Error de conexión al importar')
      setStep('preview')
    }
  }

  async function downloadTemplate() {
    const res = await fetch(`/api/leagues/${leagueId}/admin/matches/import/template`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'plantilla_partidos.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
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
              <h2 className="font-bebas text-2xl text-lt-white tracking-wide">Importar partidos</h2>
              <button onClick={handleClose} className="text-lt-muted2 hover:text-lt-white p-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-6">

              {/* ── STEP: Upload ────────────────────────────────────── */}
              {step === 'upload' && (
                <div className="flex flex-col gap-4">
                  {/* Drag & Drop area */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={cn(
                      'border-2 border-dashed rounded-card p-8 text-center cursor-pointer transition-all',
                      dragOver
                        ? 'border-lt-green bg-lt-green/10'
                        : 'border-[rgba(255,255,255,0.15)] hover:border-lt-green/40'
                    )}
                  >
                    <input
                      ref={inputRef}
                      type="file"
                      accept=".csv"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      className="hidden"
                    />
                    <div className="text-4xl mb-3">📄</div>
                    <p className="font-condensed text-base text-lt-white font-700">
                      Arrastra tu archivo CSV aquí
                    </p>
                    <p className="font-condensed text-sm text-lt-muted2 mt-1">
                      o haz clic para seleccionar
                    </p>
                    <p className="font-condensed text-xs text-lt-muted mt-3">
                      Máximo 200 partidos · 1 MB · formato .csv
                    </p>
                  </div>

                  {/* Download template */}
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center justify-center gap-2 py-3 rounded-btn bg-lt-card2 border border-[rgba(255,255,255,0.07)] text-lt-green font-condensed text-sm font-700 hover:bg-lt-green/10 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Descargar plantilla CSV de ejemplo
                  </button>

                  {/* Format help */}
                  <div className="bg-lt-card2 rounded-card border border-[rgba(255,255,255,0.07)] p-4">
                    <p className="font-condensed text-xs text-lt-muted2 uppercase tracking-wider mb-2 font-700">
                      Formato del CSV
                    </p>
                    <div className="space-y-1.5">
                      <p className="font-condensed text-xs text-lt-muted2">
                        <span className="text-lt-white">Obligatorios:</span> equipo_local, equipo_visitante, fecha (YYYY-MM-DD), hora (HH:mm), competencia
                      </p>
                      <p className="font-condensed text-xs text-lt-muted2">
                        <span className="text-lt-white">Opcionales:</span> estadio
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP: Preview ───────────────────────────────────── */}
              {step === 'preview' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <button onClick={reset} className="text-lt-muted2 hover:text-lt-white">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                    <div>
                      <p className="font-condensed text-sm text-lt-white font-700">{file?.name}</p>
                      <p className="font-condensed text-xs text-lt-muted2">{totalRows} partido{totalRows !== 1 ? 's' : ''} encontrado{totalRows !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {/* Preview table */}
                  <div className="overflow-x-auto rounded-card border border-[rgba(255,255,255,0.07)]">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-lt-card2">
                          {previewRows[0]?.map((h, i) => (
                            <th key={i} className="px-3 py-2 font-condensed text-xs text-lt-muted2 uppercase tracking-wider whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.slice(1).map((row, i) => (
                          <tr key={i} className="border-t border-[rgba(255,255,255,0.05)]">
                            {row.map((cell, j) => (
                              <td key={j} className="px-3 py-2 font-condensed text-xs text-lt-white whitespace-nowrap">
                                {cell || <span className="text-lt-muted">—</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalRows > 5 && (
                    <p className="font-condensed text-xs text-lt-muted2 text-center">
                      Mostrando 5 de {totalRows} filas
                    </p>
                  )}

                  {error && (
                    <p className="font-condensed text-sm text-lt-red bg-lt-red/10 border border-lt-red/30 rounded-btn px-3 py-2">
                      {error}
                    </p>
                  )}

                  <button
                    onClick={handleImport}
                    className="w-full py-3.5 rounded-btn bg-lt-green text-lt-black font-condensed text-base font-700 active:scale-[0.98] transition-all"
                    style={{ marginBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}
                  >
                    Importar {totalRows} partido{totalRows !== 1 ? 's' : ''}
                  </button>
                </div>
              )}

              {/* ── STEP: Importing ─────────────────────────────────── */}
              {step === 'importing' && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-12 h-12 border-3 border-lt-green/30 border-t-lt-green rounded-full animate-spin" />
                  <p className="font-condensed text-base text-lt-white font-700">Importando partidos...</p>
                  <p className="font-condensed text-sm text-lt-muted2">Esto puede tardar unos segundos</p>
                </div>
              )}

              {/* ── STEP: Result ────────────────────────────────────── */}
              {step === 'result' && result && (
                <div className="flex flex-col gap-4">
                  {/* Summary */}
                  <div className="flex gap-3">
                    <div className="flex-1 bg-lt-green/10 border border-lt-green/30 rounded-card p-4 text-center">
                      <p className="font-bebas text-3xl text-lt-green">{result.summary.imported}</p>
                      <p className="font-condensed text-xs text-lt-green">Importados</p>
                    </div>
                    {result.summary.errors > 0 && (
                      <div className="flex-1 bg-lt-red/10 border border-lt-red/30 rounded-card p-4 text-center">
                        <p className="font-bebas text-3xl text-lt-red">{result.summary.errors}</p>
                        <p className="font-condensed text-xs text-lt-red">Errores</p>
                      </div>
                    )}
                  </div>

                  {/* Success message */}
                  {result.summary.imported > 0 && (
                    <div className="bg-lt-green/10 border border-lt-green/30 rounded-card p-4">
                      <p className="font-condensed text-sm text-lt-green font-700">
                        {result.summary.imported} partido{result.summary.imported !== 1 ? 's' : ''} importado{result.summary.imported !== 1 ? 's' : ''} correctamente
                      </p>
                    </div>
                  )}

                  {/* Errors list */}
                  {result.errors.length > 0 && (
                    <div className="bg-lt-card2 rounded-card border border-[rgba(255,255,255,0.07)] p-4">
                      <p className="font-condensed text-xs text-lt-muted2 uppercase tracking-wider mb-3 font-700">
                        Errores encontrados
                      </p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {result.errors.map((err, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="font-condensed text-xs text-lt-red font-700 flex-shrink-0">
                              Fila {err.row}:
                            </span>
                            <span className="font-condensed text-xs text-lt-muted2">
                              {err.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleClose}
                    className="w-full py-3.5 rounded-btn bg-lt-green text-lt-black font-condensed text-base font-700 active:scale-[0.98] transition-all"
                    style={{ marginBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
