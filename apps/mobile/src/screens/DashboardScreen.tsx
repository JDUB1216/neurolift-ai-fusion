import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export function DashboardScreen() {
  const stats = [
    { label: 'Sessions', value: '0' },
    { label: 'Avatars', value: '0' },
    { label: 'Achievements', value: '0' },
    { label: 'Streak', value: '0d' },
  ]

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Dashboard</Text>

        <View style={s.statsGrid}>
          {stats.map((st) => (
            <View key={st.label} style={s.statCard}>
              <Text style={s.statValue}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Recent Sessions</Text>
          <Text style={s.empty}>No sessions yet. Start your first simulation.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  content: { padding: 24, gap: 20 },
  title: { color: '#f9fafb', fontSize: 28, fontWeight: '800' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  statValue: { color: '#4f6ef7', fontSize: 28, fontWeight: '800' },
  statLabel: { color: '#6b7280', fontSize: 13, marginTop: 4 },
  card: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 14,
    padding: 20,
    gap: 10,
  },
  cardTitle: { color: '#f9fafb', fontSize: 18, fontWeight: '700' },
  empty: { color: '#4b5563', fontSize: 14 },
})
