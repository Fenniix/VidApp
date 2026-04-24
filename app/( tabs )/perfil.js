import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, Switch, Modal, FlatList } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';
import DateTimePicker from '@react-native-community/datetimepicker';

// Rangos para selectores
const pesosItems = Array.from({ length: 151 }, (_, i) => i + 40);
const estaturasItems = Array.from({ length: 101 }, (_, i) => i + 120);
const carbsItems = Array.from({ length: 81 }, (_, i) => i * 5);
const caloriesItems = Array.from({ length: 61 }, (_, i) => (i * 50) + 1000);
const sugarItems = Array.from({ length: 21 }, (_, i) => i * 5);

// Listas Maestras
const diabetesTypes = ['Tipo 1', 'Tipo 2', 'Gestacional', 'Prediabetes'];
const activityLevels = ['Nulo', 'Ligero', 'Moderado', 'Muy Activo'];
const dietOptions = ['Carnívora', 'Vegana', 'Vegetariana', 'Sin restricción'];
const medicationOptions = ['Metformina', 'Insulina', 'Sitagliptina', 'Empagliflozina', 'Glimepirida', 'Semaglutida', 'Solo Dieta/Ejercicio', 'Otro'];
const allergyOptions = ['Lácteos', 'Gluten', 'Huevos', 'Maní/Cacahuates', 'Frutos de Cáscara', 'Soja', 'Pescados', 'Mariscos', 'Ninguna'];

export default function ProfileScreen() {
  const router = useRouter();

  // Estados
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [modalConfig, setModalConfig] = useState({ visible: false, type: '', data: [], field: '' });
  const [userProfile, setUserProfile] = useState({
    name: '',
    birthDate: { day: '', month: '', year: '' },
    dietType: null,
    allergies: [],
    peso: '',
    estatura: '',
    typeOfDiabetes: null,
    activityLevel: null,
    medication: null,
    useInsulin: false,
    insulinDose: '',
    limitCarbs: '',
    limitCalories: '',
    limitSugar: '',
  });

  // Carga de datos
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const saved = await AsyncStorage.getItem('userProfile');
        if (saved) {
          const data = JSON.parse(saved);
          setUserProfile(data);
        }
      } catch (e) {
        console.error("Error cargando perfil", e);
      }
    };
    loadProfile();
  }, []);

  // Handlers
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setUserProfile(prev => ({
        ...prev,
        birthDate: {
          day: selectedDate.getDate().toString(),
          month: (selectedDate.getMonth() + 1).toString(),
          year: selectedDate.getFullYear().toString(),
        }
      }));
    }
  };

  const openPicker = (type, field, data) => setModalConfig({ visible: true, type, field, data });

  const selectOption = (value) => {
    updateField(modalConfig.field, value.toString());
    setModalConfig(prev => ({ ...prev, visible: false }));
  };

  const toggleAllergy = (allergy) => {
    let newAllergies = [...userProfile.allergies];
    if (newAllergies.includes(allergy)) {
      newAllergies = newAllergies.filter(a => a !== allergy);
    } else {
      if (allergy === 'Ninguna') newAllergies = ['Ninguna'];
      else {
        newAllergies = newAllergies.filter(a => a !== 'Ninguna').concat(allergy);
      }
    }
    updateField('allergies', newAllergies);
  };

  const updateField = (field, value) => setUserProfile(prev => ({ ...prev, [field]: value }));

  const saveProfile = async () => {
    const { name, peso, estatura, typeOfDiabetes, activityLevel } = userProfile;
    if (!name || !peso || !estatura || !typeOfDiabetes || !activityLevel) {
      Alert.alert("Campos incompletos ⚠️", "Por favor rellena los datos obligatorios.");
      return;
    }
    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));
      Alert.alert("Éxito ✨", "Perfil actualizado correctamente");
      router.back();
    } catch (e) {
      console.error("Error guardando", e);
    }
  };

  const calcularIMC = () => {
    const p = parseFloat(userProfile.peso);
    const e = parseFloat(userProfile.estatura) / 100;
    if (p > 0 && e > 0) {
      const imc = (p / (e * e)).toFixed(1);
      let nivel = "Normal", color = "#4CAF50";
      if (imc < 18.5) { nivel = "Bajo peso"; color = "#FF9800"; }
      else if (imc >= 25 && imc < 30) { nivel = "Sobrepeso"; color = "#FF9800"; }
      else if (imc >= 30) { nivel = "Obesidad"; color = "#F44336"; }
      return { imc, nivel, color };
    }
    return null;
  };

  const resultadoIMC = calcularIMC();

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
        {/* Sección 0: Datos Personales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>0. Datos Personales 👤</Text>
          <Text style={styles.inputLabel}>Nombre completo</Text>
          <TextInput 
            style={styles.fullInput} 
            placeholder="Nombre completo" 
            value={userProfile.name} 
            onChangeText={(t) => updateField('name', t)} 
          />
          <Text style={styles.inputLabel}>Fecha de Nacimiento</Text>
          <TouchableOpacity style={styles.fullInput} onPress={() => setShowDatePicker(true)}>
            <Text style={{ color: userProfile.birthDate.year ? Colors.text : '#999' }}>
              {userProfile.birthDate.year ? `${userProfile.birthDate.day}/${userProfile.birthDate.month}/${userProfile.birthDate.year}` : "Seleccionar fecha"}
            </Text>
          </TouchableOpacity>
          {showDatePicker && <DateTimePicker value={new Date(2000, 0, 1)} mode="date" display="default" onChange={onDateChange} />}
        </View>

        {/* Sección 1: Mediciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Mediciones Corporales ⚖️</Text>
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.inputWrapper} onPress={() => openPicker('Peso', 'peso', pesosItems)}>
              <MaterialCommunityIcons name="weight-kilogram" size={20} color={Colors.primary} />
              <Text style={styles.pickerValueText}>{userProfile.peso || "--"}</Text>
              <Text style={styles.unitText}>kg</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.inputWrapper} onPress={() => openPicker('Estatura', 'estatura', estaturasItems)}>
              <MaterialCommunityIcons name="human-male-height" size={20} color={Colors.primary} />
              <Text style={styles.pickerValueText}>{userProfile.estatura || "--"}</Text>
              <Text style={styles.unitText}>cm</Text>
            </TouchableOpacity>
          </View>
          {resultadoIMC && (
            <View style={[styles.imcCard, { borderColor: resultadoIMC.color }]}>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.imcLabel}>Tu IMC Actual</Text>
                <Text style={[styles.imcValue, { color: resultadoIMC.color }]}>{resultadoIMC.imc}</Text>
              </View>
              <View style={styles.imcDivider} />
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.imcLabel}>Estado</Text>
                <Text style={[styles.imcStatus, { color: resultadoIMC.color }]}>{resultadoIMC.nivel}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Sección 2: Información Médica */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Información de Diabetes 🩸</Text>
          <Text style={styles.inputLabel}>Tipo de diabetes</Text>
          <View style={styles.selectorContainer}>
            {diabetesTypes.map(type => (
              <TouchableOpacity key={type} style={[styles.selectorChip, userProfile.typeOfDiabetes === type && styles.selectedChip]} onPress={() => updateField('typeOfDiabetes', type)}>
                <Text style={[styles.selectorChipLabel, userProfile.typeOfDiabetes === type && styles.selectedChipLabel]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Nivel de actividad</Text>
          <View style={styles.selectorContainer}>
            {activityLevels.map(level => (
              <TouchableOpacity key={level} style={[styles.selectorChip, userProfile.activityLevel === level && styles.selectedChip]} onPress={() => updateField('activityLevel', level)}>
                <Text style={[styles.selectorChipLabel, userProfile.activityLevel === level && styles.selectedChipLabel]}>{level}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.inputLabel}>Medicación principal</Text>
          <View style={styles.selectorContainer}>
            {medicationOptions.map(med => (
              <TouchableOpacity key={med} style={[styles.selectorChip, userProfile.medication === med && styles.selectedChip]} onPress={() => updateField('medication', med)}>
                <Text style={[styles.selectorChipLabel, userProfile.medication === med && styles.selectedChipLabel]}>{med}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.switchRow}>
            <MaterialCommunityIcons name="needle" size={24} color={Colors.primary} />
            <Text style={styles.switchLabel}>¿Usa insulina diariamente?</Text>
            <Switch trackColor={{ false: Colors.border, true: Colors.primary }} onValueChange={(v) => updateField('useInsulin', v)} value={userProfile.useInsulin} />
          </View>

          {userProfile.useInsulin && (
            <View style={[styles.inputWrapper, { marginTop: 10, flex: 0, width: '100%' }]}>
              <MaterialCommunityIcons name="numeric" size={24} color={Colors.primary} style={{marginRight: 10}}/>
              <TextInput style={styles.numericInput} placeholder="Dosis diaria" keyboardType="numeric" value={userProfile.insulinDose} onChangeText={(t) => updateField('insulinDose', t)} />
              <Text style={styles.unitText}>unidades UI</Text>
            </View>
          )}
        </View>

        {/* Sección 3: Dieta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Mi Dieta y Alergias 🥗</Text>
          <Text style={styles.inputLabel}>Tipo de dieta</Text>
          <View style={styles.selectorContainer}>
            {dietOptions.map(diet => (
              <TouchableOpacity key={diet} style={[styles.selectorChip, userProfile.dietType === diet && styles.selectedChip]} onPress={() => updateField('dietType', diet)}>
                <Text style={[styles.selectorChipLabel, userProfile.dietType === diet && styles.selectedChipLabel]}>{diet}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.inputLabel}>Alergias Alimentarias</Text>
          <View style={styles.selectorContainer}>
            {allergyOptions.map(allergy => (
              <TouchableOpacity key={allergy} style={[styles.selectorChip, userProfile.allergies.includes(allergy) && styles.selectedChip]} onPress={() => toggleAllergy(allergy)}>
                <Text style={[styles.selectorChipLabel, userProfile.allergies.includes(allergy) && styles.selectedChipLabel]}>{allergy}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sección 4: Límites */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Límites Diarios Sugeridos 📉</Text>
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.inputWrapper} onPress={() => openPicker('Carbohidratos', 'limitCarbs', carbsItems)}>
              <View style={{flex: 1}}><Text style={styles.miniLabel}>Carbs</Text><Text style={styles.pickerValueText}>{userProfile.limitCarbs || "--"}</Text></View>
              <Text style={styles.unitText}>g</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.inputWrapper} onPress={() => openPicker('Calorías', 'limitCalories', caloriesItems)}>
              <View style={{flex: 1}}><Text style={styles.miniLabel}>Calorías</Text><Text style={styles.pickerValueText}>{userProfile.limitCalories || "--"}</Text></View>
              <Text style={styles.unitText}>kcal</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.inputWrapper, {marginTop: 15, width: '100%'}]} onPress={() => openPicker('Azúcar', 'limitSugar', sugarItems)}>
              <View style={{flex: 1}}><Text style={styles.miniLabel}>Azúcar</Text><Text style={styles.pickerValueText}>{userProfile.limitSugar || "--"}</Text></View>
              <Text style={styles.unitText}>g</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Centrado */}
      <Modal visible={modalConfig.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona {modalConfig.type}</Text>
              <TouchableOpacity onPress={() => setModalConfig(prev => ({ ...prev, visible: false }))}>
                <Ionicons name="close-circle" size={30} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={modalConfig.data}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => selectOption(item)}>
                  <Text style={styles.modalItemText}>{item}</Text>
                  {userProfile[modalConfig.field] == item && (
                    <Ionicons name="checkmark-sharp" size={20} color={Colors.primary} style={styles.modalCheckIcon} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: Colors.background },
  navbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 15, paddingBottom: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: Colors.border, elevation: 3 },
  navTitle: { fontSize: 18, fontWeight: 'bold' },
  saveText: { color: Colors.primary, fontWeight: 'bold', fontSize: 16 },
  content: { padding: 20 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 15 },
  inputLabel: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8, marginTop: 10 },
  miniLabel: { fontSize: 10, color: Colors.primary, fontWeight: 'bold' },
  
  // Estilos Modal Centrado
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '50%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  modalItemText: { fontSize: 18, textAlign: 'center', flex: 1 },
  modalCheckIcon: { position: 'absolute', right: 20 },

  pickerValueText: { fontSize: 16, color: Colors.text, paddingVertical: 8 },
  inputRow: { flexDirection: 'row', gap: 15 },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 15, marginVertical: 5 },
  numericInput: { flex: 1, paddingVertical: 12, fontSize: 16 },
  imcCard: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 12, padding: 15, marginTop: 15, borderWidth: 2, alignItems: 'center', justifyContent: 'space-around' },
  imcLabel: { fontSize: 12, color: Colors.textSecondary },
  imcValue: { fontSize: 24, fontWeight: 'bold' },
  imcStatus: { fontSize: 18, fontWeight: '700' },
  imcDivider: { width: 1, height: '80%', backgroundColor: Colors.border },
  selectorContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectorChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: Colors.border },
  selectedChip: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  selectorChipLabel: { color: Colors.text, fontSize: 13 },
  selectedChipLabel: { color: 'white', fontWeight: 'bold' },
  fullInput: { backgroundColor: 'white', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, fontSize: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, backgroundColor: 'white', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  switchLabel: { flex: 1, fontSize: 15, marginLeft: 10 },
  unitText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600', marginLeft: 5 },
});