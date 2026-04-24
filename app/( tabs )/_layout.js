import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: 'gray',
      headerShown: false, // Ocultamos el header por defecto para usar nuestras Navbars
      tabBarStyle: {
        height: 60,
        paddingBottom: 10,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
      }
    }}>
      {/* Pestaña de Inicio */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* Pestaña de Historial (NUEVA CONEXIÓN) */}
      <Tabs.Screen
        name="historial" // Debe coincidir con el nombre del archivo historial.js
        options={{
          title: 'Historial',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'time' : 'time-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* Pestaña de Perfil */}
      <Tabs.Screen
        name="perfil" // Debe coincidir con el nombre del archivo perfil.js
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}