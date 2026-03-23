'use client'
import { useState, useEffect } from 'react'

interface GeoState {
  lat: number | null
  lng: number | null
  error: string | null
  loading: boolean
}

export function useGeolocation(watch = false): GeoState {
  const [state, setState] = useState<GeoState>({ lat: null, lng: null, error: null, loading: true })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocalización no soportada', loading: false }))
      return
    }

    const onSuccess = ({ coords }: GeolocationPosition) => {
      setState({ lat: coords.latitude, lng: coords.longitude, error: null, loading: false })
    }
    const onError = (e: GeolocationPositionError) => {
      setState((s) => ({ ...s, error: e.message, loading: false }))
    }
    const opts: PositionOptions = { enableHighAccuracy: true, timeout: 10000 }

    if (watch) {
      const id = navigator.geolocation.watchPosition(onSuccess, onError, opts)
      return () => navigator.geolocation.clearWatch(id)
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, opts)
    }
  }, [watch])

  return state
}
