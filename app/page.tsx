'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

export default function StudioPage() {
  const [activeAgent, setActiveAgent] = useState<'argos' | 'argus'>('argos')
  const [messages, setMessages] = useState<{role: string; content: string; id: string}[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamBuffer, setStreamBuffer] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const historyRef = useRef<{role: string; content: string}[]>([])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamBuffer])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return
    const userMsg = { role: 'user', content: text, id: Date.now().toString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    setStreamBuffer('')

    const endpoint = activeAgent === 'argos' ? '/api/argos/chat' : '/api/argus/stream'
    const body = activeAgent === 'argos'
      ? { message: text, conversationHistory: JSON.stringify(historyRef.current.slice(-10)) }
      : { prompt: text, conversationHistory: JSON.stringify(historyRef.current.slice(-10)) }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok || !res.body) throw new Error('API error')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setStreamBuffer(accumulated)
      }
      const assistantMsg = { role: 'assistant', content: accumulated, id: Date.now().toString() }
      setMessages(prev => [...prev, assistantMsg])
      historyRef.current = [...historyRef.current, { role: 'user', content: text }, { role: 'assistant', content: accumulated }].slice(-20)
      setStreamBuffer('')
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Could not reach the API. Check your API key in Vercel settings.', id: Date.now().toString() }])
    } finally {
      setIsLoading(false)
    }
  }, [activeAgent, isLoading])

  const isArgos = activeAgent === 'argos'

  return (
    <main className="h-screen overflow-hidden bg-zinc-950 flex flex-col">

      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/80">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-zinc-100 text-xs font-mono font-bold tracking-widest uppercase">ArgOS x ARGUS Studio</span>
        </div>
        <nav className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          <button type="button" onClick={() => setActiveAgent('argos')}
            className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-all ${isArgos ? 'bg-blue-600 text-white border border-blue-500' : 'text-zinc-400 hover:text-zinc-200'}`}>
            ArgOS <span className="opacity-60 font-normal">Brain</span>
          </button>
          <button type="button" onClick={() => setActiveAgent('argus')}
            className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-all ${!isArgos ? 'bg-amber-600 text-zinc-950 border border-amber-500' : 'text-zinc-400 hover:text-zinc-200'}`}>
            ARGUS <span className="opacity-60 font-normal">Engineer</span>
          </button>
        </nav>
      </header>

      {/* Agent label */}
      <div className={`flex-shrink-0 px-4 py-1.5 border-b text-xs font-mono ${isArgos ? 'border-blue-900/40 text-blue-400 bg-blue-950/20' : 'border-amber-900/40 text-amber-400 bg-amber-950/20'}`}>
        {isArgos ? '🧠 ArgOS Evolution — Project Manager · Brain' : '⚙️ ARGUS V10 — Lead Engineer · 17-Step Pipeline'}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center border ${isArgos ? 'bg-blue-950 border-blue-800' : 'bg-amber-950 border-amber-800'}`}>
              <span className="text-2xl">{isArgos ? '🧠' : '⚙️'}</span>
            </div>
            <p className="text-zinc-500 text-xs font-mono max-w-xs">
              {isArgos
                ? 'Talk to ArgOS — plan features, manage projects, delegate to ARGUS when ready to build.'
                : 'Talk to ARGUS — describe what to build and it will run the full 17-step pipeline.'}
            </p>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {(isArgos
                ? ['What are we building today?', 'Recap the current project state', 'Plan the authentication feature']
                : ['Build a user auth system with Supabase', 'Architect a real-time dashboard', 'Create a mobile-first PWA shell']
              ).map(s => (
                <button key={s} type="button" onClick={() => sendMessage(s)}
                  className={`text-left px-4 py-2.5 rounded-lg border text-zinc-400 hover:text-zinc-200 text-xs font-mono transition-colors ${isArgos ? 'bg-zinc-900 border-zinc-800 hover:border-blue-900' : 'bg-zinc-900 border-zinc-800 hover:border-amber-900'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'gap-3'}`}>
            {msg.role === 'assistant' && (
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 border ${isArgos ? 'bg-blue-950 border-blue-800' : 'bg-amber-950 border-amber-800'}`}>
                <span className="text-xs">{isArgos ? '🧠' : '⚙️'}</span>
              </div>
            )}
            <div className={`max-w-[85%] rounded-xl px-4 py-3 text-xs font-mono leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-blue-600/20 border border-blue-700/40 text-zinc-200'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && streamBuffer && (
          <div className="flex gap-3">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 border ${isArgos ? 'bg-blue-950 border-blue-800' : 'bg-amber-950 border-amber-800'}`}>
              <span className="text-xs">{isArgos ? '🧠' : '⚙️'}</span>
            </div>
            <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono leading-relaxed whitespace-pre-wrap text-zinc-200">
              {streamBuffer}
              <span className="inline-block w-1.5 h-3 bg-blue-400 animate-pulse ml-0.5 align-text-bottom" />
            </div>
          </div>
        )}

        {isLoading && !streamBuffer && (
          <div className="flex gap-3">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border ${isArgos ? 'bg-blue-950 border-blue-800' : 'bg-amber-950 border-amber-800'}`}>
              <span className="text-xs">{isArgos ? '🧠' : '⚙️'}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
              {[0,1,2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-pulse" style={{animationDelay: `${i*150}ms`}} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-zinc-800 bg-zinc-900/20 p-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); sendMessage(input) }}}
            rows={2}
            disabled={isLoading}
            placeholder={isLoading ? 'Responding…' : isArgos ? 'Talk to ArgOS — plan, strategize, delegate…' : 'Describe what to build for ARGUS…'}
            className="flex-1 resize-none bg-zinc-900 border border-zinc-800 focus:border-blue-700 rounded-lg text-zinc-100 text-xs font-mono leading-relaxed placeholder:text-zinc-700 px-3 py-2.5 focus:outline-none transition-colors disabled:opacity-50"
          />
          <button type="button" onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading}
            className={`px-3 rounded-lg text-xs font-mono font-semibold border transition-colors ${
              input.trim() && !isLoading
                ? isArgos ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500' : 'bg-amber-600 hover:bg-amber-500 text-zinc-950 border-amber-500'
                : 'bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed'
            }`}>
            Send
          </button>
        </div>
        <span className="text-zinc-800 text-xs font-mono mt-1 block">⌘↵ to send</span>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-1.5 border-t border-zinc-900">
        <span className="text-zinc-700 text-xs font-mono">{isArgos ? '🧠 ArgOS — Project Manager' : '⚙️ ARGUS v10 — Lead Engineer'}</span>
        <span className="text-zinc-800 text-xs font-mono">ArgOS Evolution · ARGUS V10</span>
      </div>

    </main>
  )
}
