'use client'
import { useState, useEffect, useCallback } from 'react'

type PushState = 'loading' | 'unsupported' | 'denied' | 'prompt' | 'subscribed' | 'unsubscribed'

export function usePushSubscription() {
  const [state, setState] = useState<PushState>('loading')
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }

    const permission = Notification.permission
    if (permission === 'denied') {
      setState('denied')
      return
    }

    // Check if already subscribed via the existing next-pwa service worker
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setState(sub ? 'subscribed' : permission === 'granted' ? 'unsubscribed' : 'prompt')
      })
    })
  }, [])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (subscribing) return false
    setSubscribing(true)

    try {
      // Use the existing service worker (next-pwa's sw.js which includes our push handlers)
      const reg = await navigator.serviceWorker.ready

      // Get VAPID key from server
      const keyRes = await fetch('/api/push/vapid-key')
      if (!keyRes.ok) { setSubscribing(false); return false }
      const { publicKey } = await keyRes.json()

      // Request notification permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState('denied')
        setSubscribing(false)
        return false
      }

      // Subscribe to push on the existing SW registration
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
      })

      // Send subscription to our server
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
