// Push notification handlers — loaded into sw.js via importScripts

self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch (e) {
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
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data || {}
  let url = '/'

  switch (data.type) {
    case 'promotion':
      url = '/notificaciones'
      break
    case 'question_open':
    case 'question_reminder':
      url = data.leagueId && data.matchId
        ? '/ligas/' + data.leagueId + '/trivia?matchId=' + data.matchId
        : '/ligas'
      break
    case 'league_invite':
      url = data.inviteCode ? '/invite/' + data.inviteCode : '/explorar'
      break
    case 'admin_message':
      url = data.leagueId ? '/ligas/' + data.leagueId : '/ligas'
      break
    default:
      url = '/home'
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i]
        if (client.url.indexOf(self.location.origin) !== -1 && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
