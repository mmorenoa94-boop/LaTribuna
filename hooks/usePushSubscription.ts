'use client'
import { useState, useEffect, useCallback } from 'react'

type PushState = 'loading' | 'unsupported' | 'ios-needs-install' | 'denied' | 'prompt' | 'subscribed' | 'unsubscribed'

/**
 * Get a service worker registration that has an active worker.
 * Strategy:
 * 1. Check if any existing registration already has an active worker
 * 2. If a registration exists with installing/waiting worker, wait for it
 * 3. Only register /sw.js as last resort if no registration exists at all
 */
async function ensureSWRegistration(): Promise<ServiceWorkerRegistration> {
  // Step 1: Check all existing registrations
  const registrations = await navigator.serviceWorker.getRegistrations()

  for (const reg of registrations) {
    if (reg.active) return reg
  }

  // Step 2: Check if any registration has a worker that's still installing/waiting
  for (const reg of registrations) {
    const pending = reg.installing || reg.waiting
    if (pending) {
      console.log('[push] Found pending SW in state:', pending.state, '— waiting…')
      return waitForActivation(reg, pending)
    }
  }

  // Step 3: No registration at all — register manually
  console.log('[push] No SW registration found, registering /sw.js…')
  const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  if (reg.active) return reg

  const pending = reg.installing || reg.waiting
  if (!pending) throw new Error('SW: no worker after register')
  return waitForActivation(reg, pending)
}

function waitForActivation(
  reg: ServiceWorkerRegistration,
  worker: ServiceWorker
): Promise<ServiceWorkerRegistration> {
  return new Promise((resolve, reject) => {
    // If it's already activated by the time we check
    if (worker.state === 'activated') {
      resolve(reg)
      return
    }

    const timeout = setTimeout(() => {
      reject(new Error(`SW: timeout waiting (state: ${worker.state})`))
    }, 20000)

    worker.addEventListener('statechange', () => {
      if (worker.state === 'activated') {
        clearTimeout(timeout)
        resolve(reg)
      } else if (worker.state === 'redundant') {
        // A redundant worker means another SW took over — check if THAT one is active now
        clearTimeout(timeout)
        if (reg.active) {
          resolve(reg)
        } else {
          // Try one more time to find any active registration
          navigator.serviceWorker.getRegistrations().then((regs) => {
            const active = regs.find((r) => r.active)
            if (active) resolve(active)
            else reject(new Error('SW: all workers redundant'))
          }).catch(() => reject(new Error('SW: redundant + getRegistrations failed')))
        }
      }
    })
  })
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

    // Check basic support
    const hasServiceWorker = 'serviceWorker' in navigator
    const hasPushManager = 'PushManager' in window
    const hasNotification = 'Notification' in window

    if (!hasServiceWorker || !hasPushManager || !hasNotification) {
      // iOS Safari only supports push for installed PWAs (Home Screen)
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

    // Try to find existing SW and subscription
    let cancelled = false
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setState(permission === 'granted' ? 'unsubscribed' : 'prompt')
      }
    }, 5000)

    ensureSWRegistration()
      .then((reg) => {
        if (cancelled) return
        clearTimeout(timeout)
        return reg.pushManager.getSubscription().then((sub) => {
          if (cancelled) return
          setState(sub ? 'subscribed' : permission === 'granted' ? 'unsubscribed' : 'prompt')
        })
      })
      .catch((err) => {
        console.warn('[push] SW init:', err?.message)
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
      // Step 1: Request notification permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState('denied')
        setSubscribing(false)
        return { ok: false, error: `Permiso denegado: ${permission}` }
      }

      // Step 2: Ensure SW is registered and active
      let reg: ServiceWorkerRegistration
      try {
        reg = await ensureSWRegistration()
      } catch (swErr) {
        const msg = swErr instanceof Error ? swErr.message : 'SW desconocido'
        setSubscribing(false)
        setLastError(msg)
        return { ok: false, error: msg }
      }

      // Step 3: Get VAPID key from server
      let publicKey: string
      try {
        const keyRes = await fetch('/api/push/vapid-key')
        if (!keyRes.ok) {
          const msg = `VAPID fetch error: ${keyRes.status}`
          setSubscribing(false)
          setLastError(msg)
          return { ok: false, error: msg }
        }
        const data = await keyRes.json()
        publicKey = data.publicKey
        if (!publicKey) {
          setSubscribing(false)
          setLastError('VAPID key vacía')
          return { ok: false, error: 'VAPID key vacía' }
        }
      } catch (fetchErr) {
        const msg = `VAPID fetch: ${fetchErr instanceof Error ? fetchErr.message : 'error'}`
        setSubscribing(false)
        setLastError(msg)
        return { ok: false, error: msg }
      }

      // Step 4: Subscribe to push manager
      let subscription: PushSubscription
      try {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
        })
      } catch (subErr) {
        const msg = `PushManager: ${subErr instanceof Error ? subErr.message : 'error'}`
        setSubscribing(false)
        setLastError(msg)
        return { ok: false, error: msg }
      }

      // Step 5: Send subscription to our server
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
        } else {
          const text = await res.text().catch(() => '')
          const msg = `API save: ${res.status} ${text.slice(0, 100)}`
          setSubscribing(false)
          setLastError(msg)
          return { ok: false, error: msg }
        }
      } catch (apiErr) {
        const msg = `API save: ${apiErr instanceof Error ? apiErr.message : 'error'}`
        setSubscribing(false)
        setLastError(msg)
        return { ok: false, error: msg }
      }
    } catch (err) {
      const msg = `Inesperado: ${err instanceof Error ? err.message : String(err)}`
      console.error('[push]', msg)
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
