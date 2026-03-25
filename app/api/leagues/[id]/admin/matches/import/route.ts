import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const MAX_ROWS = 200
const MAX_FILE_SIZE = 1 * 1024 * 1024 // 1 MB

const REQUIRED_HEADERS = ['equipo_local', 'equipo_visitante', 'fecha', 'hora', 'competencia']
const OPTIONAL_HEADERS = ['estadio', 'arbitro']
const ALL_HEADERS = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS]

async function verifyCreator(leagueId: string, userId: string) {
  const league = await prisma.league.findUnique({ where: { id: leagueId } })
  return league?.creatorId === userId ? league : null
}

interface ParsedRow {
  row: number
  homeTeam: string
  awayTeam: string
  competition: string
  venue: string | null
  kickoffAt: Date
  externalId: string
}

interface RowError {
  row: number
  message: string
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let current = ''
  let inQuotes = false
  let row: string[] = []

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"'
        i++ // skip next quote
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        row.push(current.trim())
        current = ''
      } else if (char === '\n' || (char === '\r' && next === '\n')) {
        row.push(current.trim())
        if (row.some(cell => cell !== '')) rows.push(row)
        row = []
        current = ''
        if (char === '\r') i++ // skip \n
      } else {
        current += char
      }
    }
  }
  // Last row
  row.push(current.trim())
  if (row.some(cell => cell !== '')) rows.push(row)

  return rows
}

function validateDate(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(new Date(dateStr + 'T00:00:00').getTime())
}

function validateTime(timeStr: string): boolean {
  return /^\d{2}:\d{2}$/.test(timeStr)
}

// POST: Import matches from CSV
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const league = await verifyCreator(params.id, session.user.id)
  if (!league) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
  }

  // Validate file extension
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return NextResponse.json({ error: 'Solo se permiten archivos con extensión .csv' }, { status: 400 })
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'El archivo excede el límite de 1 MB' }, { status: 400 })
  }

  const text = await file.text()
  const rows = parseCSV(text)

  if (rows.length < 2) {
    return NextResponse.json({ error: 'El archivo no contiene partidos para importar' }, { status: 400 })
  }

  // Validate headers
  const headerRow = rows[0].map(h => h.toLowerCase().trim())
  const missingHeaders = REQUIRED_HEADERS.filter(h => !headerRow.includes(h))
  if (missingHeaders.length > 0) {
    return NextResponse.json({
      error: `Los encabezados del CSV no coinciden con el formato esperado. Faltan: ${missingHeaders.join(', ')}`,
    }, { status: 400 })
  }

  // Map header indices
  const headerIndex: Record<string, number> = {}
  for (const h of ALL_HEADERS) {
    const idx = headerRow.indexOf(h)
    if (idx !== -1) headerIndex[h] = idx
  }

  const dataRows = rows.slice(1)
  if (dataRows.length === 0) {
    return NextResponse.json({ error: 'El archivo no contiene partidos para importar' }, { status: 400 })
  }

  if (dataRows.length > MAX_ROWS) {
    return NextResponse.json({
      error: `El archivo excede el límite de ${MAX_ROWS} partidos por importación`,
    }, { status: 400 })
  }

  // Parse and validate each row
  const validRows: ParsedRow[] = []
  const errors: RowError[] = []
  const seenKeys = new Map<string, number>() // key → row number (for duplicate detection within CSV)

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const rowNum = i + 2 // +2 because row 1 is header, data starts at row 2

    const getValue = (field: string): string => {
      const idx = headerIndex[field]
      return idx !== undefined && idx < row.length ? row[idx].trim() : ''
    }

    const homeTeam = getValue('equipo_local')
    const awayTeam = getValue('equipo_visitante')
    const fecha = getValue('fecha')
    const hora = getValue('hora')
    const competition = getValue('competencia')
    const venue = getValue('estadio') || null
    // arbitro is accepted but not stored in current Match model

    // Required field validation
    if (!homeTeam) { errors.push({ row: rowNum, message: "El campo 'equipo_local' es obligatorio" }); continue }
    if (!awayTeam) { errors.push({ row: rowNum, message: "El campo 'equipo_visitante' es obligatorio" }); continue }
    if (!fecha) { errors.push({ row: rowNum, message: "El campo 'fecha' es obligatorio" }); continue }
    if (!hora) { errors.push({ row: rowNum, message: "El campo 'hora' es obligatorio" }); continue }
    if (!competition) { errors.push({ row: rowNum, message: "El campo 'competencia' es obligatorio" }); continue }

    // Format validation
    if (!validateDate(fecha)) {
      errors.push({ row: rowNum, message: "Formato de fecha inválido. Use YYYY-MM-DD" }); continue
    }
    if (!validateTime(hora)) {
      errors.push({ row: rowNum, message: "Formato de hora inválido. Use HH:mm (24h)" }); continue
    }

    // Same team validation
    if (homeTeam.toLowerCase() === awayTeam.toLowerCase()) {
      errors.push({ row: rowNum, message: "El equipo local y visitante no pueden ser iguales" }); continue
    }

    // Build kickoff datetime with Colombia timezone (UTC-5)
    const kickoffAt = new Date(`${fecha}T${hora}:00-05:00`)
    if (isNaN(kickoffAt.getTime())) {
      errors.push({ row: rowNum, message: "Fecha u hora inválida" }); continue
    }

    // Past date validation
    if (kickoffAt < new Date()) {
      errors.push({ row: rowNum, message: "La fecha del partido no puede ser en el pasado" }); continue
    }

    // Duplicate within CSV
    const key = `${homeTeam.toLowerCase()}-${awayTeam.toLowerCase()}-${fecha}-${hora}`
    if (seenKeys.has(key)) {
      errors.push({ row: rowNum, message: `Partido duplicado en el archivo (ver fila ${seenKeys.get(key)})` }); continue
    }
    seenKeys.set(key, rowNum)

    const externalId = `manual-${params.id}-${homeTeam}-${awayTeam}-${fecha}T${hora}`
      .replace(/\s+/g, '-')
      .toLowerCase()
      .slice(0, 191)

    validRows.push({ row: rowNum, homeTeam, awayTeam, competition, venue, kickoffAt, externalId })
  }

  // Check for duplicates in DB
  if (validRows.length > 0) {
    const existingMatches = await prisma.match.findMany({
      where: { externalId: { in: validRows.map(r => r.externalId) } },
      select: { externalId: true },
    })
    const existingSet = new Set(existingMatches.map(m => m.externalId))

    const filtered: ParsedRow[] = []
    for (const row of validRows) {
      if (existingSet.has(row.externalId)) {
        errors.push({ row: row.row, message: "Este partido ya existe en el sistema" })
      } else {
        filtered.push(row)
      }
    }
    validRows.length = 0
    validRows.push(...filtered)
  }

  // Import valid rows
  const importedMatches: Array<{ row: number; local: string; visitante: string; match_id: string }> = []

  if (validRows.length > 0) {
    for (const r of validRows) {
      const match = await prisma.match.create({
        data: {
          externalId: r.externalId,
          homeTeam: r.homeTeam,
          awayTeam: r.awayTeam,
          competition: r.competition,
          venue: r.venue,
          kickoffAt: r.kickoffAt,
          status: 'SCHEDULED',
        },
      })

      await prisma.leagueMatch.create({
        data: { leagueId: params.id, matchId: match.id },
      })

      importedMatches.push({
        row: r.row,
        local: r.homeTeam,
        visitante: r.awayTeam,
        match_id: match.id,
      })
    }
  }

  return NextResponse.json({
    success: true,
    summary: {
      total_rows: dataRows.length,
      imported: importedMatches.length,
      errors: errors.length,
    },
    imported_matches: importedMatches,
    errors: errors.sort((a, b) => a.row - b.row),
  })
}
