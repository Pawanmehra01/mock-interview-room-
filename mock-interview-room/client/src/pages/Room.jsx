import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { useSocket } from '../hooks/useSocket'

export default function Room() {
  const { roomId } = useParams()
const token = sessionStorage.getItem('token')
const role = sessionStorage.getItem('role')
const name = sessionStorage.getItem('name')

  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [participants, setParticipants] = useState([
  { name, role }
])
  const [aiResponse, setAiResponse] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [userQuery, setUserQuery] = useState('')
  const [timer, setTimer] = useState(0)

  const debounceRef = useRef(null)
  const isRemoteUpdate = useRef(false)
  const { socket, connected } = useSocket(token)

  useEffect(() => {
    const interval = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTimer = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  useEffect(() => {
    if (!socket) return

    socket.on('room:state', ({ code, language }) => {
      isRemoteUpdate.current = true
      setCode(code)
      setLanguage(language)
    })

    socket.on('room:user_joined', ({ name, role }) => {
      setParticipants(prev => {
        const exists = prev.find(p => p.name === name)
        if (exists) return prev
        return [...prev, { name, role }]
      })
    })

    socket.on('room:user_left', ({ name }) => {
      setParticipants(prev => prev.filter(p => p.name !== name))
    })

    socket.on('code:update', ({ code, language }) => {
      isRemoteUpdate.current = true
      setCode(code)
      setLanguage(language)
    })

    socket.on('language:update', ({ language }) => {
      setLanguage(language)
    })

    socket.on('ai:stream', ({ token }) => {
      setAiResponse(prev => prev + token)
    })

    socket.on('ai:done', () => {
      setAiLoading(false)
    })

    socket.on('ai:error', ({ message }) => {
      setAiResponse('Error: ' + message)
      setAiLoading(false)
    })

    return () => {
      socket.off('room:state')
      socket.off('room:user_joined')
      socket.off('room:user_left')
      socket.off('code:update')
      socket.off('language:update')
      socket.off('ai:stream')
      socket.off('ai:done')
      socket.off('ai:error')
    }
  }, [socket])

  function handleCodeChange(value) {
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false
      return
    }
    setCode(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      socket?.emit('code:change', { code: value, language })
    }, 300)
  }

  function handleLanguageChange(e) {
    const lang = e.target.value
    setLanguage(lang)
    socket?.emit('language:change', { language: lang })
  }

  function askAI() {
    if (!userQuery.trim() || aiLoading) return
    setAiResponse('')
    setAiLoading(true)
    socket?.emit('ai:ask', { userQuery })
    setUserQuery('')
  }

  return (
    <div style={{
      height: '100vh',
      background: '#0f0f0f',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'sans-serif',
      color: '#fff'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        background: '#1a1a1a',
        borderBottom: '1px solid #333'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontWeight: '500', fontSize: '14px' }}>InterviewRoom</span>
          <span style={{
            fontSize: '11px', padding: '2px 8px',
            background: connected ? '#14532d' : '#450a0a',
            color: connected ? '#4ade80' : '#f87171',
            borderRadius: '20px'
          }}>
            {connected ? 'Live' : 'Connecting...'}
          </span>
          <span style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace' }}>
            {roomId?.slice(0, 8)}...
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {participants.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: p.role === 'interviewer' ? '#854d0e' : '#1e3a5f',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: '500'
              }}>
                {p.name[0].toUpperCase()}
              </div>
              <span style={{ fontSize: '11px', color: '#aaa' }}>{p.name}</span>
            </div>
          ))}
          <span style={{
            fontFamily: 'monospace', fontSize: '12px',
            background: '#222', padding: '3px 8px', borderRadius: '6px', color: '#aaa'
          }}>
            {formatTimer(timer)}
          </span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px', background: '#1a1a1a', borderBottom: '1px solid #333'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: role === 'candidate' ? '#3b82f6' : '#f59e0b'
              }} />
              <span style={{ fontSize: '12px', color: '#aaa' }}>
                {name} — {role}
              </span>
            </div>
            <select
              value={language}
              onChange={handleLanguageChange}
              style={{
                background: '#2a2a2a', border: '1px solid #444',
                color: '#fff', fontSize: '11px', padding: '3px 6px',
                borderRadius: '4px', cursor: 'pointer'
              }}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <Editor
              height="100%"
              language={language}
              value={code}
              theme="vs-dark"
              onChange={handleCodeChange}
              options={{
                readOnly: role === 'interviewer',
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true
              }}
            />
          </div>
        </div>

        <div style={{
          width: '340px',
          background: '#1a1a1a',
          borderLeft: '1px solid #333',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '10px 12px',
            borderBottom: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '12px', fontWeight: '500' }}>
              {role === 'candidate' ? 'AI Hint' : 'AI Assist'}
            </span>
            <span style={{
              fontSize: '10px', padding: '1px 7px', borderRadius: '20px',
              background: role === 'candidate' ? '#1e3a5f' : '#451a03',
              color: role === 'candidate' ? '#93c5fd' : '#fbbf24'
            }}>
              {role === 'candidate' ? 'hints only' : 'scores + follow-ups'}
            </span>
          </div>

          <div style={{
            flex: 1,
            padding: '12px',
            overflowY: 'auto',
            fontSize: '12px',
            lineHeight: '1.7',
            color: '#ccc',
            whiteSpace: 'pre-wrap'
          }}>
            {aiResponse || (
              <span style={{ color: '#555', fontStyle: 'italic' }}>
                {role === 'candidate'
                  ? 'Ask for a hint or approach suggestion...'
                  : 'Score the answer or get follow-up questions...'}
              </span>
            )}
            {aiLoading && (
              <span style={{
                display: 'inline-block',
                width: '8px', height: '14px',
                background: '#3b82f6',
                marginLeft: '2px',
                animation: 'blink 1s step-end infinite'
              }} />
            )}
          </div>

          <div style={{ padding: '10px 12px', borderTop: '1px solid #333' }}>
            <textarea
              value={userQuery}
              onChange={e => setUserQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  askAI()
                }
              }}
              placeholder={role === 'candidate'
                ? 'Ask for a hint...'
                : 'Score the answer / get follow-ups...'}
              rows={2}
              style={{
                width: '100%',
                background: '#2a2a2a',
                border: '1px solid #444',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '12px',
                padding: '8px',
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'sans-serif',
                marginBottom: '8px'
              }}
            />
            <button
              onClick={askAI}
              disabled={aiLoading || !userQuery.trim()}
              style={{
                width: '100%',
                padding: '8px',
                background: aiLoading ? '#333' : '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: aiLoading ? 'default' : 'pointer',
                fontWeight: '500'
              }}
            >
              {aiLoading ? 'AI thinking...' : 'Ask AI (Enter)'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>
    </div>
  )
}