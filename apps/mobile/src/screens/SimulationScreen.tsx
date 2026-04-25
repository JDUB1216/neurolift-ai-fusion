import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type Status = 'idle' | 'running' | 'paused'

export function SimulationScreen() {
  const [status, setStatus] = useState<Status>('idle')
  const [log, setLog] = useState<string[]>([])

  function start() {
    setStatus('running')
    setLog([
      '[SIM] Initializing world engine...',
      '[SIM] Loading avatar profiles...',
      '[SIM] Starting scenario...',
    ])
  }

  function toggle() {
    setStatus((s) => (s === 'running' ? 'paused' : 'running'))
  }

  function reset() {
    setStatus('idle')
    setLog([])
  }

  return (
    <SafeAreaView style={s.container}>
      <Text style={s.title}>Simulation</Text>

      {/* Status */}
      <View style={s.statusRow}>
        <View style={[s.dot, status === 'running' && s.dotGreen, status === 'paused' && s.dotYellow]} />
        <Text style={s.statusText}>{status}</Text>
      </View>

      {/* Controls */}
      <View style={s.controls}>
        {status === 'idle' && (
          <TouchableOpacity style={s.primaryBtn} onPress={start}>
            <Text style={s.primaryBtnText}>Start</Text>
          </TouchableOpacity>
        )}
        {status !== 'idle' && (
          <>
            <TouchableOpacity style={s.secondaryBtn} onPress={toggle}>
              <Text style={s.secondaryBtnText}>{status === 'running' ? 'Pause' : 'Resume'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.dangerBtn} onPress={reset}>
              <Text style={s.dangerBtnText}>Reset</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Output */}
      <View style={s.output}>
        <Text style={s.outputLabel}>OUTPUT</Text>
        <ScrollView style={s.logScroll}>
          {log.length === 0 ? (
            <Text style={s.emptyLog}>Start the simulation to see output.</Text>
          ) : (
            log.map((line, i) => (
              <Text key={i} style={s.logLine}>
                {line}
              </Text>
            ))
          )}
        </ScrollView>
      </View>

      {/* Panels */}
      <View style={s.panels}>
        {['Avatar State', 'Aide Coaching', 'Insights'].map((p) => (
          <View key={p} style={s.panel}>
            <Text style={s.panelLabel}>{p}</Text>
            <Text style={s.panelEmpty}>Awaiting data...</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712', padding: 20 },
  title: { color: '#f9fafb', fontSize: 28, fontWeight: '800', marginBottom: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#374151' },
  dotGreen: { backgroundColor: '#22c55e' },
  dotYellow: { backgroundColor: '#eab308' },
  statusText: { color: '#9ca3af', fontSize: 14, textTransform: 'capitalize' },
  controls: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  primaryBtn: { backgroundColor: '#3b5bdb', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { borderWidth: 1, borderColor: '#374151', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  secondaryBtnText: { color: '#d1d5db', fontWeight: '600' },
  dangerBtn: { borderWidth: 1, borderColor: '#7f1d1d', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  dangerBtnText: { color: '#f87171', fontWeight: '600' },
  output: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', borderRadius: 12, padding: 16, flex: 1, marginBottom: 16 },
  outputLabel: { color: '#4b5563', fontSize: 10, letterSpacing: 2, marginBottom: 10 },
  logScroll: { flex: 1 },
  emptyLog: { color: '#374151', fontSize: 13 },
  logLine: { color: '#4ade80', fontFamily: 'monospace', fontSize: 12, marginBottom: 4 },
  panels: { flexDirection: 'row', gap: 8 },
  panel: { flex: 1, backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', borderRadius: 10, padding: 12 },
  panelLabel: { color: '#4b5563', fontSize: 9, letterSpacing: 1.5, marginBottom: 6 },
  panelEmpty: { color: '#374151', fontSize: 11 },
})
