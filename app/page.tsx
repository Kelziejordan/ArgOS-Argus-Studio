// filepath: app/page.tsx

'use client'
import { useState, useRef, useEffect, type KeyboardEvent } from 'react'

// A simplified placeholder for the real hook. We'll add the full provider back later.
function useArgusSession() {
  const submitMessage = async (message: string) => {
    console.log("ARGUS Pipeline would be triggered with:", message)
    // In the full app, this will call the real streaming API
    alert(`HANDOFF TO ARGUS: \nBuilding feature: "${message}"`)
  }
  return { submitMessage }
}


export default function CommandCenterPage() {
  // This state will eventually toggle between the chat and the 9-panel grid
  const [activeSystem, setActiveSystem] = useState<'argos' | 'argus'>('argos')
  
  // State for the ArgOS chat UI
  const [argosInput, setArgosInput] = useState('')
  const [isArgosLoading, setIsArgosLoading] = useState(false)
  const [argosMessages, setArgosMessages] = useState([
    { 
      role: 'assistant', 
      content: 'ArgOS Evolution standing by. The foundation is stable. What are we building today?' 
    }
  ])
  
  const chatEndRef = useRef<HTMLDivElement>(null)
  const { submitMessage: startArgusPipeline } = useArgusSession()

  // Auto-scroll the chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [argosMessages])

  const handleArgosSubmit = async () => {
    if (!argosInput.trim() || isArgosLoading) return
    const userText = argosInput.trim()
    setArgosInput('')
    
    const newHistory = [...argosMessages, { role: 'user', content: userText }]
    setArgosMessages(newHistory)
    setIsArgosLoading(true)

    try {
      // This calls the Gemini API route we will create next
      const res = await fetch('/api/argos/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, history: argosMessages })
      })

      if (!res.ok) {
        throw new Error('API request failed')
      }

      const data = await res.json()

      if (data.type === 'handoff') {
        setArgosMessages(prev =>[...prev, { role: 'assistant', content: `*Handoff initiated. Delegating to ARGUS V10 to build:* \n\n${data.payload.feature_spec}` }])
        // For now, we'll just show an alert. Later, this will switch the UI.
        await startArgusPipeline(data.payload.feature_spec)
      } else {
        setArgosMessages(prev => [...prev, { role: 'assistant', content: data.content }])
      }

    } catch (error) {
      console.error(error)
      setArgosMessages(prev => [...prev, { role: 'assistant', content: '⚠️ System Error: Could not connect to the ArgOS API.' }])
    } finally {
      setIsArgosLoading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleArgosSubmit()
    }
  }

  // This is the main chat UI
  return (
    <main style={{ backgroundColor: '#09090b', color: 'white', fontFamily: 'sans-serif', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #27272a', backgroundColor: '#18181b' }}>
        <h1 style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '600', color: '#d4d4d8' }}>ArgOS Evolution</h1>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {argosMessages.map((msg, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <span style={{ fontSize: '0.625rem', fontFamily: 'monospace', color: '#71717a', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                {msg.role === 'user' ? 'You' : 'ArgOS'}
              </span>
              <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', maxWidth: '85%', fontSize: '0.875rem', lineHeight: '1.625', whiteSpace: 'pre-wrap', backgroundColor: msg.role === 'user' ? '#27272a' : '#18181b', border: '1px solid #3f3f46' }}>
                {msg.content}
              </div>
            </div>
          ))}
          {isArgosLoading && <p style={{color: '#a1a1aa'}}>ArgOS is thinking...</p>}
          <div ref={chatEndRef} />
        </div>
      </div>

      <div style={{ padding: '1.5rem', borderTop: '1px solid #27272a', backgroundColor: '#09090b' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', display: 'flex', gap: '0.5rem' }}>
          <textarea
            value={argosInput}
            onChange={(e) => setArgosInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Discuss project state or ask ArgOS to build a feature..."
            style={{ flex: 1, backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: 'white', resize: 'none' }}
            rows={2}
            disabled={isArgosLoading}
          />
          <button
            onClick={handleArgosSubmit}
            disabled={!argosInput.trim() || isArgosLoading}
            style={{ padding: '0 1.5rem', backgroundColor: '#2563eb', borderRadius: '0.5rem', color: 'white', fontFamily: 'monospace', fontSize: '0.75rem', cursor: 'pointer' }}
          >
            Send
          </button>
        </div>
      </div>
    </main>
  )
}
