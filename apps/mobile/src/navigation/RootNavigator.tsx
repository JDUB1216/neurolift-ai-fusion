import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { HomeScreen } from '@/screens/HomeScreen'
import { SimulationScreen } from '@/screens/SimulationScreen'
import { DashboardScreen } from '@/screens/DashboardScreen'
import { ProfileScreen } from '@/screens/ProfileScreen'
import { LoginScreen } from '@/screens/LoginScreen'

export type RootStackParamList = {
  Auth: undefined
  Main: undefined
}

export type MainTabParamList = {
  Home: undefined
  Simulation: undefined
  Dashboard: undefined
  Profile: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<MainTabParamList>()

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#111827', borderTopColor: '#1f2937' },
        tabBarActiveTintColor: '#4f6ef7',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Simulation" component={SimulationScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

export function RootNavigator() {
  // TODO: drive auth state from Supabase session
  const isAuthenticated = false

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Auth" component={LoginScreen} />
      )}
    </Stack.Navigator>
  )
}
