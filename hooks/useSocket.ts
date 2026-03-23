'use client'
import { useEffect, useRef } from 'react'
import { getSocket, disconnectSocket } from '@/lib/socket'
import type { Socket } from 'socket.io-client'

export function useSocket(): Socket {
  const socket = getSocket()

  useEffect(() => {
    if (!socket.connected) socket.connect()
    return () => { disconnectSocket() }
  }, [socket])

  return socket
}

export function useSocketEvent<T>(
  event: string,
  handler: (data: T) => void
): void {
  const socket = getSocket()
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    const listener = (data: T) => handlerRef.current(data)
    socket.on(event, listener)
    return () => { socket.off(event, listener) }
  }, [socket, event])
}
