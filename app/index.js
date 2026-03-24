import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

export default function HomeScreen() {

  const [lastMeal, setLastMeal] = useState(null);
  const isFocused = useIsFocused();

  const [userProfile, setUserProfile] = useState({
    dietType: 'No definida',
    allergies: 'Sin alergias alimentarias'
  });

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('lastRecord');
      if (jsonValue != null) {
        setLastMeal(JSON.parse(jsonValue));
      }
    } catch (e) {
      console.error("Error leyendo datos", e);
    }
  };

  const router = useRouter();

  return (
    <View style={styles.mainContainer}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <Text style={styles.logoText}>VidiApp</Text> 
        <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/perfil')}>
          <Ionicons name="person-circle-outline" size={32} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

        {/* Bienvenida */}
        <View style={styles.headerSection}>
          <Text style={styles.greetingText}>Resumen del Día</Text>
        </View>

        {/* Tarjeta de última comida */}
        <View style={[styles.card, styles.mealCardDesayuno]}>
          <View style={styles.mealHeader}>
            <View style={styles.mealTitleRow}>
              <Ionicons name="sunny-outline" size={20} color={Colors.primary} style={styles.mealIcon} />
              <Text style={styles.cardTitle}>Ultimo registro: {lastMeal?.mealType}</Text>
            </View>
            <Text style={styles.timeText}>{lastMeal?.time}</Text>
          </View>
          
          <View style={styles.mealContent}>
            <Text style={styles.mealDescription}>{lastMeal?.description || "Sin descripción"}</Text>
            <View style={styles.separator}/>
            <Text style={styles.glucoseResult}>Glucosa post-prandial: {lastMeal?.glucose} mg/dL</Text>
          </View>
        </View>

        {/* Plan nutricional */}
        <View style={styles.dietCard}>
          <View style={styles.dietHeader}>
            <Ionicons name="restaurant-outline" size={22} color={Colors.primary} />
            <Text style={styles.dietTitle}>Mi Plan Nutricional</Text>
          </View>
          
          <View style={styles.dietInfoRow}>
            <View style={styles.dietBadge}>
              <Text style={styles.dietBadgeText}>{userProfile.dietType}</Text>
            </View>
            <View style={styles.allergySection}>
              <Ionicons name="warning-outline" size={16} color="#E65100" />
              <Text style={styles.allergyText}>{userProfile.allergies}</Text>
            </View>
          </View>
        </View>

        {/* Informacion general de glucosa e insulina */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estado General</Text>
          <View style={styles.monitoringRow}>
            <View style={styles.monitoringItem}>
              <Ionicons name="water-outline" size={28} color={Colors.primary} />
              <Text style={styles.monitoringValue}>{lastMeal?.glucose || "No registrado"}</Text>
              <Text style={styles.monitoringLabel}>mg/dL</Text>
            </View>
            <View style={styles.verticalSeparator} />
            <View style={styles.monitoringItem}>
              <Ionicons name="medkit-outline" size={28} color={Colors.primary} />
              <Text style={styles.monitoringValue}>{lastMeal?.insulin || "0"}</Text>
              <Text style={styles.monitoringLabel}>Unidades</Text>
            </View>
          </View>
        </View>

        {/* Boton para añadir registro */}
        <TouchableOpacity style={styles.fabButton} onPress={() => router.push('/registro_ali')}>
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // Estilos Navbar
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 10,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  profileButton: {
    padding: 2,
  },
  // Estilos Contenido
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 20,
  },
  headerSection: {
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },

  dietCard: {
    backgroundColor: '#E1F5FE',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#B3E5FC',
  },
  dietHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  dietTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  dietInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  dietBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  dietBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  allergySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  allergyText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '600',
  },

  // Estilos de Tarjetas
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  mealCardDesayuno: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealIcon: {
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  mealContent: {
    marginTop: 4,
  },
  mealDescription: {
    fontSize: 16,
    color: Colors.text,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  glucoseResult: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  // Estilos Monitoreo
  monitoringRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 15,
  },
  monitoringItem: {
    alignItems: 'center',
    flex: 1,
  },
  monitoringValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 5,
  },
  monitoringLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: -4,
  },
  verticalSeparator: {
    width: 1,
    height: '80%',
    backgroundColor: Colors.border,
  },
  // Botón 
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: Colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});