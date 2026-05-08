import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const API_URL = "http://192.168.1.35:3000";

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('Paciente');
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadHistory();
    }
  }, [isFocused]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const currentId = await AsyncStorage.getItem('currentUserId');
      const savedProfile = await AsyncStorage.getItem('userProfile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        const firstName = profile.nombre || profile.name || '';
        const lastName = profile.ap_paterno || profile.apPaterno || '';
        setDisplayName(`${firstName} ${lastName}`.trim() || 'Paciente');
      }

      const [resAli, resGlu] = await Promise.all([
        fetch(`${API_URL}/registro_alimento?id_usuario=eq.${currentId}&order=id_registro.desc`),
        fetch(`${API_URL}/registro_glucosa?id_usuario=eq.${currentId}&order=fecha_hora.desc`)
      ]);

      const alimentos = await resAli.json();
      const glucosa = await resGlu.json();

      const listaAlimentos = Array.isArray(alimentos) ? alimentos : [];
      const listaGlucosa = Array.isArray(glucosa) ? glucosa : [];

      const mergedHistory = listaAlimentos.map(ali => {
        const gluRelacionada = listaGlucosa.find(g => 
          g.fecha_hora.includes(ali.fecha)
        );

        return {
          id: ali.id_registro.toString(),
          date: ali.fecha,
          time: ali.hora_consumo ? ali.hora_consumo.substring(0, 5) : '--:--',
          description: ali.nom_alimento,
          carbs: ali.carbohidratos || 0,
          calories: ali.calorias || 0,
          sugar: ali.azucares || 0,
          glucose: gluRelacionada ? gluRelacionada.valor : '---'
        };
      });

      setHistory(mergedHistory);
    } catch (e) {
      console.error("Error cargando historial:", e);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    const tableRows = history.map(item => `
      <tr>
        <td>${item.date}<br/>${item.time}</td>
        <td>${item.description}</td>
        <td style="color: #F44336; font-weight: bold;">${item.glucose} mg/dL</td>
        <td>${item.carbs}g</td>
        <td>${item.sugar}g</td>
        <td>${item.calories} kcal</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid ${Colors.primary}; padding-bottom: 10px; margin-bottom: 20px; }
            h1 { color: ${Colors.primary}; margin: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #eee; padding: 10px; text-align: left; font-size: 11px; }
            th { background-color: ${Colors.primary}; color: white; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Reporte Clínico VidiApp</h1>
            <p><strong>Paciente:</strong> ${displayName}</p>
            <p><strong>Fecha de reporte:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Fecha/Hora</th>
                <th>Alimento</th>
                <th>Glucosa</th>
                <th>Carbs</th>
                <th>Azúcar</th>
                <th>Calorías</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert("Error", "No se pudo generar el reporte PDF.");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.blueBar} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>{item.date} • {item.time}</Text>
          <View style={styles.glucoseBadge}>
            <Text style={styles.glucoseBadgeText}>{item.glucose} mg/dL</Text>
          </View>
        </View>
        <Text style={styles.descriptionText}>{item.description}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="food-apple" size={16} color="#4CAF50" />
            <Text style={styles.statText}>{item.carbs}g Carbs</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="fire" size={16} color="#FF9800" />
            <Text style={styles.statText}>{item.calories} kcal</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="spoon-sugar" size={16} color="#9C27B0" />
            <Text style={styles.statText}>{item.sugar}g Azúcar</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <View style={styles.navbar}>
        <Text style={styles.navTitle}>Historial Clínico</Text>
        <TouchableOpacity onPress={generatePDF}>
          <Ionicons name="cloud-download" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{padding: 16}}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: Colors.background },
  navbar: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 4 },
  navTitle: { fontSize: 20, fontWeight: 'bold' },
  historyCard: { backgroundColor: 'white', borderRadius: 12, marginBottom: 15, flexDirection: 'row', overflow: 'hidden', elevation: 3 },
  blueBar: { width: 6, backgroundColor: Colors.primary },
  cardContent: { flex: 1, padding: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dateText: { fontSize: 12, color: '#999' },
  glucoseBadge: { backgroundColor: '#FFEBEE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  glucoseBadgeText: { fontSize: 11, color: '#F44336', fontWeight: 'bold' },
  descriptionText: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 10 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { fontSize: 11, color: '#666' }
});