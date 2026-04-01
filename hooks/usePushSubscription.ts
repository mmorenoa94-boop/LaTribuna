'use client'
import { useState, useEffect, useCallback } from 'react'

type PushState = 'loading' | 'unsupported' | 'ios-needs-install' | 'denied' | 'prompt' | 'subscribed' | 'unsubscribed'

/**
 * Get a SW registration with an active worker.
 *
 * Strategy (handles stale cached SWs from before push-handlers update):
 * 1. Try navigator.serviceWorker.ready (resolves when ANY SW is active)
 * 2. If that times out, check existing registrations for active worker
 * 3. If all workers are stale/redundant, UNREGISTER everything and register fresh
 */
async function getActiveSW(): Promise<ServiceWorkerRegistration> {
  // Attempt 1: The standard way — just wait for ready
  try {
    const reg = await withTimeout(navigator.serviceWorker.ready, 6000)
    if (reg.active) return reg
  } catch {
    console.log('[push] SW ready timed out, checking registrations…')
  }

  // Attempt 2: Maybe there's a registration with an active worker that ready didn't return
  const regs = await navigator.serviceWorker.getRegistrations()
  const activeReg = regs.find((r) => r.active)
  if (activeReg) return activeReg

  // Attempt 3: Nuclear — unregister everything and start clean
  console.log('[push] No active SW found. Unregistering all and re-registering…')
  for (const r of regs) {
    await r.unregister()
  }

  // Small delay to let the browser clean up
  await new Promise((r) => setTimeout(r, 500))

  // Register fresh
  const freshReg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })

  // Wait for the fresh registration to activate
  if (freshReg.active) return freshReg

  const worker = freshReg.installing || freshReg.waiting
  if (!worker) throw new Error('SW: no worker after fresh register')

  return new Promise<ServiceWorkerRegistration>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`SW: fresh install stuck (${worker.state})`))
    }, 15000)

    worker.addEventListener('statechange', () => {
      if (worker.state === 'activated') {
        clearTimeout(timeout)
        resolve(freshReg)
      } else if (worker.state === 'redundant') {
        clearTimeout(timeout)
        reject(new Error('SW: fresh worker also redundant — check sw.js'))
      }
    })

    // In case it activated between register and addEventListener
    if (freshReg.active) {
      clearTimeout(timeout)
      resolve(freshReg)
    }
  })
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    ),
  ])
}

export function usePushSubscription() {
  const [state, setState] = useState<PushState>('loading')
  const [subscribing, setSubscribing] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      setState('unsupported')
      return
    }

    const hasServiceWorker = 'serviceWorker' in navigator
    const hasPushManager = 'PushManager' in window
    const hasNotification = 'Notification' in window

    if (!hasServiceWorker || !hasPushManager || !hasNotification) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true
      if (isIOS && !isStandalone) {
        setState('ios-needs-install')
      } else {
        setState('unsupported')
      }
      return
    }

    const permission = Notification.permission
    if (permission === 'denied') {
      setState('denied')
      return
    }

    // Quick check: just see if ready resolves fast, otherwise show prompt
    let cancelled = false
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setState(permission === 'granted' ? 'unsubscribed' : 'prompt')
      }
    }, 3000)

    navigator.serviceWorker.ready
      .then((reg) => {
        if (cancelled) return
        clearTimeout(timeout)
        return reg.pushManager.getSubscription().then((sub) => {
          if (cancelled) return
          setState(sub ? 'subscribed' : permission === 'granted' ? 'unsubscribed' : 'prompt')
        })
      })
      .catch(() => {
        if (!cancelled) {
          clearTimeout(timeout)
          setState('prompt')
        }
      })

    return () => { cancelled = true; clearTimeout(timeout) }
  }, [])

  const subscribe = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (subscribing) return { ok: false, error: 'Ya en progreso' }
    setSubscribing(true)
    setLastError(null)

    try {
      // Step 1: Permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState('denied')
        setSubscribing(false)
        return { ok: false, error: `Permiso: ${permission}` }
      }

      // Step 2: Get active SW (with nuclear fallback)
      let reg: ServiceWorkerRegistration
      try {
        reg = await getActiveSW()
      } catch (swErr) {
        const msg = swErr instanceof Error ? swErr.message : 'SW error'
        setSubscribing(false)
        setLastError(msg)
        return { ok: false, error: msg }
      }

      // Step 3: VAPID key
      let publicKey: string
      try {
        const keyRes = await fetch('/api/push/vapid-key')
        if (!keyRes.ok) {
          const msg = `VAPID: HTTP ${keyRes.status}`
          setSubscribing(false)
          setLastError(msg)
          return { ok: false, error: msg }
        }
        const data = await keyRes.json()
        publicKey = data.publicKey
        if (!publicKey) {
          const msg = 'VAPID: key vacía'
          setSubscribing(false)
          setLastError(msg)
          return { ok: false, error: msg }
        }
      } catch (fetchErr) {
        const msg = `VAPID: ${fetchErr instanceof Error ? fetchErr.message : 'error'}`
        setSubscribing(false)
        setLastError(msg)
        return { ok: false, error: msg }
      }

      // Step 4: Push subscription
      let subscription: PushSubscription
      try {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
        })
      } catch (subErr) {
        const msg = `Push: ${subErr instanceof Error ? subErr.message : 'error'}`
        setSubscribing(false)
        setLastError(msg)
        return { ok: false, error: msg }
      }

      // Step 5: Save to server
      const subJson = subscription.toJSON()
      try {
        const res = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subJson.endpoint,
            keys: subJson.keys,
          }),
        })
        if (res.ok) {
          setState('subscribed')
          setSubscribing(false)
          setLastError(null)
          return { ok: true }
        }
        const text = await res.text().catch(() => '')
        const msg = `API: ${res.status} ${text.slice(0, 80)}`
        setSubscribing(false)
        setLastError(msg)
        return { ok: false, error: msg }
      } catch (apiErr) {
        const msg = `API: ${apiErr instanceof Error ? apiErr.message : 'error'}`
        setSubscribing(false)
        setLastError(msg)
        return { ok: false, error: msg }
      }
    } catch (err) {
      const msg = `Error: ${err instanceof Error ? err.message : String(err)}`
      setSubscribing(false)
      setLastError(msg)
      return { ok: false, error: msg }
    }
  }, [subscribing])

  return { state, subscribe, subscribing, lastError }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
