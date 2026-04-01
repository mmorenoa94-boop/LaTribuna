'use client'
import { useState, useEffect, useCallback } from 'react'

type PushState = 'loading' | 'unsupported' | 'ios-needs-install' | 'denied' | 'prompt' | 'subscribed' | 'unsubscribed'

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

    // Wait for SW ready with a timeout — don't hang forever
    let cancelled = false
    const timeout = setTimeout(() => {
      if (!cancelled) {
        // SW not ready after 5s — still show prompt, subscribe will register on demand
        setState(permission === 'granted' ? 'unsubscribed' : 'prompt')
      }
    }, 5000)

    navigator.serviceWorker.ready.then((reg) => {
      if (cancelled) return
      clearTimeout(timeout)
      reg.pushManager.getSubscription().then((sub) => {
        if (cancelled) return
        setState(sub ? 'subscribed' : permission === 'granted' ? 'unsubscribed' : 'prompt')
      })
    }).catch(() => {
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

      // Wait for the service worker with a timeout
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('SW timeout')), 8000)
        ),
      ])

      // Get VAPID key from server
      const keyRes = await fetch('/api/push/vapid-key')
      if (!keyRes.ok) {
        console.error('[push] VAPID key fetch failed:', keyRes.status)
        setSubscribing(false)
        return false
      }
      const { publicKey } = await keyRes.json()

      // Subscribe to push on the existing SW registration
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
