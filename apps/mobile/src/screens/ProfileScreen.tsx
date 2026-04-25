import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export function ProfileScreen() {
  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        <Text style={s.title}>Profile</Text>

        <View style={s.avatar}>
          <Text style={s.avatarInitials}>NL</Text>
        </View>
        <Text style={s.name}>Guest User</Text>
        <Text style={s.email}>Sign in to save progress</Text>

        <TouchableOpacity style={s.signInBtn}>
          <Text style={s.signInBtnText}>Sign In / Register</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  content: { flex: 1, alignItems: 'center', padding: 32, gap: 12 },
  title: { color: '#f9fafb', fontSize: 28, fontWeight: '800', alignSelf: 'flex-start', marginBottom: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { color: '#93c5fd', fontSize: 28, fontWeight: '700' },
  name: { color: '#f9fafb', fontSize: 20, fontWeight: '700' },
  email: { color: '#6b7280', fontSize: 14 },
  signInBtn: {
    marginTop: 16,
    backgroundColor: '#3b5bdb',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  signInBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})
