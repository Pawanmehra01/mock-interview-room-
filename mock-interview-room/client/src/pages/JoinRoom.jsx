import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SERVER_URL } from '../config'

export default function JoinRoom() {
  const [name, setName] = useState('')
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const roomIdFromUrl = searchParams.get('roomId')
  const isCandidate = !!roomIdFromUrl

  async function handleCreate() {
    if (!name || !question) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${SERVER_URL}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          language: 'javascript',
          interviewerName: name
        })
      })
      const data = await res.json()
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', 'interviewer')
      localStorage.setItem('roomId', data.room.id)
      localStorage.setItem('name', name)
      navigate(`/room/${data.room.id}`)
    } catch (err) {
      setError('Failed to create room. Is the server running?')
    }
    setLoading(false)
  }

  async function handleJoin() {
    if (!name) {
      setError('Please enter your name')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: roomIdFromUrl, name })
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }
      sessionStorage.setItem('token', data.token)
sessionStorage.setItem('role', 'interviewer')
sessionStorage.setItem('roomId', data.room.id)
sessionStorage.setItem('name', name)
      navigate(`/room/${roomIdFromUrl}`)
    } catch (err) {
      setError('Failed to join room. Is the server running?')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '12px',
        padding: '2rem',
        width: '100%',
        maxWidth: '420px'
      }}>
        <h1 style={{ color: '#fff', fontSize: '20px', marginBottom: '6px', fontWeight: '500' }}>
          {isCandidate ? 'Join Interview Room' : 'Create Interview Room'}
        </h1>
        <p style={{ color: '#888', fontSize: '13px', marginBottom: '1.5rem' }}>
          {isCandidate ? 'Enter your name to join' : 'Set up a new interview session'}
        </p>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ color: '#aaa', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
            Your name
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={isCandidate ? 'Rahul' : 'Priya'}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {!isCandidate && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{ color: '#aaa', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
              Interview question
            </label>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Given an array of integers, return indices of two numbers that add up to a target..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#2a2a2a',
                border: '1px solid #444',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'sans-serif'
              }}
            />
          </div>
        )}

        {error && (
          <p style={{ color: '#f87171', fontSize: '12px', marginBottom: '10px' }}>{error}</p>
        )}

        <button
          onClick={isCandidate ? handleJoin : handleCreate}
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            background: loading ? '#333' : '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: loading ? 'default' : 'pointer',
            fontWeight: '500'
          }}
        >
          {loading ? 'Please wait...' : isCandidate ? 'Join Room' : 'Create Room'}
        </button>
      </div>
    </div>
  )
}