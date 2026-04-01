'use client'
import { useState, useEffect, useCallback } from 'react'

type PushState = 'loading' | 'unsupported' | 'ios-needs-install' | 'denied' | 'prompt' | 'subscribed' | 'unsubscribed'

/**
 * Ensure a service worker is registered and activated.
 * If one already exists, return it. Otherwise register /sw.js and wait.
 */
async function ensureSWRegistration(): Promise<ServiceWorkerRegistration> {
  const registrations = await navigator.serviceWorker.getRegistrations()
  const existing = registrations.find((r) => r.active)
  if (existing) return existing

  // No active SW — register manually
  console.log('[push] No active SW found, registering /sw.js…')
  const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })

  // Wait for activation
  if (reg.active) return reg

  const installing = reg.installing || reg.waiting
  if (!installing) throw new Error('SW registration failed — no installing worker')

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('SW activation timeout')), 15000)
    installing.addEventListener('statechange', () => {
      if (installing.state === 'activated') {
        clearTimeout(timeout)
        resolve(reg)
      } else if (installing.state === 'redundant') {
        clearTimeout(timeout)
        reject(new Error('SW became redundant'))
      }
    })
  })
}

export function usePushSubscription() {
  const [state, setState] = useState<PushState>('loading')
  const [subscribing, setSubscribing] = useState(false)

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

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (subscribing) return false
    setSubscribing(true)

    try {
      // Request notification permission FIRST (doesn't need SW)
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState('denied')
        setSubscribing(false)
        return false
      }

      // Ensure SW is registered and active
      const reg = await ensureSWRegistration()

      // Get VAPID key from server
      const keyRes = await fetch('/api/push/vapid-key')
      if (!keyRes.ok) {
        console.error('[push] VAPID key fetch failed:', keyRes.status)
        setSubscribing(false)
        return false
      }
      const { publicKey } = await keyRes.json()

      // Subscribe to push on the SW registration
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
      })

      // Send subscription to server
      const subJson = subscription.toJSON()
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
        return true
      } else {
        console.error('[push] subscribe API failed:', res.status, await res.text())
      }
    } catch (err) {
      console.error('[push] subscription error:', err)
    }

    setSubscribing(false)
    return false
  }, [subscribing])

  return { state, subscribe, subscribing }
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
