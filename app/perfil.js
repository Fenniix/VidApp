import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Colors from '../constants/Colors';

// Opciones para las selecciuones de dieta, diabetes y actividad
const dietOptions = ['Carnívora', 'Vegana', 'Vegetariana'];
const diabetesTypes = ['Tipo 1', 'Tipo 2', 'Gestacional', 'Prediabetes'];
const activityLevels = ['Nulo', 'Ligero', 'Moderado', 'Muy Activo'];

export default function ProfileScreen() {
  const router = useRouter();

  // Datos personales del paciente
  const [userProfile, setUserProfile] = useState({
    name: '',
    birthDate: { day: '', month: '', year: '' },
    dietType: 'No definida',
    allergies: '',
    limitCarbs: '',
    limitCalories: '',
    limitSugar: '',
  });

  // Datos de salud por caputurar
  const [peso, setPeso] = useState('');
  const [estatura, setEstatura] = useState('');
  const [typeOfDiabetes, setTypeOfDiabetes] = useState('Tipo 1');
  const [activityLevel, setActivityLevel] = useState('Moderado');
  const [medication, setMedication] = useState('');
  const [useInsulin, setUseInsulin] = useState(false);


  // Carga de datos guardados previamente
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const saved = await AsyncStorage.getItem('userProfile');
        if (saved) {
          const data = JSON.parse(saved);
          setUserProfile(data);
          setPeso(data.peso || '');
          setEstatura(data.estatura || '');
          setTypeOfDiabetes(data.typeOfDiabetes || 'Tipo 1');
          setActivityLevel(data.activityLevel || 'Moderado');
          setMedication(data.medication || '');
          setUseInsulin(data.useInsulin || false);
        }
      } catch (e) {
        console.error("Error cargando perfil", e);
      }
    };
    loadProfile();
  }, []);

  //Guardado de datos ingresados
  const saveProfile = async () => {
    const updatedProfile = {
      ...userProfile,
      peso,
      estatura,
      typeOfDiabetes,
      activityLevel,
      medication,
      useInsulin,
    };
    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      Alert.alert("Éxito ✨", "Perfil actualizado correctamente");
      router.back();
    } catch (e) {
      console.error("Error guardando", e);
    }
  };

  return (
    <View style={styles.mainContainer}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Datos de Salud</Text>
        <TouchableOpacity onPress={saveProfile}>
          <Text style={styles.saveText}>Guardar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

          {/* Datos personales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>0. Datos Personales 👤</Text>
          <Text style={styles.inputLabel}>Nombre completo</Text>
          <TextInput 
            style={styles.fullInput}
            placeholder="Juan Pérez"
            value={userProfile.name}
            onChangeText={(t) => setUserProfile({...userProfile, name: t})}
          />
          
          <Text style={styles.inputLabel}>Fecha de Nacimiento</Text>
          <View style={styles.dateRow}>
            <TextInput 
              style={styles.dateInput} 
              placeholder="DD" 
              keyboardType="numeric" 
              maxLength={2}
              value={userProfile.birthDate.day}
              onChangeText={(t) => setUserProfile({...userProfile, birthDate: {...userProfile.birthDate, day: t}})}
            />
            <TextInput 
              style={styles.dateInput} 
              placeholder="MM" 
              keyboardType="numeric" 
              maxLength={2}
              value={userProfile.birthDate.month}
              onChangeText={(t) => setUserProfile({...userProfile, birthDate: {...userProfile.birthDate, month: t}})}
            />
            <TextInput 
              style={[styles.dateInput, { flex: 2 }]} 
              placeholder="AAAA" 
              keyboardType="numeric" 
              maxLength={4}
              value={userProfile.birthDate.year}
              onChangeText={(t) => setUserProfile({...userProfile, birthDate: {...userProfile.birthDate, year: t}})}
            />
          </View>
        </View>
        
        {/* Datos personales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Mediciones Corporales ⚖️</Text>
          <View style={styles.inputRow}>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="weight-kilogram" size={20} color={Colors.primary} style={styles.inputIcon} />
              <TextInput 
                style={styles.numericInput} 
                placeholder="Peso (kg)" 
                keyboardType="numeric" 
                maxLength={5}
                value={peso}
                onChangeText={setPeso}
              />
            </View>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="human-male-height" size={20} color={Colors.primary} style={styles.inputIcon} />
              <TextInput 
                style={styles.numericInput} 
                placeholder="Estatura (cm)" 
                keyboardType="numeric" 
                maxLength={3}
                value={estatura}
                onChangeText={setEstatura}
              />
            </View>
          </View>
        </View>

        {/* Datos medicos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Información de Diabetes 🩸</Text>
          
          {/* Tipo de diabetes */}
          <Text style={styles.inputLabel}>Tipo de diabetes</Text>
          <View style={styles.selectorContainer}>
            {diabetesTypes.map((type) => (
              <TouchableOpacity 
                key={type} 
                style={[styles.selectorChip, typeOfDiabetes === type && styles.selectedChip]}
                onPress={() => setTypeOfDiabetes(type)}
              >
                <Text style={[styles.selectorChipLabel, typeOfDiabetes === type && styles.selectedChipLabel]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Nivel de actividad */}
          <Text style={styles.inputLabel}>Nivel de actividad</Text>
          <View style={styles.selectorContainer}>
            {activityLevels.map((level) => (
              <TouchableOpacity 
                key={level} 
                style={[styles.selectorChip, activityLevel === level && styles.selectedChip]}
                onPress={() => setActivityLevel(level)}
              >
                <Text style={[styles.selectorChipLabel, activityLevel === level && styles.selectedChipLabel]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Medicación */}
          <Text style={styles.inputLabel}>Medicación</Text>
          <TextInput 
            style={styles.fullInput}
            placeholder="Metformina 850mg"
            value={medication}
            onChangeText={setMedication}
          />

          {/* Checkbox de Insulina */}
          <View style={styles.switchRow}>
            <MaterialCommunityIcons name="medkit-outline" size={24} color={Colors.primary} />
            <Text style={styles.switchLabel}>¿Usa insulina diariamente?</Text>
            <Switch
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={useInsulin ? 'white' : 'white'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={setUseInsulin}
              value={useInsulin}
            />
          </View>
        </View>

        {/* Tipos de dieta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Mi Dieta 🥗</Text>
          <View style={styles.selectorContainer}>
            {dietOptions.map((diet) => (
              <TouchableOpacity 
                key={diet} 
                style={[styles.selectorChip, userProfile.dietType === diet && styles.selectedChip]}
                onPress={() => setUserProfile({...userProfile, dietType: diet})}
              >
                <Text style={[styles.selectorChipLabel, userProfile.dietType === diet && styles.selectedChipLabel]}>
                  {diet}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Alergias */}
          <Text style={styles.inputLabel}>Alergias Alimentarias ⚠️</Text>
          <TextInput 
            style={styles.fullInput}
            placeholder="Mariscos, Lactosa..."
            value={userProfile.allergies}
            onChangeText={(t) => setUserProfile({...userProfile, allergies: t})}
          />
        </View>
        {/* Limites diarios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Límites Diarios Sugeridos 📉</Text>
          <Text style={styles.hint}>Establece tus metas máximas diarias con tu médico.</Text>
          
          <View style={styles.inputRow}>
            <View style={styles.inputWrapper}>
              <Text style={styles.miniLabel}>Carbohidratos (g)</Text>
              <TextInput 
                style={styles.numericInput} 
                keyboardType="numeric"
                value={userProfile.limitCarbs}
                onChangeText={(t) => setUserProfile({...userProfile, limitCarbs: t})}
              />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.miniLabel}>Calorías (kcal)</Text>
              <TextInput 
                style={styles.numericInput} 
                keyboardType="numeric"
                value={userProfile.limitCalories}
                onChangeText={(t) => setUserProfile({...userProfile, limitCalories: t})}
              />
            </View>
          </View>
          
          <View style={[styles.inputWrapper, {marginTop: 10}]}>
            <Text style={styles.miniLabel}>Azúcares Máximos (g)</Text>
            <TextInput 
              style={styles.numericInput} 
              keyboardType="numeric"
              value={userProfile.limitSugar}
              onChangeText={(t) => setUserProfile({...userProfile, limitSugar: t})}
            />
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: Colors.background },
  // Estilos Navbar
  navbar: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 20, paddingHorizontal: 15,
    backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: Colors.border,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
  },
  navTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, paddingLeft: 25 },
  saveText: { color: Colors.primary, fontWeight: 'bold', fontSize: 16 },
  // Estilos Contenido
  content: { padding: 20 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 20, color: Colors.text },
  inputLabel: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8, marginTop: 15 },
  //Estilos de datos personales
  dateRow: { flexDirection: 'row', gap: 10 },
  dateInput: { 
    flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 8, 
    borderWidth: 1, borderColor: Colors.border, textAlign: 'center' 
  },
  hint: { fontSize: 13, color: Colors.textSecondary, marginBottom: 15, fontStyle: 'italic' },
  miniLabel: { fontSize: 10, color: Colors.primary, fontWeight: 'bold', marginBottom: -5, marginTop: 5 },
  // Estilos Medidas (Peso/Altura)
  inputRow: { flexDirection: 'row', gap: 15 },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
  },
  inputIcon: { marginRight: 8 },
  numericInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: Colors.text },
  // Estilos Selector
  selectorContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectorChip: { 
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, 
    backgroundColor: 'white', borderWidth: 1, borderColor: Colors.border 
  },
  selectedChip: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  selectorChipLabel: { color: Colors.text, fontSize: 13, fontWeight: '500' },
  selectedChipLabel: { color: 'white', fontWeight: 'bold' },
  // Estilos Inputs
  fullInput: { 
    backgroundColor: 'white', padding: 15, borderRadius: 8, 
    borderWidth: 1, borderColor: Colors.border, fontSize: 16, color: Colors.text 
  },
  // Estilos Switch
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 25,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  switchLabel: { flex: 1, fontSize: 15, color: Colors.text, marginLeft: 10 },
});