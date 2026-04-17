import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Colors from '../constants/Colors';

const mealOptions = [
  { id: 'breakfast', label: 'Desayuno', emoji: '☀️' },
  { id: 'lunch', label: 'Comida', emoji: '🥪' },
  { id: 'dinner', label: 'Cena', emoji: '🌙' },
  { id: 'extra', label: 'Adicional', emoji: '🍎' },
];

export default function AddRecordScreen() {
  const saveRecord = async () => {
    if (!selectedMeal) {
      alert("Por favor, selecciona una comida 🍎");
      return;
    }

    const mealNames = {
      breakfast: 'Desayuno',
      lunch: 'Comida',
      dinner: 'Cena',
      extra: 'Adicional'
    };

    const newRecord = {
      mealType: mealNames[selectedMeal],
      description: description,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      glucose: glucose || "No registrado",
      insulin: insulin || "0",
      carbs: carbs || "0",
      calories: calories || "0",
      sugar: sugar || "0",
      date: new Date().toISOString().split('T')[0] // Guardamos la fecha para el historial
    };

    try {
      await AsyncStorage.setItem('lastRecord', JSON.stringify(newRecord));
      router.back();
    } catch (e) {
      console.error("Error al guardar localmente", e);
    }
    };
  const router = useRouter();
  
  // Estado para saber qué comida se seleccionó
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [description, setDescription] = useState('');
  const [glucose, setGlucose] = useState('');
  const [insulin, setInsulin] = useState('');
  const [carbs, setCarbs] = useState('');
  const [calories, setCalories] = useState('');
  const [sugar, setSugar] = useState('');

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.mainContainer}
    >
      {/* Navbar*/}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Nuevo Registro</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        
        {/* Momento del día*/}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. ¿Qué momento del día es?</Text>
          <View style={styles.mealGrid}>
            {mealOptions.map((meal) => (
              <TouchableOpacity 
                key={meal.id} 
                style={[
                  styles.mealOptionCard,
                  selectedMeal === meal.id && styles.selectedMealCard
                ]}
                onPress={() => setSelectedMeal(meal.id)}
              >
                <Text style={styles.mealEmoji}>{meal.emoji}</Text>
                <Text style={[
                  styles.mealLabel,
                  selectedMeal === meal.id && styles.selectedMealLabel
                ]}>
                  {meal.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Descripción de la comida */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Describe brevemente tu comida ✍️</Text>
          <TextInput 
            style={styles.textAreaInput}
            placeholder="Ej: Avena con plátano y café sin azúcar..."
            placeholderTextColor={Colors.textSecondary}
            value={description} onChangeText={setDescription}
            multiline={true}
            numberOfLines={4}
          />
        </View>

        {/* 3. Información Nutricional 🍎 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Información Nutricional (Aprox.)</Text>
          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="food-apple-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
            <TextInput 
              style={styles.numericInput}
              placeholder="Carbohidratos (g)"
              keyboardType="numeric"
              value={carbs}
              onChangeText={setCarbs}
            />
          </View>
          
          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="fire" size={20} color="#FF9800" style={styles.inputIcon} />
            <TextInput 
              style={styles.numericInput}
              placeholder="Calorías (kcal)"
              keyboardType="numeric"
              value={calories}
              onChangeText={setCalories}
            />
          </View>

          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="Vector-square" size={20} color="#E91E63" style={styles.inputIcon} />
            <TextInput 
              style={styles.numericInput}
              placeholder="Azúcares (g)"
              keyboardType="numeric"
              value={sugar}
              onChangeText={setSugar}
            />
          </View>
        </View>

        {/* Datos opcionales de glucosa e insulina */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Datos opcionales (si aplica)</Text>
          
          <View style={styles.inputRow}>
            <Ionicons name="water-outline" size={22} color={Colors.primary} style={styles.inputIcon} />
            <TextInput 
              style={styles.numericInput}
              placeholder="Glucosa (mg/dL)"
              placeholderTextColor={Colors.textSecondary}
              value={glucose} onChangeText={setGlucose}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="medkit-outline" size={22} color={Colors.primary} style={styles.inputIcon} />
            <TextInput 
              style={styles.numericInput}
              placeholder="Insulina aplicada (Unidades)"
              placeholderTextColor={Colors.textSecondary}
              value={insulin} onChangeText={setInsulin}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Boton de guardar */}
        <TouchableOpacity style={styles.saveButton} onPress={saveRecord}>
          <Ionicons name="checkmark-circle-outline" size={24} color="white" />
          <Text style={styles.saveButtonText}>Guardar Registro</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: 15,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 5,
  },
  navTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  // Estilos Contenido
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  // Estilos Cuadrícula de Comidas
  mealGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  mealOptionCard: {
    backgroundColor: Colors.cardBackground,
    width: '48%',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  selectedMealCard: {
    borderColor: Colors.primary,
    backgroundColor: Colors.accent, 
    borderWidth: 2,
  },
  mealEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  mealLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  selectedMealLabel: {
    color: Colors.primary,
    fontWeight: '700',
  },
  // Estilos Inputs
  textAreaInput: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    textAlignVertical: 'top',
    height: 100,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  numericInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  // Estilos Botón Guardar
  saveButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 10,
    gap: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 18,
  },
});