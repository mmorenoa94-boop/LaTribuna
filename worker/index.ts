// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sw = self as any

// Push notification handler — embedded into next-pwa's service worker
sw.addEventListener('push', (event: any) => {
  if (!event.data) return

  let data: { title?: string; body?: string; icon?: string; image?: string; data?: Record<string, string>; tag?: string }
  try {
    data = event.data.json()
  } catch {
    data = { title: 'La Tribuna', body: event.data.text() }
  }

  const title = data.title || 'La Tribuna'
  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    image: data.image || undefined,
    data: data.data || {},
    vibrate: [100, 50, 100],
    tag: data.tag || 'lt-notification',
    renotify: true,
  } as any

  event.waitUntil(sw.registration.showNotification(title, options))
})

sw.addEventListener('notificationclick', (event: any) => {
  event.notification.close()

  const data = (event.notification.data || {}) as Record<string, string>
  let url = '/'

  switch (data.type) {
    case 'promotion':
      url = '/notificaciones'
      break
    case 'question_open':
    case 'question_reminder':
      url = data.leagueId && data.matchId
        ? `/ligas/${data.leagueId}/trivia?matchId=${data.matchId}`
        : '/ligas'
      break
    case 'league_invite':
      url = data.inviteCode ? `/invite/${data.inviteCode}` : '/explorar'
      break
    case 'admin_message':
      url = data.leagueId ? `/ligas/${data.leagueId}` : '/ligas'
      break
    default:
      url = '/home'
  }

  event.waitUntil(
    sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients: any[]) => {
      for (const client of windowClients) {
        if (client.url.indexOf(sw.location.origin) !== -1 && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return sw.clients.openWindow(url)
    })
  )
})
