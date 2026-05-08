import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, Switch, Modal, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router'; 
import Colors from '../../constants/Colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useIsFocused } from '@react-navigation/native';

// --- CONSTANTES ---
const API_URL = "http://192.168.1.35:3000"; 
const diabetesTypes = ['Tipo 1', 'Tipo 2', 'Gestacional', 'Prediabetes'];
const activityLevels = ['Nulo', 'Ligero', 'Moderado', 'Muy Activo'];
const dietOptions = ['Carnívora', 'Vegana', 'Vegetariana', 'Sin restricción'];
const medicationOptions = ['Metformina', 'Insulina', 'Sitagliptina', 'Empagliflozina', 'Glimepirida', 'Semaglutida', 'Solo Dieta/Ejercicio', 'Otro'];
const allergyOptions = ['Lácteos', 'Gluten', 'Huevos', 'Maní/Cacahuates', 'Frutos de Cáscara', 'Soja', 'Pescados', 'Mariscos', 'Ninguna'];
const genderOptions = ['Masculino', 'Femenino', 'Otro'];

const pesosItems = Array.from({ length: 151 }, (_, i) => i + 40);
const estaturasItems = Array.from({ length: 101 }, (_, i) => i + 120);
const carbsItems = Array.from({ length: 81 }, (_, i) => i * 5);
const caloriesItems = Array.from({ length: 61 }, (_, i) => (i * 50) + 1000);
const sugarItems = Array.from({ length: 21 }, (_, i) => i * 5);

export default function ProfileScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { mode } = useLocalSearchParams(); 

  const initialState = {
    name: '', apPaterno: '', apMaterno: '', sexo: null,
    birthDate: { day: '', month: '', year: '' },
    dietType: null, allergies: [], peso: '', estatura: '',
    typeOfDiabetes: null, activityLevel: null, medication: null,
    useInsulin: false, insulinDose: '', limitCarbs: '', limitCalories: '', limitSugar: '',
  };

  const [userProfile, setUserProfile] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [modalConfig, setModalConfig] = useState({ visible: false, type: '', data: [], field: '' });

  // --- LÓGICA DE CÁLCULO DE IMC ---
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

  useEffect(() => {
    if (isFocused) {
      const initProfile = async () => {
        setLoading(true);
        setUserProfile(initialState);
        if (mode === 'new') setLoading(false);
        else await loadDataFromDB();
      };
      initProfile();
    }
  }, [isFocused, mode]);

  const loadDataFromDB = async () => {
    try {
      const currentId = await AsyncStorage.getItem('currentUserId');
      if (!currentId) { setLoading(false); return; }

      const [resUser, resLimits] = await Promise.all([
        fetch(`${API_URL}/usuario?id_usuario=eq.${currentId}`),
        fetch(`${API_URL}/config_limites?id_usuario=eq.${currentId}`)
      ]);

      const userData = await resUser.json();
      const limitsData = await resLimits.json();

      if (userData && userData.length > 0) {
        const u = userData[0];
        const l = limitsData[0] || {};

        setUserProfile({
          name: u.nombre || '',
          apPaterno: u.ap_paterno || '',
          apMaterno: u.ap_materno || '',
          sexo: u.sexo || null,
          birthDate: u.fecha_nacimiento ? {
            year: u.fecha_nacimiento.split('-')[0],
            month: u.fecha_nacimiento.split('-')[1],
            day: u.fecha_nacimiento.split('-')[2],
          } : initialState.birthDate,
          dietType: u.dieta || null,
          allergies: u.alergias ? u.alergias.split(', ') : [],
          peso: u.peso?.toString() || '',
          estatura: u.estatura?.toString() || '',
          typeOfDiabetes: u.tipo_de_diabetes || null,
          activityLevel: u.nivel_de_actividad || null,
          medication: u.medicacion || null,
          useInsulin: u.uso_insulina || false,
          insulinDose: '',
          limitCarbs: l.lim_carbos_diarios?.toString() || '',
          limitCalories: l.lim_calorias?.toString() || '',
          limitSugar: l.lim_azucares?.toString() || '',
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => setUserProfile(prev => ({ ...prev, [field]: value }));

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      updateField('birthDate', {
        day: selectedDate.getDate().toString(),
        month: (selectedDate.getMonth() + 1).toString(),
        year: selectedDate.getFullYear().toString(),
      });
    }
  };

  const toggleAllergy = (allergy) => {
    let newAllergies = [...(userProfile.allergies || [])];
    if (newAllergies.includes(allergy)) {
      newAllergies = newAllergies.filter(a => a !== allergy);
    } else {
      if (allergy === 'Ninguna') newAllergies = ['Ninguna'];
      else newAllergies = newAllergies.filter(a => a !== 'Ninguna').concat(allergy);
    }
    updateField('allergies', newAllergies);
  };

  const openPicker = (type, field, data) => setModalConfig({ visible: true, type, field, data });
  const selectOption = (value) => {
    updateField(modalConfig.field, value.toString());
    setModalConfig(prev => ({ ...prev, visible: false }));
  };

  const saveProfile = async () => {
    const { name, apPaterno, apMaterno, sexo, birthDate, peso, estatura, typeOfDiabetes, activityLevel, medication, useInsulin, dietType, allergies, limitCarbs, limitCalories, limitSugar } = userProfile;
    if (!name || !apPaterno || !peso || !estatura || !typeOfDiabetes) {
      Alert.alert("Campos incompletos ⚠️", "Rellena los datos obligatorios.");
      return;
    }
    const formattedDate = birthDate?.year ? `${birthDate.year}-${birthDate.month.padStart(2, '0')}-${birthDate.day.padStart(2, '0')}` : null;

    try {
      const storedId = await AsyncStorage.getItem('currentUserId');
      const isNew = mode === 'new';
      const userUrl = isNew ? `${API_URL}/usuario` : `${API_URL}/usuario?id_usuario=eq.${storedId}`;

      const responseUser = await fetch(userUrl, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify({
          nombre: name, ap_paterno: apPaterno, ap_materno: apMaterno, sexo: sexo, fecha_nacimiento: formattedDate,
          peso: parseFloat(peso), estatura: parseFloat(estatura), tipo_de_diabetes: typeOfDiabetes, nivel_de_actividad: activityLevel,
          medicacion: medication, uso_insulina: useInsulin, dieta: dietType, alergias: (allergies || []).join(', ')
        })
      });

      if (responseUser.ok) {
        const userData = await responseUser.json();
        const finalId = isNew ? userData[0].id_usuario : storedId;
        await AsyncStorage.setItem('currentUserId', finalId.toString());
        await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));

        const limitUrl = isNew ? `${API_URL}/config_limites` : `${API_URL}/config_limites?id_usuario=eq.${finalId}`;
        await fetch(limitUrl, {
          method: isNew ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_usuario: parseInt(finalId),
            lim_carbos_diarios: parseInt(limitCarbs) || 0,
            lim_calorias: parseInt(limitCalories) || 0,
            lim_azucares: parseInt(limitSugar) || 0
          })
        });
        Alert.alert("Éxito ✨", "Perfil guardado.");
        isNew ? router.replace('/home') : router.back();
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo conectar al servidor.");
    }
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.primary} /><Text>Sincronizando...</Text></View>;
  }

  return (
    <View style={styles.mainContainer}>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}><Ionicons name="arrow-back" size={24} color={Colors.primary} /></TouchableOpacity>
        <Text style={styles.navTitle}>Datos de Salud</Text>
        <TouchableOpacity onPress={saveProfile} style={styles.navBtn}><Text style={styles.saveText}>Listo</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* SECCIÓN 0 - PERSONALES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>0. Datos Personales 👤</Text>
          <Text style={styles.inputLabel}>Nombre(s)</Text>
          <TextInput style={styles.fullInput} value={userProfile?.name} onChangeText={(t) => updateField('name', t)} />
          <View style={styles.inputRow}>
            <View style={{flex: 1}}><Text style={styles.inputLabel}>Ap. Paterno</Text><TextInput style={styles.fullInput} value={userProfile?.apPaterno} onChangeText={(t) => updateField('apPaterno', t)} /></View>
            <View style={{flex: 1, marginLeft: 10}}><Text style={styles.inputLabel}>Ap. Materno</Text><TextInput style={styles.fullInput} value={userProfile?.apMaterno} onChangeText={(t) => updateField('apMaterno', t)} /></View>
          </View>
        </View>

        {/* SECCIÓN 1 - IMC */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Mediciones Corporales ⚖️</Text>
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.inputWrapper} onPress={() => openPicker('Peso', 'peso', pesosItems)}>
              <MaterialCommunityIcons name="weight-kilogram" size={20} color={Colors.primary} />
              <Text style={styles.pickerValueText}>{userProfile?.peso || "--"}</Text><Text style={styles.unitText}>kg</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.inputWrapper, {marginLeft: 10}]} onPress={() => openPicker('Estatura', 'estatura', estaturasItems)}>
              <MaterialCommunityIcons name="human-male-height" size={20} color={Colors.primary} />
              <Text style={styles.pickerValueText}>{userProfile?.estatura || "--"}</Text><Text style={styles.unitText}>cm</Text>
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

        {/* SECCIÓN 2 - DIABETES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Información de Diabetes 🩸</Text>
          <Text style={styles.inputLabel}>Tipo de diabetes</Text>
          <View style={styles.selectorContainer}>
            {diabetesTypes.map(type => (
              <TouchableOpacity key={type} style={[styles.selectorChip, userProfile?.typeOfDiabetes === type && styles.selectedChip]} onPress={() => updateField('typeOfDiabetes', type)}>
                <Text style={[styles.selectorChipLabel, userProfile?.typeOfDiabetes === type && styles.selectedChipLabel]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Nivel de actividad física</Text>
          <View style={styles.selectorContainer}>
            {activityLevels.map(level => (
              <TouchableOpacity key={level} style={[styles.selectorChip, userProfile?.activityLevel === level && styles.selectedChip]} onPress={() => updateField('activityLevel', level)}>
                <Text style={[styles.selectorChipLabel, userProfile?.activityLevel === level && styles.selectedChipLabel]}>{level}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Medicación Principal</Text>
          <View style={styles.selectorContainer}>
            {medicationOptions.map(med => (
              <TouchableOpacity key={med} style={[styles.selectorChip, userProfile?.medication === med && styles.selectedChip]} onPress={() => updateField('medication', med)}>
                <Text style={[styles.selectorChipLabel, userProfile?.medication === med && styles.selectedChipLabel]}>{med}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.switchRow}>
            <MaterialCommunityIcons name="needle" size={24} color={Colors.primary} />
            <Text style={styles.switchLabel}>¿Usa insulina diariamente?</Text>
            <Switch trackColor={{ false: Colors.border, true: Colors.primary }} onValueChange={(v) => updateField('useInsulin', v)} value={userProfile?.useInsulin} />
          </View>

          {userProfile.useInsulin && (
            <View style={[styles.inputWrapper, { marginTop: 10, flex: 0, width: '100%' }]}>
              <MaterialCommunityIcons name="numeric" size={24} color={Colors.primary} style={{marginRight: 10}}/>
              <TextInput 
                style={{flex: 1, fontSize: 16}} 
                placeholder="Dosis diaria (UI)" 
                keyboardType="numeric" 
                value={userProfile.insulinDose} 
                onChangeText={(t) => updateField('insulinDose', t)} 
              />
              <Text style={styles.unitText}>unidades</Text>
            </View>
          )}
        </View>

        {/* SECCIÓN 3 - DIETA Y ALERGIAS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Mi Dieta y Alergias 🥗</Text>
          <Text style={styles.inputLabel}>Tipo de dieta</Text>
          <View style={styles.selectorContainer}>
            {dietOptions.map(diet => (
              <TouchableOpacity key={diet} style={[styles.selectorChip, userProfile?.dietType === diet && styles.selectedChip]} onPress={() => updateField('dietType', diet)}>
                <Text style={[styles.selectorChipLabel, userProfile?.dietType === diet && styles.selectedChipLabel]}>{diet}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Alergias Alimentarias</Text>
          <View style={styles.selectorContainer}>
            {allergyOptions.map(allergy => (
              <TouchableOpacity 
                key={allergy} 
                style={[styles.selectorChip, (userProfile?.allergies || []).includes(allergy) && styles.selectedChip]} 
                onPress={() => toggleAllergy(allergy)}
              >
                <Text style={[styles.selectorChipLabel, (userProfile?.allergies || []).includes(allergy) && styles.selectedChipLabel]}>{allergy}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SECCIÓN 4 - LÍMITES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Límites Diarios Sugeridos 📉</Text>
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.inputWrapper} onPress={() => openPicker('Carbohidratos', 'limitCarbs', carbsItems)}>
              <View style={{flex: 1}}>
                <Text style={styles.miniLabel}>Carbs</Text>
                <Text style={styles.pickerValueText}>{userProfile?.limitCarbs || "--"}</Text>
              </View>
              <Text style={styles.unitText}>g</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.inputWrapper, {marginLeft: 10}]} onPress={() => openPicker('Calorías', 'limitCalories', caloriesItems)}>
              <View style={{flex: 1}}>
                <Text style={styles.miniLabel}>Calorías</Text>
                <Text style={styles.pickerValueText}>{userProfile?.limitCalories || "--"}</Text>
              </View>
              <Text style={styles.unitText}>kcal</Text>
            </TouchableOpacity>
          </View>

          {/* EL SELECTOR DE AZÚCAR QUE FALTABA */}
          <TouchableOpacity style={[styles.inputWrapper, {marginTop: 15}]} onPress={() => openPicker('Azúcar', 'limitSugar', sugarItems)}>
            <View style={{flex: 1}}>
              <Text style={styles.miniLabel}>Azúcar Máxima</Text>
              <Text style={styles.pickerValueText}>{userProfile?.limitSugar || "--"}</Text>
            </View>
            <Text style={styles.unitText}>g</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={modalConfig.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>{modalConfig.type}</Text><TouchableOpacity onPress={() => setModalConfig({ ...modalConfig, visible: false })}><Ionicons name="close-circle" size={30} color={Colors.primary} /></TouchableOpacity></View>
          <FlatList data={modalConfig.data} keyExtractor={(item) => item.toString()} renderItem={({ item }) => (
            <TouchableOpacity style={styles.modalItem} onPress={() => selectOption(item)}><Text style={styles.modalItemText}>{item}</Text></TouchableOpacity>
          )}/></View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: Colors.border, elevation: 3 },
  navBtn: { width: 60 },
  navTitle: { fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  saveText: { color: Colors.primary, fontWeight: 'bold', fontSize: 16, textAlign: 'right' },
  content: { padding: 20 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 15 },
  inputLabel: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8, marginTop: 10 },
  fullInput: { backgroundColor: 'white', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, fontSize: 16 },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between' },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 10 },
  pickerValueText: { fontSize: 16, color: Colors.text, fontWeight: 'bold' },
  miniLabel: { fontSize: 10, color: Colors.primary, fontWeight: 'bold' },
  unitText: { fontSize: 12, color: Colors.textSecondary, marginLeft: 5 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, backgroundColor: 'white', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  switchLabel: { flex: 1, fontSize: 15, marginLeft: 10 },
  selectorContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectorChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: Colors.border },
  selectedChip: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  selectorChipLabel: { color: Colors.text },
  selectedChipLabel: { color: 'white', fontWeight: 'bold' },
  imcCard: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 12, padding: 15, marginTop: 15, borderWidth: 2, alignItems: 'center', justifyContent: 'space-around' },
  imcValue: { fontSize: 24, fontWeight: 'bold' },
  imcStatus: { fontSize: 18, fontWeight: '700' },
  imcLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  imcDivider: { width: 1, height: '80%', backgroundColor: Colors.border },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '50%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalItemText: { fontSize: 18, textAlign: 'center' },
});