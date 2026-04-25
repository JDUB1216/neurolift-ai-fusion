import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { MainTabParamList } from '@/navigation/RootNavigator'

type Nav = BottomTabNavigationProp<MainTabParamList, 'Home'>

export function HomeScreen() {
  const nav = useNavigation<Nav>()

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.logo}>NeuroLift</Text>
      <Text style={s.heading}>AI-Powered ADHD{'\n'}Coaching & Simulation</Text>
      <Text style={s.sub}>
        Experience an immersive simulation where AI avatars learn and grow with real-time coaching.
      </Text>

      <TouchableOpacity style={s.primaryBtn} onPress={() => nav.navigate('Simulation')}>
        <Text style={s.primaryBtnText}>Launch Simulation</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.secondaryBtn} onPress={() => nav.navigate('Dashboard')}>
        <Text style={s.secondaryBtnText}>View Dashboard</Text>
      </TouchableOpacity>

      {[
        { title: 'Avatar System', desc: 'ADHD trait avatars that grow through scenarios.' },
        { title: 'AI Aide Coaching', desc: 'Real-time coaching for attention and executive function.' },
        { title: 'Advocate Fusion', desc: 'Personalized insights combining experience and expertise.' },
      ].map((f) => (
        <View key={f.title} style={s.card}>
          <Text style={s.cardTitle}>{f.title}</Text>
          <Text style={s.cardDesc}>{f.desc}</Text>
        </View>
      ))}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  content: { padding: 24, paddingTop: 64, gap: 16 },
  logo: { color: '#4f6ef7', fontSize: 18, fontWeight: '700' },
  heading: { color: '#f9fafb', fontSize: 32, fontWeight: '800', lineHeight: 40, marginTop: 8 },
  sub: { color: '#9ca3af', fontSize: 16, lineHeight: 24 },
  primaryBtn: {
    backgroundColor: '#3b5bdb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#374151',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#d1d5db', fontWeight: '600', fontSize: 16 },
  card: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 16,
    padding: 20,
    gap: 6,
  },
  cardTitle: { color: '#f9fafb', fontWeight: '700', fontSize: 16 },
  cardDesc: { color: '#6b7280', fontSize: 14, lineHeight: 20 },
})
