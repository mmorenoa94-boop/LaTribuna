import admin from 'firebase-admin'

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  })
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  url?: string
  data?: Record<string, string>
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
  tokens: string[]
): Promise<void> {
  if (!tokens.length) return

  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification: {
      title: payload.title,
      body: payload.body,
      imageUrl: payload.icon,
    },
    webpush: {
      fcmOptions: { link: payload.url },
      notification: { icon: '/icons/icon-192.png', badge: '/icons/badge-72.png' },
    },
    data: { userId, ...(payload.data ?? {}) },
  }

  await admin.messaging().sendEachForMulticast(message)
}
