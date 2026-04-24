import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, Modal, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Colors from '../constants/Colors';

// 1. Base de Datos y Rangos
const foodDatabase = [
  { name: "Espinaca", cal: 23, carbs: 3.6, sugar: 0.4, tags: ['Vegana', 'Vegetariana', 'Carnívora'] },
  { name: "Brócoli", cal: 34, carbs: 6.6, sugar: 1.7, tags: ['Vegana', 'Vegetariana', 'Carnívora'] },
  { name: "Calabacita", cal: 17, carbs: 3.1, sugar: 2.5, tags: ['Vegana', 'Vegetariana', 'Carnívora'] },
  { name: "Zanahoria", cal: 41, carbs: 9.6, sugar: 4.7, tags: ['Vegana', 'Vegetariana', 'Carnívora'] },
  { name: "Manzana", cal: 52, carbs: 14, sugar: 10, tags: ['Vegana', 'Vegetariana', 'Carnívora'] },
  { name: "Plátano", cal: 89, carbs: 23, sugar: 12, tags: ['Vegana', 'Vegetariana', 'Carnívora'] },
  { name: "Pollo", cal: 165, carbs: 0, sugar: 0, tags: ['Carnívora'] },
  { name: "Res", cal: 250, carbs: 0, sugar: 0, tags: ['Carnívora'] },
  { name: "Huevo", cal: 155, carbs: 1.1, sugar: 1.1, tags: ['Vegetariana', 'Carnívora'] },
  { name: "Frijol", cal: 347, carbs: 63, sugar: 2, tags: ['Vegana', 'Vegetariana', 'Carnívora'] },
  { name: "Tortilla de Maíz", cal: 218, carbs: 45, sugar: 0.6, tags: ['Vegana', 'Vegetariana', 'Carnívora'] },
];

const glucosaItems = Array.from({ length: 461 }, (_, i) => i + 40); // 40 a 500 mg/dL

const mealOptions = [
  { id: 'breakfast', label: 'Desayuno', emoji: '☀️' },
  { id: 'lunch', label: 'Comida', emoji: '🥪' },
  { id: 'dinner', label: 'Cena', emoji: '🌙' },
  { id: 'extra', label: 'Adicional', emoji: '🍎' },
];

export default function AddRecordScreen() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  
  // Modales
  const [foodModalVisible, setFoodModalVisible] = useState(false);
  const [glucoseModalVisible, setGlucoseModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Estados del registro
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [foodSelected, setFoodSelected] = useState(null);
  const [carbs, setCarbs] = useState(0);
  const [calories, setCalories] = useState(0);
  const [sugar, setSugar] = useState(0);
  const [glucose, setGlucose] = useState(100); 
  const [insulin, setInsulin] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const saved = await AsyncStorage.getItem('userProfile');
        if (saved) setUserProfile(JSON.parse(saved));
      } catch (e) { console.error(e); }
    };
    loadData();
  }, []);

  const filteredFood = foodDatabase.filter(food => {
    const matchesDiet = !userProfile || !userProfile.dietType || userProfile.dietType === 'Sin restricción' || food.tags.includes(userProfile.dietType);
    const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDiet && matchesSearch;
  });

  const getStatusColor = (value, limit) => {
    if (!limit || limit === 0 || value === 0) return Colors.text;
    const percentage = (value / parseFloat(limit)) * 100;
    if (percentage >= 80) return '#F44336';
    if (percentage >= 50) return '#FF9800';
    return '#4CAF50';
  };

  const saveRecord = async () => {
    if (!selectedMeal || !foodSelected) {
      Alert.alert("Atención ⚠️", "Por favor completa los campos obligatorios.");
      return;
    }

    const newRecord = {
      id: Date.now().toString(),
      mealType: mealOptions.find(m => m.id === selectedMeal).label,
      description: foodSelected,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString(),
      glucose: glucose.toString(),
      insulin: insulin.toString(),
      carbs: carbs.toString(),
      calories: calories.toString(),
      sugar: sugar.toString(),
    };

    try {
      const existing = await AsyncStorage.getItem('allRecords');
      let records = existing ? JSON.parse(existing) : [];
      records.unshift(newRecord);
      await AsyncStorage.setItem('allRecords', JSON.stringify(records));
      Alert.alert("Éxito ✨", "Registro guardado.");
      router.back();
    } catch (e) { console.error(e); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.mainContainer}>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={Colors.primary} /></TouchableOpacity>
        <Text style={styles.navTitle}>Nuevo Registro</Text>
        <TouchableOpacity onPress={saveRecord}><Text style={styles.saveText}>Guardar</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* 1. Momento del día */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Momento del día</Text>
          <View style={styles.mealGrid}>
            {mealOptions.map((meal) => (
              <TouchableOpacity 
                key={meal.id} 
                style={[styles.mealOptionCard, selectedMeal === meal.id && styles.selectedMealCard]}
                onPress={() => setSelectedMeal(meal.id)}
              >
                <Text style={styles.mealEmoji}>{meal.emoji}</Text>
                <Text style={[styles.mealLabel, selectedMeal === meal.id && styles.selectedMealLabel]}>{meal.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 2. Buscador de Alimentos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Alimento ✍️</Text>
          <TouchableOpacity style={styles.fullInput} onPress={() => setFoodModalVisible(true)}>
            <Text style={{ color: foodSelected ? Colors.text : '#999' }}>{foodSelected || "Buscar en la tabla nutricional..."}</Text>
            <Ionicons name="search" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* 3. Resumen Nutricional */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Impacto Nutricional</Text>
          <View style={styles.nutritionRow}>
            <View style={styles.nutritionItem}>
              <Text style={styles.miniLabel}>Carbs</Text>
              <Text style={[styles.nutritionValue, { color: getStatusColor(carbs, userProfile?.limitCarbs) }]}>{carbs}g</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.miniLabel}>Calorías</Text>
              <Text style={[styles.nutritionValue, { color: getStatusColor(calories, userProfile?.limitCalories) }]}>{calories}kcal</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.miniLabel}>Azúcar</Text>
              <Text style={[styles.nutritionValue, { color: getStatusColor(sugar, userProfile?.limitSugar) }]}>{sugar}g</Text>
            </View>
          </View>
        </View>

        {/* 4. Salud y Medicación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Salud y Medicación</Text>
          
          <Text style={styles.inputLabel}>Glucosa en sangre</Text>
          <TouchableOpacity style={styles.fullInput} onPress={() => setGlucoseModalVisible(true)}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Ionicons name="water" size={20} color="#F44336" style={{marginRight: 8}}/>
              <Text style={{fontSize: 16}}>{glucose} mg/dL</Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={Colors.primary} />
          </TouchableOpacity>

          <Text style={[styles.inputLabel, {marginTop: 20}]}>Insulina aplicada (Unidades UI)</Text>
          <View style={styles.stepperContainer}>
            <TouchableOpacity onPress={() => setInsulin(Math.max(0, insulin - 1))} style={styles.stepperButton}><Ionicons name="remove" size={24} color="white" /></TouchableOpacity>
            <View style={{alignItems: 'center', width: 100}}>
                <Text style={styles.stepperValue}>{insulin}</Text>
                <Text style={{fontSize: 10, color: '#999'}}>Unidades</Text>
            </View>
            <TouchableOpacity onPress={() => setInsulin(insulin + 1)} style={styles.stepperButton}><Ionicons name="add" size={24} color="white" /></TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* MODAL ALIMENTOS */}
      <Modal visible={foodModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Buscar Alimento</Text>
            <TouchableOpacity onPress={() => setFoodModalVisible(false)}><Ionicons name="close-circle" size={30} color="#666" /></TouchableOpacity>
          </View>
          <View style={styles.searchBar}><Ionicons name="search" size={20} color="#999" /><TextInput style={styles.searchInput} placeholder="Nombre..." value={searchQuery} onChangeText={setSearchQuery} /></View>
          <FlatList data={filteredFood} keyExtractor={(item) => item.name} renderItem={({ item }) => (
            <TouchableOpacity style={styles.foodItem} onPress={() => { setFoodSelected(item.name); setCarbs(item.carbs); setCalories(item.cal); setSugar(item.sugar); setFoodModalVisible(false); setSearchQuery(''); }}>
              <View><Text style={styles.foodItemName}>{item.name}</Text><Text style={styles.foodItemDetails}>{item.carbs}g Carbs | {item.cal} kcal</Text></View>
              <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
            </TouchableOpacity>
          )} />
        </View></View>
      </Modal>

      {/* MODAL GLUCOSA (SCROLL) */}
      <Modal visible={glucoseModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}><View style={[styles.modalContent, {height: '50%'}]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nivel de Glucosa</Text>
            <TouchableOpacity onPress={() => setGlucoseModalVisible(false)}><Ionicons name="close-circle" size={30} color="#666" /></TouchableOpacity>
          </View>
          <FlatList data={glucosaItems} keyExtractor={(item) => item.toString()} renderItem={({ item }) => (
            <TouchableOpacity style={styles.foodItem} onPress={() => { setGlucose(item); setGlucoseModalVisible(false); }}>
              <Text style={{fontSize: 18, textAlign: 'center', width: '100%'}}>{item} mg/dL</Text>
            </TouchableOpacity>
          )} />
        </View></View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: Colors.background },
  navbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: Colors.border },
  navTitle: { fontSize: 18, fontWeight: 'bold' },
  saveText: { color: Colors.primary, fontWeight: 'bold', fontSize: 16 },
  contentContainer: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  mealGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  mealOptionCard: { backgroundColor: 'white', width: '48%', borderRadius: 12, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  selectedMealCard: { borderColor: Colors.primary, backgroundColor: '#E3F2FD', borderWidth: 2 },
  mealEmoji: { fontSize: 30, marginBottom: 5 },
  mealLabel: { fontSize: 14, fontWeight: '500' },
  selectedMealLabel: { color: Colors.primary, fontWeight: '700' },
  fullInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  nutritionRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'white', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  nutritionItem: { alignItems: 'center' },
  nutritionValue: { fontSize: 20, fontWeight: 'bold' },
  miniLabel: { fontSize: 11, color: '#666', marginBottom: 4 },
  inputLabel: { fontSize: 14, color: '#666', marginBottom: 8 },
  stepperContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: 'white', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  stepperButton: { backgroundColor: Colors.primary, width: 45, height: 45, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  stepperValue: { fontSize: 28, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, height: '80%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 12, marginBottom: 15 },
  searchInput: { flex: 1, paddingVertical: 12, marginLeft: 10, fontSize: 16 },
  foodItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  foodItemName: { fontSize: 16, fontWeight: '600' },
  foodItemDetails: { fontSize: 12, color: '#888' }
});