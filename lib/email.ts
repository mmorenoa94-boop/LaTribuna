import { Resend } from 'resend'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'La Tribuna <noreply@latribuna.app>'

interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set, skipping email')
    return null
  }

  try {
    const result = await getResend().emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })
    return result
  } catch (error) {
    console.error('[email] Send error:', error)
    return null
  }
}

// ── Email Templates ──────────────────────────────────────────────────────────

const WRAPPER = (content: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0A0C0F;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:24px 16px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:24px;font-weight:800;color:#00E676;letter-spacing:2px;">LA TRIBUNA</span>
    </div>
    ${content}
    <div style="text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1);">
      <span style="color:#666;font-size:11px;">La Tribuna — El juego de los que sí saben</span>
    </div>
  </div>
</body>
</html>`

export function emailMatchReminder(leagueName: string, homeTeam: string, awayTeam: string, kickoffTime: string, appUrl: string) {
  return {
    subject: `${homeTeam} vs ${awayTeam} — ¡Haz tus predicciones!`,
    html: WRAPPER(`
      <div style="background:#111318;border-radius:12px;padding:20px;border:1px solid rgba(255,255,255,0.07);">
        <p style="color:#999;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">${leagueName}</p>
        <h2 style="color:#fff;font-size:22px;margin:0 0 4px;">${homeTeam} vs ${awayTeam}</h2>
        <p style="color:#00E676;font-size:14px;margin:0 0 16px;">Kickoff: ${kickoffTime}</p>
        <p style="color:#ccc;font-size:14px;margin:0 0 20px;">Hay preguntas pre-partido esperándote. ¡Responde antes del kickoff para ganar puntos!</p>
        <a href="${appUrl}" style="display:block;text-align:center;background:#00E676;color:#0A0C0F;font-weight:700;font-size:14px;padding:12px;border-radius:8px;text-decoration:none;">HACER MIS PREDICCIONES</a>
      </div>
    `),
  }
}

export function emailLiveQuestion(leagueName: string, questionText: string, pointsValue: number, triviaUrl: string) {
  return {
    subject: `🔴 Pregunta en vivo — ${leagueName}`,
    html: WRAPPER(`
      <div style="background:#111318;border-radius:12px;padding:20px;border:1px solid rgba(255,68,68,0.3);">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
          <span style="width:10px;height:10px;border-radius:50%;background:#FF4444;display:inline-block;"></span>
          <span style="color:#FF4444;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">En vivo — ${leagueName}</span>
        </div>
        <h2 style="color:#fff;font-size:20px;margin:0 0 8px;">${questionText}</h2>
        <p style="color:#00E676;font-size:14px;margin:0 0 20px;">+${pointsValue} puntos</p>
        <a href="${triviaUrl}" style="display:block;text-align:center;background:#FF4444;color:#fff;font-weight:700;font-size:14px;padding:12px;border-radius:8px;text-decoration:none;">¡RESPONDER AHORA!</a>
      </div>
    `),
  }
}

export function emailAdminMessage(leagueName: string, title: string, message: string, appUrl: string) {
  return {
    subject: `${leagueName} — ${title}`,
    html: WRAPPER(`
      <div style="background:#111318;border-radius:12px;padding:20px;border:1px solid rgba(0,230,118,0.2);">
        <p style="color:#00E676;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">${leagueName}</p>
        <h2 style="color:#fff;font-size:20px;margin:0 0 12px;">${title}</h2>
        <p style="color:#ccc;font-size:14px;margin:0 0 20px;line-height:1.5;">${message}</p>
        <a href="${appUrl}" style="display:block;text-align:center;background:#00E676;color:#0A0C0F;font-weight:700;font-size:14px;padding:12px;border-radius:8px;text-decoration:none;">ABRIR LA TRIBUNA</a>
      </div>
    `),
  }
}

export function emailQuestionReminder(leagueName: string, matchLabel: string, pendingCount: number, appUrl: string) {
  return {
    subject: `${leagueName} — ${pendingCount} preguntas por responder`,
    html: WRAPPER(`
      <div style="background:#111318;border-radius:12px;padding:20px;border:1px solid rgba(255,179,0,0.3);">
        <p style="color:#FFB300;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">${leagueName}</p>
        <h2 style="color:#fff;font-size:20px;margin:0 0 8px;">${matchLabel}</h2>
        <p style="color:#ccc;font-size:14px;margin:0 0 20px;">Tienes <strong style="color:#FFB300;">${pendingCount} preguntas</strong> sin responder. ¡No pierdas tus puntos!</p>
        <a href="${appUrl}" style="display:block;text-align:center;background:#FFB300;color:#0A0C0F;font-weight:700;font-size:14px;padding:12px;border-radius:8px;text-decoration:none;">RESPONDER AHORA</a>
      </div>
    `),
  }
}
