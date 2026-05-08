import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';

export default function LobbyScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = "http://192.168.1.35:3000";

  const handleEnter = async () => {
    if (!userId) {
      Alert.alert("Dato requerido 🆔", "Por favor ingresa tu ID de usuario.");
      return;
    }

    setLoading(true);
    try {
      await AsyncStorage.removeItem('userProfile');
      await AsyncStorage.setItem('currentUserId', userId.toString());

      const response = await fetch(`${API_URL}/usuario?id_usuario=eq.${userId}`);
      const data = await response.json();

      if (data.length > 0) {
        await AsyncStorage.setItem('userName', data[0].nombre);

        Alert.alert("¡Bienvenido! ✨", `Hola ${data[0].nombre}`);
        
        router.replace('/home'); 
      } else {
        Alert.alert("Usuario no encontrado 🔍", "El ID no existe.");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    await AsyncStorage.removeItem('userProfile');
    await AsyncStorage.removeItem('currentUserId');
    router.push({ pathname: '/perfil', params: { mode: 'new' } });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="diabetes" size={80} color={Colors.primary} />
        <Text style={styles.title}>VidiApp</Text>
        <Text style={styles.subtitle}>Tu asistente inteligente para el control de glucosa</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Ingresa tu ID de Usuario</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="finger-print" size={24} color={Colors.primary} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Ej: 1"
            keyboardType="numeric"
            value={userId}
            onChangeText={setUserId}
          />
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={handleEnter} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Entrar</Text>}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.line} /><Text style={styles.dividerText}>o</Text><View style={styles.line} />
        </View>

        <TouchableOpacity style={styles.btnSecondary} onPress={handleCreateNew}>
          <Text style={styles.btnSecondaryText}>Soy nuevo, Crear Perfil</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>© 2026 VidiApp. Todos los derechos reservados.</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', padding: 25 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: Colors.primary, marginTop: 10 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 5 },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 25, elevation: 5 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 10, color: Colors.text },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 15, marginBottom: 20 },
  icon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 15, fontSize: 18, color: Colors.text },
  btnPrimary: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  btnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
  line: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: 10, color: Colors.textSecondary },
  btnSecondary: { borderWidth: 2, borderColor: Colors.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  btnSecondaryText: { color: Colors.primary, fontSize: 16, fontWeight: 'bold' },
  footer: { textAlign: 'center', marginTop: 50, color: Colors.textSecondary, fontSize: 12 }
});