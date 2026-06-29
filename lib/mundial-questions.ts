/**
 * Plantilla del set de preguntas de la Polla Mundialista 2026.
 *
 * El sorteo oficial del Mundial 2026 puede no estar finalizado al sembrar:
 * los equipos por grupo y la lista de selecciones son valores por defecto
 * EDITABLES por el admin desde el panel antes de abrir inscripciones.
 *
 * Formato 2026: 48 selecciones, 12 grupos (A–L), clasifican los 2 primeros
 * de cada grupo + los 8 mejores terceros (Dieciseisavos de final).
 */

export type SeedQuestion = {
  order: number
  text: string
  type: 'TEAM_PICK' | 'PLAYER_PICK' | 'YES_NO' | 'SINGLE_CHOICE' | 'NUMERIC' | 'GROUP_RANK'
  category: 'GLOBAL' | 'COLOMBIA' | 'BRACKET'
  options: unknown
  pointsValue: number
  isTiebreaker: boolean
  tiebreakRank?: number | null
}

// Selecciones por defecto para los TEAM_PICK (campeón, subcampeón, 3er puesto).
// El admin debe ajustarla tras el sorteo oficial.
export const DEFAULT_TEAMS: string[] = [
  'Argentina', 'Francia', 'Brasil', 'Inglaterra', 'España', 'Portugal',
  'Países Bajos', 'Alemania', 'Bélgica', 'Croacia', 'Uruguay', 'Colombia',
  'Estados Unidos', 'México', 'Canadá', 'Marruecos', 'Japón', 'Corea del Sur',
  'Senegal', 'Suiza', 'Dinamarca', 'Italia', 'Ecuador', 'Australia',
]

// Fases posibles para "¿hasta dónde llega Colombia?"
export const COLOMBIA_PHASES: string[] = [
  'Fase de grupos',
  'Dieciseisavos de final',
  'Octavos de final',
  'Cuartos de final',
  'Semifinal',
  'Final (subcampeón)',
  'Campeón',
]

// 12 grupos (A–L) con 4 cupos cada uno. Equipos placeholder editables por el admin.
export const DEFAULT_GROUPS = Array.from({ length: 12 }, (_, i) => {
  const letter = String.fromCharCode(65 + i) // A..L
  return {
    name: letter,
    teams: [`Equipo ${letter}1`, `Equipo ${letter}2`, `Equipo ${letter}3`, `Equipo ${letter}4`],
  }
})

export function buildSeedQuestions(): SeedQuestion[] {
  let order = 0
  const next = () => order++

  return [
    // ── Globales (con puntos) ──
    {
      order: next(),
      text: '¿Quién será el campeón del Mundial 2026?',
      type: 'TEAM_PICK',
      category: 'GLOBAL',
      options: DEFAULT_TEAMS,
      pointsValue: 50,
      isTiebreaker: false,
    },
    {
      order: next(),
      text: '¿Quién será el subcampeón?',
      type: 'TEAM_PICK',
      category: 'GLOBAL',
      options: DEFAULT_TEAMS,
      pointsValue: 30,
      isTiebreaker: false,
    },
    {
      order: next(),
      text: '¿Quién quedará en tercer puesto?',
      type: 'TEAM_PICK',
      category: 'GLOBAL',
      options: DEFAULT_TEAMS,
      pointsValue: 20,
      isTiebreaker: false,
    },
    {
      order: next(),
      text: '¿Quién será el goleador del torneo (Bota de Oro)?',
      type: 'PLAYER_PICK',
      category: 'GLOBAL',
      options: [],
      pointsValue: 30,
      isTiebreaker: false,
    },
    {
      order: next(),
      text: '¿Quién será el mejor arquero (Guante de Oro)?',
      type: 'PLAYER_PICK',
      category: 'GLOBAL',
      options: [],
      pointsValue: 25,
      isTiebreaker: false,
    },
    {
      order: next(),
      text: '¿Quién será el MVP del torneo (Balón de Oro)?',
      type: 'PLAYER_PICK',
      category: 'GLOBAL',
      options: [],
      pointsValue: 30,
      isTiebreaker: false,
    },

    // ── Colombia (con puntos) ──
    {
      order: next(),
      text: '¿Colombia pasa la fase de grupos?',
      type: 'YES_NO',
      category: 'COLOMBIA',
      options: ['Sí', 'No'],
      pointsValue: 20,
      isTiebreaker: false,
    },
    {
      order: next(),
      text: '¿Hasta qué fase llega Colombia?',
      type: 'SINGLE_CHOICE',
      category: 'COLOMBIA',
      options: COLOMBIA_PHASES,
      pointsValue: 30,
      isTiebreaker: false,
    },
    {
      order: next(),
      text: '¿Quién será el goleador de Colombia en el torneo?',
      type: 'PLAYER_PICK',
      category: 'COLOMBIA',
      options: [],
      pointsValue: 25,
      isTiebreaker: false,
    },

    // ── Bracket de grupos (con puntos) ──
    {
      order: next(),
      text: 'Ordena los 4 equipos de cada grupo (de 1° a 4°). Suma 1 punto por cada posición acertada.',
      type: 'GROUP_RANK',
      category: 'BRACKET',
      options: { groups: DEFAULT_GROUPS },
      pointsValue: 1, // puntos por cada posición acertada (hasta 48)
      isTiebreaker: false,
    },

    // ── Desempates (sin puntos) ──
    {
      order: next(),
      text: 'Desempate 1: ¿Cuántos goles se anotarán en TODO el mundial?',
      type: 'NUMERIC',
      category: 'GLOBAL',
      options: [],
      pointsValue: 0,
      isTiebreaker: true,
      tiebreakRank: 1,
    },
    {
      order: next(),
      text: 'Desempate 2: ¿Cuántos goles anotará Colombia en todo el torneo?',
      type: 'NUMERIC',
      category: 'COLOMBIA',
      options: [],
      pointsValue: 0,
      isTiebreaker: true,
      tiebreakRank: 2,
    },
    {
      order: next(),
      text: 'Desempate 3: ¿Quién marcará el primer gol de Colombia en el torneo?',
      type: 'PLAYER_PICK',
      category: 'COLOMBIA',
      options: [],
      pointsValue: 0,
      isTiebreaker: true,
      tiebreakRank: 3,
    },
  ]
}
