'use client'

import { useState } from 'react'

type SimStatus = 'idle' | 'running' | 'paused' | 'complete'

export default function SimulationPage() {
  const [status, setStatus] = useState<SimStatus>('idle')
  const [log, setLog] = useState<string[]>([])

  function startSim() {
    setStatus('running')
    setLog(['[SIM] Initializing world engine...', '[SIM] Loading avatar profiles...', '[SIM] Starting scenario...'])
  }

  function pauseSim() {
    setStatus((s) => (s === 'running' ? 'paused' : 'running'))
  }

  function resetSim() {
    setStatus('idle')
    setLog([])
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Simulation Environment</h1>

        {/* Controls */}
        <div className="flex gap-3">
          {status === 'idle' && (
            <button onClick={startSim} className="btn-primary">
              Start Simulation
            </button>
          )}
          {(status === 'running' || status === 'paused') && (
            <>
              <button
                onClick={pauseSim}
                className="border border-gray-700 text-gray-300 hover:border-gray-500 font-semibold px-6 py-2.5 rounded-lg transition-colors"
              >
                {status === 'running' ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={resetSim}
                className="border border-red-900 text-red-400 hover:border-red-700 font-semibold px-6 py-2.5 rounded-lg transition-colors"
              >
                Reset
              </button>
            </>
          )}
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${
              status === 'running'
                ? 'bg-green-500 animate-pulse'
                : status === 'paused'
                ? 'bg-yellow-500'
                : status === 'idle'
                ? 'bg-gray-600'
                : 'bg-blue-500'
            }`}
          />
          <span className="text-sm text-gray-400 capitalize">{status}</span>
        </div>

        {/* Simulation viewport */}
        <div className="card min-h-80 flex flex-col">
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">Simulation Output</div>
          {log.length === 0 ? (
            <p className="text-gray-600 text-sm m-auto">Start the simulation to see live output here.</p>
          ) : (
            <div className="font-mono text-sm space-y-1 overflow-y-auto flex-1">
              {log.map((line, i) => (
                <div key={i} className="text-green-400">
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Avatar State', 'Aide Coaching', 'Advocate Insights'].map((panel) => (
            <div key={panel} className="card">
              <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">{panel}</div>
              <p className="text-gray-600 text-sm">Awaiting simulation data...</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
