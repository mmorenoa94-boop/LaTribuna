/**
 * Question template profiles for quick generation.
 *
 * Placeholders:
 *   {local}     → home team name
 *   {visitante} → away team name
 *
 * Each template maps to a QuestionType and provides default options.
 */

export interface QuestionTemplate {
  text: string
  type: 'WINNER' | 'SCORE' | 'YES_NO' | 'CUSTOM'
  options: string[]
  points: number
  timing: 'PRE_MATCH' | 'LIVE'
}

export interface QuestionProfile {
  id: string
  name: string
  description: string
  icon: string
  templates: QuestionTemplate[]
}

// ── Template banks ─────────────────────────────────────────────────────────

const PRE_MATCH_CORE: QuestionTemplate[] = [
  {
    text: '¿Quién ganará el partido?',
    type: 'WINNER',
    options: ['{local}', '{visitante}', 'Empate'],
    points: 20,
    timing: 'PRE_MATCH',
  },
  {
    text: '¿Cuál será el marcador final?',
    type: 'SCORE',
    options: ['1-0', '0-1', '2-1', '1-2', '1-1', '0-0'],
    points: 30,
    timing: 'PRE_MATCH',
  },
  {
    text: '¿Ambos equipos anotarán?',
    type: 'YES_NO',
    options: ['Sí', 'No'],
    points: 15,
    timing: 'PRE_MATCH',
  },
  {
    text: '¿Habrá más de 2 goles en el partido?',
    type: 'YES_NO',
    options: ['Sí', 'No'],
    points: 15,
    timing: 'PRE_MATCH',
  },
  {
    text: '¿Habrá gol en el primer tiempo?',
    type: 'YES_NO',
    options: ['Sí', 'No'],
    points: 15,
    timing: 'PRE_MATCH',
  },
]

const PRE_MATCH_EXTENDED: QuestionTemplate[] = [
  {
    text: '¿Quién anotará primero?',
    type: 'CUSTOM',
    options: ['{local}', '{visitante}', 'Ninguno (0-0)'],
    points: 20,
    timing: 'PRE_MATCH',
  },
  {
    text: '¿{local} mantendrá el arco en cero?',
    type: 'YES_NO',
    options: ['Sí', 'No'],
    points: 15,
    timing: 'PRE_MATCH',
  },
  {
    text: '¿Cuántos goles habrá en total?',
    type: 'CUSTOM',
    options: ['0', '1', '2', '3', '4 o más'],
    points: 25,
    timing: 'PRE_MATCH',
  },
  {
    text: '¿Habrá tarjeta roja en el partido?',
    type: 'YES_NO',
    options: ['Sí', 'No'],
    points: 15,
    timing: 'PRE_MATCH',
  },
  {
    text: '¿Habrá gol de penal?',
    type: 'YES_NO',
    options: ['Sí', 'No'],
    points: 15,
    timing: 'PRE_MATCH',
  },
  {
    text: '¿Cuántas tarjetas amarillas habrá?',
    type: 'CUSTOM',
    options: ['0-1', '2-3', '4-5', '6 o más'],
    points: 20,
    timing: 'PRE_MATCH',
  },
  {
    text: '¿Cuántos corners habrá en total?',
    type: 'CUSTOM',
    options: ['0-4', '5-8', '9-12', '13 o más'],
    points: 20,
    timing: 'PRE_MATCH',
  },
]

const LIVE_QUESTIONS: QuestionTemplate[] = [
  {
    text: '¿Quién anotará el próximo gol?',
    type: 'CUSTOM',
    options: ['{local}', '{visitante}', 'No habrá más goles'],
    points: 20,
    timing: 'LIVE',
  },
  {
    text: '¿Habrá gol antes del minuto 60?',
    type: 'YES_NO',
    options: ['Sí', 'No'],
    points: 15,
    timing: 'LIVE',
  },
  {
    text: '¿El segundo tiempo tendrá más goles que el primero?',
    type: 'YES_NO',
    options: ['Sí', 'No'],
    points: 20,
    timing: 'LIVE',
  },
  {
    text: '¿Habrá gol en los últimos 10 minutos?',
    type: 'YES_NO',
    options: ['Sí', 'No'],
    points: 20,
    timing: 'LIVE',
  },
  {
    text: '¿Habrá cambio antes del minuto 60?',
    type: 'YES_NO',
    options: ['Sí', 'No'],
    points: 10,
    timing: 'LIVE',
  },
  {
    text: '¿Cuántos goles habrá en el segundo tiempo?',
    type: 'CUSTOM',
    options: ['0', '1', '2', '3 o más'],
    points: 20,
    timing: 'LIVE',
  },
]

// ── Profiles ───────────────────────────────────────────────────────────────

export const QUESTION_PROFILES: QuestionProfile[] = [
  {
    id: 'standard',
    name: 'Partido estándar',
    description: '8 preguntas esenciales: predicciones + en vivo',
    icon: '⚽',
    templates: [
      ...PRE_MATCH_CORE,
      LIVE_QUESTIONS[0], // próximo gol
      LIVE_QUESTIONS[2], // más goles segundo tiempo
      LIVE_QUESTIONS[3], // gol últimos 10 min
    ],
  },
  {
    id: 'predictions-only',
    name: 'Solo predicciones',
    description: '7 preguntas pre-partido para que los hinchas predigan',
    icon: '🔮',
    templates: [
      ...PRE_MATCH_CORE,
      PRE_MATCH_EXTENDED[0], // quién anota primero
      PRE_MATCH_EXTENDED[2], // cuántos goles
    ],
  },
  {
    id: 'complete',
    name: 'Partido completo',
    description: '15 preguntas: cobertura total pre y en vivo',
    icon: '🏟️',
    templates: [
      ...PRE_MATCH_CORE,
      ...PRE_MATCH_EXTENDED.slice(0, 5),
      ...LIVE_QUESTIONS.slice(0, 5),
    ],
  },
  {
    id: 'live-only',
    name: 'Solo en vivo',
    description: '6 preguntas para lanzar durante el partido',
    icon: '🔴',
    templates: [...LIVE_QUESTIONS],
  },
  {
    id: 'quick',
    name: 'Rápido',
    description: '4 preguntas básicas para un partido casual',
    icon: '⚡',
    templates: [
      PRE_MATCH_CORE[0], // quién gana
      PRE_MATCH_CORE[1], // marcador
      PRE_MATCH_CORE[2], // ambos anotan
      LIVE_QUESTIONS[0], // próximo gol
    ],
  },
]

/**
 * Replace placeholders in a template with actual team names.
 */
export function hydrateTemplate(
  template: QuestionTemplate,
  homeTeam: string,
  awayTeam: string
): QuestionTemplate {
  return {
    ...template,
    text: template.text
      .replace(/\{local\}/g, homeTeam)
      .replace(/\{visitante\}/g, awayTeam),
    options: template.options.map((opt) =>
      opt.replace(/\{local\}/g, homeTeam).replace(/\{visitante\}/g, awayTeam)
    ),
  }
}
