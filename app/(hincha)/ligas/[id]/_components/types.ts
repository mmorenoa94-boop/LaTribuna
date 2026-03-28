// Tipos serializados (Dates → string) para pasar de Server → Client components

export interface SLeagueMember {
  id: string
  userId: string
  totalPoints: number
  consumptionVerified: boolean
  joinedAt: string
  user: { id: string; name: string; image: string | null; level: number }
}

export interface SMatch {
  id: string
  externalId: string
  homeTeam: string
  awayTeam: string
  homeLogo: string | null
  awayLogo: string | null
  competition: string
  kickoffAt: string
  status: 'SCHEDULED' | 'LIVE' | 'HALFTIME' | 'FINISHED' | 'CANCELLED'
  homeScore: number | null
  awayScore: number | null
  minutePlayed: number | null
}

export interface SLeagueMatch {
  id: string
  matchId: string
  match: SMatch
}

export interface SQuestion {
  id: string
  matchId: string
  text: string
  type: string
  options: string[]           // Json field, cast on fetch
  pointsValue: number
  orderIndex: number
  timing: 'PRE_MATCH' | 'LIVE'
  status: 'PENDING' | 'OPEN' | 'CLOSED' | 'RESOLVED'
  openAt: string | null
  closedAt: string | null
  resolvedAt: string | null
  correctAnswer: string | null
  totalPot: number | null
  winnersCount: number | null
}

export interface SPrize {
  id: string
  position: number
  description: string
  pointsValue: number
}

export interface SPrediction {
  id: string
  questionId: string
  answer: string
  isCorrect: boolean | null
  pointsEarned: number
}

export interface SLeague {
  id: string
  name: string
  description: string | null
  creatorId: string
  inviteCode: string
  type: string
  status: string
  maxMembers: number
  scoringMode: 'FIXED' | 'POOL'
  allowRemote: boolean
  allowMemberInvites: boolean
  minConsumption: boolean
  minConsumptionAmount: number | null
  seasonEndDate: string | null
  business: { id: string; name: string; logoUrl: string | null; city: string | null } | null
  members: SLeagueMember[]
  matches: SLeagueMatch[]
  questions: SQuestion[]
  prizes: SPrize[]
  _count: { members: number }
}
