import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleLogin() {
    // TODO: wire to Supabase auth
    console.log('login', { email, password })
  }

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.inner}>
        <Text style={s.logo}>NeuroLift</Text>
        <Text style={s.heading}>Sign in</Text>

        <TextInput
          style={s.input}
          placeholder="Email"
          placeholderTextColor="#4b5563"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={s.input}
          placeholder="Password"
          placeholderTextColor="#4b5563"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={s.btn} onPress={handleLogin}>
          <Text style={s.btnText}>Sign in</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={s.link}>Don't have an account? Register</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.guestBtn}>
          <Text style={s.guestBtnText}>Continue as Guest</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  inner: { flex: 1, justifyContent: 'center', padding: 28, gap: 14 },
  logo: { color: '#4f6ef7', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  heading: { color: '#f9fafb', fontSize: 30, fontWeight: '800', marginBottom: 12 },
  input: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#f9fafb',
    fontSize: 16,
  },
  btn: { backgroundColor: '#3b5bdb', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: '#4f6ef7', textAlign: 'center', fontSize: 14 },
  guestBtn: { borderWidth: 1, borderColor: '#1f2937', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  guestBtnText: { color: '#6b7280', fontWeight: '600', fontSize: 15 },
})
