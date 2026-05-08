import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
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
  const [loading, setLoading] = useState(true);
  const [lastMeal, setLastMeal] = useState(null);
  const [dailyTotals, setDailyTotals] = useState({ 
    carbs: 0, 
    calories: 0, 
    sugar: 0, 
    avgGlucose: "---", 
    totalInsulin: 0 
  });

  useEffect(() => {
    if (isFocused) {
      setLoading(true);
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    try {
      const currentId = await AsyncStorage.getItem('currentUserId');
      if (!currentId) {
        setLoading(false);
        return;
      }

      const API_URL = "http://192.168.1.35:3000";

      const [resUser, resLimits, resAlimentos, resGlucosa, resInsulina] = await Promise.all([
        fetch(`${API_URL}/usuario?id_usuario=eq.${currentId}`),
        fetch(`${API_URL}/config_limites?id_usuario=eq.${currentId}`),
        fetch(`${API_URL}/registro_alimento?id_usuario=eq.${currentId}&order=id_registro.desc`),
        fetch(`${API_URL}/registro_glucosa?id_usuario=eq.${currentId}`),
        fetch(`${API_URL}/registro_insulina?id_usuario=eq.${currentId}`)
      ]);

      const userData = await resUser.json();
      const limitsData = await resLimits.json();
      const rawAlimentos = await resAlimentos.json();
      const rawGlucosa = await resGlucosa.json();
      const rawInsulina = await resInsulina.json();

      const alimentosData = Array.isArray(rawAlimentos) ? rawAlimentos : [];
      const glucosaData = Array.isArray(rawGlucosa) ? rawGlucosa : [];
      const insulinaData = Array.isArray(rawInsulina) ? rawInsulina : [];

      let currentLimits = { carb: 0, cal: 0, sug: 0 };

      if (userData && userData.length > 0) {
        const u = userData[0];
        const l = limitsData[0] || {};
        currentLimits = { 
          carb: l.lim_carbos_diarios || 0, 
          cal: l.lim_calorias || 0, 
          sug: l.lim_azucares || 0 
        };
        
        setUserProfile({
          name: u.nombre,
          dietType: u.dieta,
          limitCarbs: currentLimits.carb,
          limitCalories: currentLimits.cal,
          limitSugar: currentLimits.sug,
        });
      }

      if (alimentosData.length > 0) {
        setLastMeal(alimentosData[0]);
      } else {
        setLastMeal(null);
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const nutritionTotals = alimentosData
        .filter(reg => reg.fecha === todayStr)
        .reduce((acc, curr) => {
          acc.carbs += parseFloat(curr.carbohidratos) || 0;
          acc.calories += parseFloat(curr.calorias) || 0;
          acc.sugar += parseFloat(curr.azucares) || 0;
          return acc;
        }, { carbs: 0, calories: 0, sugar: 0 });

      const glucosaHoy = glucosaData.filter(g => g.fecha_hora.startsWith(todayStr));
      const avgGlucosa = glucosaHoy.length > 0
        ? (glucosaHoy.reduce((acc, curr) => acc + curr.valor, 0) / glucosaHoy.length).toFixed(0)
        : "---";

      const totalInsulina = insulinaData
        .filter(i => i.fecha_hora.startsWith(todayStr))
        .reduce((acc, curr) => acc + curr.cantidad_total, 0);

      setDailyTotals({
        carbs: nutritionTotals.carbs,
        calories: nutritionTotals.calories,
        sugar: nutritionTotals.sugar,
        totalInsulin: totalInsulina,
        avgGlucose: avgGlucosa 
      });

      // Lógica de Alertas
      const excesos = [];
      if (currentLimits.carb > 0 && nutritionTotals.carbs >= currentLimits.carb) excesos.push("Carbohidratos");
      if (currentLimits.cal > 0 && nutritionTotals.calories >= currentLimits.cal) excesos.push("Calorías");
      if (currentLimits.sug > 0 && nutritionTotals.sugar >= currentLimits.sug) excesos.push("Azúcares");

      if (excesos.length > 0) {
        setTimeout(() => {
          Alert.alert("Límite diario alcanzado ⚠️", `Has superado tu meta en: ${excesos.join(", ")}.`);
        }, 600);
      }

    } catch (e) {
      console.error("Error Dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Cerrar Sesión", "¿Quieres salir?", [
      { text: "No" },
      { text: "Sí", onPress: async () => { await AsyncStorage.clear(); router.replace('/'); }}
    ]);
  };

  const getProgressColor = (current, limit) => {
    if (!limit || limit === 0) return Colors.primary;
    const ratio = current / parseFloat(limit);
    if (ratio >= 0.75) return '#F44336';
    if (ratio >= 0.50) return '#FF9800';
    return '#4CAF50';
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={{marginTop: 10}}>Sincronizando...</Text>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <View style={styles.navbar}>
        <Text style={styles.logoText}>VidiApp</Text>
        <TouchableOpacity onPress={handleLogout}><Ionicons name="log-out-outline" size={26} color="#FF5252" /></TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.headerSection}>
          <Text style={styles.greetingText}>¡Hola, {userProfile?.name || 'Paciente'}!</Text>
          <Text style={styles.subGreeting}>Tu actividad de hoy ({new Date().toLocaleDateString()})</Text>
        </View>

        {/* BALANCE NUTRICIONAL */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Balance del Día 📊</Text>
          <StatBar label="Carbohidratos" current={dailyTotals.carbs} limit={userProfile?.limitCarbs} unit="g" color={getProgressColor(dailyTotals.carbs, userProfile?.limitCarbs)} />
          <StatBar label="Calorías" current={dailyTotals.calories} limit={userProfile?.limitCalories} unit="kcal" color={getProgressColor(dailyTotals.calories, userProfile?.limitCalories)} />
          <StatBar label="Azúcares" current={dailyTotals.sugar} limit={userProfile?.limitSugar} unit="g" color={getProgressColor(dailyTotals.sugar, userProfile?.limitSugar)} />
        </View>

        {lastMeal && (
          <View style={styles.lastMealCard}>
            <View style={styles.blueBar} />
            <View style={styles.lastMealContent}>
              <View style={styles.lastMealHeader}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Ionicons name="time-outline" size={18} color={Colors.primary} />
                  <Text style={styles.lastMealTitle}>Última comida: Registro</Text>
                </View>
                <Text style={styles.lastMealTime}>{lastMeal.hora_consumo?.substring(0,5)}</Text>
              </View>
              <Text style={styles.lastMealFoodName}>{lastMeal.nom_alimento}</Text>
            </View>
          </View>
        )}

        {/* ESTADO DE SALUD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estado de Salud 🩺</Text>
          <View style={styles.monitoringRow}>
            <View style={styles.monitoringItem}>
              <Ionicons name="water" size={28} color="#F44336" />
              <Text style={styles.monitoringValue}>{dailyTotals.avgGlucose}</Text>
              <Text style={styles.monitoringLabel}>Promedio Glucosa</Text>
            </View>
            <View style={styles.verticalSeparator} />
            <View style={styles.monitoringItem}>
              <MaterialCommunityIcons name="needle" size={28} color={Colors.primary} />
              <Text style={styles.monitoringValue}>{dailyTotals.totalInsulin}</Text>
              <Text style={styles.monitoringLabel}>Insulina (unidades)</Text>
            </View>
          </View>
        </View>

        {/* SUGERENCIA (RESTAURADA) */}
        <View style={styles.dietCard}>
          <Text style={styles.dietTitle}>💡 Sugerencia ({userProfile?.dietType || 'General'})</Text>
          <Text style={styles.dietText}>
            {dailyTotals.carbs > (userProfile?.limitCarbs * 0.9) 
              ? "Has consumido muchos carbohidratos hoy. Intenta que tu próxima comida sea más ligera." 
              : "Mantienes un excelente control nutricional hoy. ¡Sigue así!"}
          </Text>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fabButton} onPress={() => router.push('/registro_ali')}>
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const StatBar = ({ label, current, limit, unit, color }) => {
  const percentage = Math.min((current / (parseFloat(limit) || 1)) * 100, 100);
  return (
    <View style={styles.statRow}>
      <View style={styles.statLabelRow}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{current.toFixed(0)}/{limit}{unit}</Text>
      </View>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 10, backgroundColor: 'white', elevation: 3 },
  logoText: { fontSize: 22, fontWeight: 'bold', color: Colors.primary },
  container: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 100 },
  headerSection: { marginBottom: 20 },
  greetingText: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
  subGreeting: { fontSize: 14, color: Colors.textSecondary },
  lastMealCard: { backgroundColor: 'white', borderRadius: 12, marginBottom: 16, flexDirection: 'row', overflow: 'hidden', elevation: 2 },
  blueBar: { width: 6, backgroundColor: Colors.primary },
  lastMealContent: { flex: 1, padding: 16 },
  lastMealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  lastMealTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginLeft: 8 },
  lastMealTime: { fontSize: 13, color: '#999' },
  lastMealFoodName: { fontSize: 16, color: '#666', marginLeft: 26 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 15 },
  statRow: { marginBottom: 15 },
  statLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  statLabel: { fontSize: 14 },
  statValue: { fontSize: 12, fontWeight: 'bold' },
  progressBarBg: { height: 10, backgroundColor: '#EEEEEE', borderRadius: 5 },
  progressBarFill: { height: '100%', borderRadius: 5 },
  monitoringRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  monitoringItem: { alignItems: 'center', flex: 1 },
  monitoringValue: { fontSize: 26, fontWeight: 'bold', marginVertical: 4 },
  monitoringLabel: { fontSize: 11, color: Colors.textSecondary },
  verticalSeparator: { width: 1, backgroundColor: Colors.border, height: 40 },
  dietCard: { backgroundColor: '#E3F2FD', borderRadius: 12, padding: 16 },
  dietTitle: { fontSize: 15, fontWeight: 'bold', color: Colors.primary },
  dietText: { fontSize: 13, color: '#444' },
  fabButton: { position: 'absolute', bottom: 30, right: 25, backgroundColor: Colors.primary, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8 },
});