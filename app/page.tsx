'use client'

import { useState } from 'react'

export type ActiveAgent = 'argos' | 'argus'

export default function StudioPage() {
  const [activeAgent, setActiveAgent] = useState<ActiveAgent>('argos')

  return (
    <main className="h-screen overflow-hidden bg-zinc-950 flex flex-col">

      <header className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/80">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-zinc-100 text-xs font-mono font-bold tracking-widest uppercase">ArgOS x ARGUS Studio</span>
        </div>
        <nav className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setActiveAgent('argos')}
            className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-all ${
              activeAgent === 'argos'
                ? 'bg-blue-600 text-white border border-blue-500'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ArgOS <span className="opacity-60 font-normal">Brain</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveAgent('argus')}
            className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-all ${
              activeAgent === 'argus'
                ? 'bg-amber-600 text-zinc-950 border border-amber-500'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ARGUS <span className="opacity-60 font-normal">Engineer</span>
          </button>
        </nav>
      </header>

      <div className="flex-1 min-h-0 flex items-center justify-center">
        {activeAgent === 'argos' ? (
          <div className="flex flex-col items-center gap-4 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-blue-950 border border-blue-800 flex items-center justify-center">
              <span className="text-blue-400 text-2xl">🧠</span>
            </div>
            <h2 className="text-zinc-200 text-sm font-mono font-semibold">ArgOS Evolution — Online</h2>
            <p className="text-zinc-600 text-xs font-mono max-w-xs">
              Project Manager ready. Switch to ARGUS Engineer to begin building.
            </p>
            <button
              type="button"
              onClick={() => setActiveAgent('argus')}
              className="px-4 py-2 rounded-lg text-xs font-mono bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 transition-colors"
            >
              Launch ARGUS Engineer →
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-amber-950 border border-amber-800 flex items-center justify-center">
              <span className="text-amber-400 text-2xl">⚙️</span>
            </div>
            <h2 className="text-zinc-200 text-sm font-mono font-semibold">ARGUS V10 — Online</h2>
            <p className="text-zinc-600 text-xs font-mono max-w-xs">
              Lead Engineer ready. 17-step pipeline standing by.
            </p>
            <button
              type="button"
              onClick={() => setActiveAgent('argos')}
              className="px-4 py-2 rounded-lg text-xs font-mono bg-amber-600 hover:bg-amber-500 text-zinc-950 border border-amber-500 transition-colors"
            >
              ← Return to ArgOS Brain
            </button>
          </div>
        )}
      </div>

      <footer className="flex-shrink-0 flex items-center justify-between px-4 py-1.5 border-t border-zinc-900">
        <span className="text-zinc-700 text-xs font-mono">
          {activeAgent === 'argos' ? '🧠 ArgOS — Project Manager' : '⚙️ ARGUS v10 — Lead Engineer'}
        </span>
        <span className="text-zinc-800 text-xs font-mono">ArgOS Evolution · ARGUS V10</span>
      </footer>

    </main>
  )
}
