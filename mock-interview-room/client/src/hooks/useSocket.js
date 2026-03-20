import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { SERVER_URL } from '../config'

export function useSocket(token) {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    if (!token) return
    if (socketRef.current) return

    const newSocket = io(SERVER_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    newSocket.on('connect', () => {
      setConnected(true)
      console.log('Socket connected:', newSocket.id)
    })

    newSocket.on('connect_error', (err) => {
      console.log('Socket error:', err.message)
      setConnected(false)
    })

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason)
      setConnected(false)
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [token])

  return { socket, connected }
}