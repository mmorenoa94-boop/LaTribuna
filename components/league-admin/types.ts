/** Shared types for the unified league admin panel */

export interface LeagueAdminData {
  id: string
  name: string
  description: string | null
  inviteCode: string
  allowRemote: boolean
  requireApproval: boolean
  allowMemberInvites: boolean
  minConsumption: boolean
  minConsumptionAmount: number | null
  matchMode: string
  scoringMode: string
  maxMembers: number
  type: string
  status: string
  memberCount: number
  bannerUrl: string | null
  themeColor: string
  hasLinkedBusiness: boolean
}

export interface MemberAdminData {
  id: string          // userId
  name: string
  email: string
  image: string | null
  status: string
  points: number
  joinedAt: string
  isCreator: boolean
  consumptionVerified: boolean
}

export interface MatchRow {
  id: string
  homeTeam: string
  awayTeam: string
  competition: string
  venue: string | null
  kickoffAt: string
  status: string
  homeScore: number | null
  awayScore: number | null
  questionCount: number
}

export interface QuestionRow {
  id: string
  text: string
  type: string
  options: string[]
  pointsValue: number
  timing: string
  status: string
  orderIndex: number
  correctAnswer: string | null
  openAt: string | null
  closedAt: string | null
  resolvedAt: string | null
  winnersCount: number | null
  totalPot: number | null
  _count: { answers: number; predictions: number }
}
