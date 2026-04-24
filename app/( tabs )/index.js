import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

export default function HomeScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  
  const [userProfile, setUserProfile] = useState(null);
  const [lastMeal, setLastMeal] = useState(null);
  const [dailyTotals, setDailyTotals] = useState({ carbs: 0, calories: 0, sugar: 0 });

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
  try {
    const profileValue = await AsyncStorage.getItem('userProfile');
    const allRecordsValue = await AsyncStorage.getItem('allRecords');
    
    const profile = profileValue ? JSON.parse(profileValue) : null;
    const allRecords = allRecordsValue ? JSON.parse(allRecordsValue) : [];

    setUserProfile(profile);

    if (allRecords.length > 0) {
      setLastMeal(allRecords[0]);
    }

    const today = new Date().toLocaleDateString();

    // Filtramos y sumamos los datos de hoy
    const totals = allRecords.reduce((acc, rec) => {
      if (rec.date === today) {
        acc.carbs += parseFloat(rec.carbs) || 0;
        acc.calories += parseFloat(rec.calories) || 0;
        acc.sugar += parseFloat(rec.sugar) || 0;
        acc.totalInsulin += parseFloat(rec.insulin) || 0;

        // Limpiamos el valor de glucosa para asegurarnos que sea un número válido
        const glucoseValue = parseFloat(rec.glucose);
        if (!isNaN(glucoseValue)) {
          acc.glucoseReadings.push(glucoseValue);
        }
      }
      return acc;
    }, { carbs: 0, calories: 0, sugar: 0, totalInsulin: 0, glucoseReadings: [] });

    // Calculamos el promedio
    const avg = totals.glucoseReadings.length > 0 
      ? (totals.glucoseReadings.reduce((a, b) => a + b, 0) / totals.glucoseReadings.length).toFixed(0)
      : null;

    // Actualizamos el estado con todos los valores procesados
    setDailyTotals({
      carbs: totals.carbs,
      calories: totals.calories,
      sugar: totals.sugar,
      totalInsulin: totals.totalInsulin,
      avgGlucose: avg // Guardamos el promedio o null
    });

  } catch (e) {
    console.error("Error cargando datos en Home:", e);
  }
};

  // Función para el color del semáforo dinámico
  const getProgressColor = (current, limit) => {
    if (!limit || limit === 0) return Colors.primary;
    const ratio = current / parseFloat(limit);
    if (ratio >= 0.9) return '#F44336'; // Rojo (Cerca del límite o superado)
    if (ratio >= 0.5) return '#FF9800'; // Naranja (Mitad)
    return '#4CAF50'; // Verde (Seguro)
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.navbar}>
        <Text style={styles.logoText}>VidiApp</Text> 
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.headerSection}>
          <Text style={styles.greetingText}>¡Hola, {userProfile?.name?.split(' ')[0] || 'Paciente'}!</Text>
          <Text style={styles.subGreeting}>Tu resumen para hoy, {new Date().toLocaleDateString()}</Text>
        </View>

        {/* 1. BALANCE NUTRICIONAL (Suma del día + Semáforo) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
             <Text style={styles.cardTitle}>Balance del Día 📊</Text>
             <MaterialCommunityIcons name="information-outline" size={18} color={Colors.textSecondary} />
          </View>
          
          {/* Carbohidratos */}
          <StatBar 
            label="Carbohidratos" 
            current={dailyTotals.carbs} 
            limit={userProfile?.limitCarbs} 
            unit="g"
            color={getProgressColor(dailyTotals.carbs, userProfile?.limitCarbs)}
          />

          {/* Calorías */}
          <StatBar 
            label="Calorías" 
            current={dailyTotals.calories} 
            limit={userProfile?.limitCalories} 
            unit="kcal"
            color={getProgressColor(dailyTotals.calories, userProfile?.limitCalories)}
          />

          {/* Azúcares */}
          <StatBar 
            label="Azúcares" 
            current={dailyTotals.sugar} 
            limit={userProfile?.limitSugar} 
            unit="g"
            color={getProgressColor(dailyTotals.sugar, userProfile?.limitSugar)}
          />
        </View>

        {/* 2. ÚLTIMO REGISTRO */}
        {lastMeal && (
          <View style={[styles.card, styles.mealCardDesayuno]}>
            <View style={styles.mealHeader}>
              <View style={styles.mealTitleRow}>
                <Ionicons name="time-outline" size={20} color={Colors.primary} style={{marginRight: 8}} />
                <Text style={styles.cardTitle}>Última comida: {lastMeal.mealType}</Text>
              </View>
              <Text style={styles.timeText}>{lastMeal.time}</Text>
            </View>
            <Text style={styles.mealDescription}>{lastMeal.description}</Text>
          </View>
        )}

        {/* 3. ESTADO DE SALUD (Dinámico) */}
        {(dailyTotals.avgGlucose !== "---" || dailyTotals.totalInsulin > 0) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Estado de Salud Hoy</Text>
            <View style={styles.monitoringRow}>
              <View style={styles.monitoringItem}>
                <Ionicons name="water" size={28} color="#F44336" />
                <Text style={styles.monitoringValue}>{dailyTotals.avgGlucose}</Text>
                <Text style={styles.monitoringLabel}>Glucosa Promedio (mg/dL)</Text>
              </View>
              <View style={styles.verticalSeparator} />
              <View style={styles.monitoringItem}>
                <MaterialCommunityIcons name="needle" size={28} color={Colors.primary} />
                <Text style={styles.monitoringValue}>{dailyTotals.totalInsulin}</Text>
                <Text style={styles.monitoringLabel}>Total Insulina (UI)</Text>
              </View>
            </View>
          </View>
        )}

        {/* 4. PLAN NUTRICIONAL (Sugerencia) */}
        <View style={styles.dietCard}>
          <Text style={styles.dietTitle}>💡 Sugerencia del Plan ({userProfile?.dietType || 'General'})</Text>
          <Text style={styles.dietText}>
            {dailyTotals.carbs > (userProfile?.limitCarbs * 0.8) 
              ? "Has consumido muchos carbs hoy. Prioriza verduras verdes en tu siguiente comida."
              : "Vas muy bien con tus límites. Recuerda hidratarte con suficiente agua natural."}
          </Text>
        </View>

      </ScrollView>

      {/* Botón Flotante */}
      <TouchableOpacity style={styles.fabButton} onPress={() => router.push('/registro_ali')}>
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}

// Sub-componente para las barras de progreso
const StatBar = ({ label, current, limit, unit, color }) => {
  const percentage = Math.min((current / (parseFloat(limit) || 1)) * 100, 100);
  return (
    <View style={styles.statRow}>
      <View style={styles.statLabelRow}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{current.toFixed(0)} / {limit || 0}{unit}</Text>
      </View>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: Colors.background },
  navbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 10, backgroundColor: 'white', elevation: 3 },
  logoText: { fontSize: 22, fontWeight: 'bold', color: Colors.primary },
  container: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 100 },
  headerSection: { marginBottom: 20 },
  greetingText: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
  subGreeting: { fontSize: 14, color: Colors.textSecondary },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  mealCardDesayuno: { borderLeftWidth: 5, borderLeftColor: Colors.primary },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  mealTitleRow: { flexDirection: 'row', alignItems: 'center' },
  mealDescription: { fontSize: 15, color: Colors.textSecondary },
  timeText: { fontSize: 12, color: Colors.textSecondary },
  statRow: { marginBottom: 15 },
  statLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  statLabel: { fontSize: 14, fontWeight: '500' },
  statValue: { fontSize: 12, fontWeight: 'bold' },
  progressBarBg: { height: 10, backgroundColor: '#EEEEEE', borderRadius: 5 },
  progressBarFill: { height: '100%', borderRadius: 5 },
  monitoringRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  monitoringItem: { alignItems: 'center', flex: 1 },
  monitoringValue: { fontSize: 28, fontWeight: 'bold', marginTop: 5 },
  monitoringLabel: { fontSize: 11, color: Colors.textSecondary },
  verticalSeparator: { width: 1, backgroundColor: Colors.border, height: '80%' },
  dietCard: { backgroundColor: '#E3F2FD', borderRadius: 12, padding: 16, marginBottom: 20 },
  dietTitle: { fontSize: 15, fontWeight: 'bold', color: Colors.primary, marginBottom: 5 },
  dietText: { fontSize: 13, color: '#444', lineHeight: 18 },
  fabButton: { position: 'absolute', bottom: 30, right: 25, backgroundColor: Colors.primary, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8 },
});