import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendWebPush, type WebPushPayload } from '@/lib/web-push-send'
import { sendEmail, emailAdminMessage, emailQuestionReminder } from '@/lib/email'

/**
 * POST /api/leagues/[id]/admin/notify
 * Admin sends push + in-app notifications to league members.
 *
 * Body:
 * - type: 'reminder' | 'mass'
 * - matchId?: string (required for reminder)
 * - title?: string (for mass)
 * - message: string
 * - targetUserIds?: string[] (for reminder, specific non-responders)
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const league = await prisma.league.findUnique({ where: { id: params.id } })
  if (!league || league.creatorId !== session.user.id) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const body = await req.json()
  const { type, matchId, title, message, targetUserIds } = body as {
    type: 'reminder' | 'mass'
    matchId?: string
    title?: string
    message?: string
    targetUserIds?: string[]
  }

  if (!type || !message) {
    return NextResponse.json({ error: 'type y message son requeridos' }, { status: 400 })
  }

  let userIds: string[] = []

  if (type === 'reminder') {
    // Send reminder to users who haven't answered
    if (!matchId) {
      return NextResponse.json({ error: 'matchId requerido para recordatorios' }, { status: 400 })
    }

    if (targetUserIds && targetUserIds.length > 0) {
      // Verify they're league members
      const validMembers = await prisma.leagueMember.findMany({
        where: {
          leagueId: params.id,
          userId: { in: targetUserIds },
          status: 'APPROVED',
        },
        select: { userId: true },
      })
      userIds = validMembers.map((m) => m.userId)
    } else {
      // Auto-detect: find members who haven't answered all open/closed questions for this match
      const questions = await prisma.leagueQuestion.findMany({
        where: {
          leagueId: params.id,
          matchId,
          status: { in: ['OPEN', 'CLOSED'] },
        },
        select: { id: true },
      })

      if (questions.length === 0) {
        return NextResponse.json({ error: 'No hay preguntas abiertas/cerradas para este partido' }, { status: 400 })
      }

      const questionIds = questions.map((q) => q.id)

      // Get all members
      const members = await prisma.leagueMember.findMany({
        where: { leagueId: params.id, status: 'APPROVED' },
        select: { userId: true },
      })

      // Get who answered
      const [answers, predictions] = await Promise.all([
        prisma.answer.findMany({
          where: { questionId: { in: questionIds } },
          select: { userId: true, questionId: true },
        }),
        prisma.prediction.findMany({
          where: { questionId: { in: questionIds } },
          select: { userId: true, questionId: true },
        }),
      ])

      const responseMap = new Map<string, Set<string>>()
      for (const r of [...answers, ...predictions]) {
        if (!responseMap.has(r.userId)) responseMap.set(r.userId, new Set())
        responseMap.get(r.userId)!.add(r.questionId)
      }

      // Find members missing at least one answer
      userIds = members
        .filter((m) => {
          const answered = responseMap.get(m.userId)
          return !answered || questionIds.some((qid) => !answered.has(qid))
        })
        .map((m) => m.userId)
    }
  } else if (type === 'mass') {
    if (targetUserIds && targetUserIds.length > 0) {
      // Send to specific members
      const validMembers = await prisma.leagueMember.findMany({
        where: {
          leagueId: params.id,
          userId: { in: targetUserIds },
          status: 'APPROVED',
        },
        select: { userId: true },
      })
      userIds = validMembers.map((m) => m.userId).filter((id) => id !== session.user.id)
    } else {
      // Send to all league members (except admin)
      const members = await prisma.leagueMember.findMany({
        where: { leagueId: params.id, status: 'APPROVED' },
        select: { userId: true },
      })
      userIds = members.map((m) => m.userId).filter((id) => id !== session.user.id)
    }
  } else {
    return NextResponse.json({ error: 'type debe ser reminder o mass' }, { status: 400 })
  }

  if (userIds.length === 0) {
    return NextResponse.json({
      sent: 0,
      message: type === 'reminder'
        ? 'Todos los miembros ya respondieron'
        : 'No hay miembros para notificar',
    })
  }

  // Determine push payload
  const pushPayload: WebPushPayload = type === 'reminder'
    ? {
        title: `⏰ ${league.name}`,
        body: message,
        icon: '/icons/icon-192.png',
        tag: `reminder-${params.id}-${matchId}`,
        data: {
          type: 'question_reminder',
          leagueId: params.id,
          matchId: matchId ?? '',
        },
      }
    : {
        title: title || `📢 ${league.name}`,
        body: message,
        icon: '/icons/icon-192.png',
        tag: `admin-${params.id}-${Date.now()}`,
        data: {
          type: 'admin_message',
          leagueId: params.id,
        },
      }

  // Send push notifications
  const pushCount = await sendWebPush(userIds, pushPayload)

  // Create in-app notifications
  const notifTitle = type === 'reminder'
    ? `⏰ Recordatorio · ${league.name}`
    : title || `📢 ${league.name}`

  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type: type === 'reminder' ? 'QUESTION_REMINDER' : 'ADMIN_MESSAGE',
      title: notifTitle,
      body: message,
      data: {
        leagueId: params.id,
        ...(matchId ? { matchId } : {}),
      },
    })),
  })

  // Send emails (non-blocking)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://latribuna.app'
  prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { email: true },
  }).then(async (users) => {
    const emails = users.map((u) => u.email).filter(Boolean)
    if (emails.length === 0) return

    const emailData = type === 'reminder'
      ? emailQuestionReminder(league.name, message, 0, appUrl)
      : emailAdminMessage(league.name, title || league.name, message, appUrl)

    await sendEmail({ to: emails, ...emailData })
  }).catch(() => {})

  return NextResponse.json({
    sent: userIds.length,
    pushDelivered: pushCount,
    message: `Notificación enviada a ${userIds.length} miembro${userIds.length !== 1 ? 's' : ''}`,
  })
}
