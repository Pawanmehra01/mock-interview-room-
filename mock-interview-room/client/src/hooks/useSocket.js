import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { SERVER_URL } from '../config'

export function useSocket(token) {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!token) return

    socketRef.current = io(SERVER_URL, {
      auth: { token },
      transports: ['websocket']
    })

    socketRef.current.on('connect', () => {
      setConnected(true)
    })

    socketRef.current.on('disconnect', () => {
      setConnected(false)
    })

    return () => {
      socketRef.current.disconnect()
    }
  }, [token])

  return { socket: socketRef.current, connected }
}