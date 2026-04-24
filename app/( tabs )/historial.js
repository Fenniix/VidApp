import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const isFocused = useIsFocused();

  // Cargar todos los registros cada vez que entramos a la pestaña
  useEffect(() => {
    if (isFocused) {
      loadHistory();
    }
  }, [isFocused]);

  const loadHistory = async () => {
    try {
      const savedRecords = await AsyncStorage.getItem('allRecords');
      if (savedRecords) {
        setHistory(JSON.parse(savedRecords));
      }
    } catch (e) {
      console.error("Error cargando historial", e);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{item.date} - {item.time}</Text>
        <View style={styles.mealBadge}>
          <Text style={styles.mealBadgeText}>{item.mealType}</Text>
        </View>
      </View>

      <Text style={styles.descriptionText}>{item.description}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="water" size={16} color={Colors.primary} />
          <Text style={styles.statText}>{item.glucose} mg/dL</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="food-apple" size={16} color="#4CAF50" />
          <Text style={styles.statText}>{item.carbs}g Carbs</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="fire" size={16} color="#FF9800" />
          <Text style={styles.statText}>{item.calories} kcal</Text>
        </View>
      </View>
    </View>
  );
  
  const generatePDF = async () => {
    // Creamos el contenido de la tabla dinámicamente
    const tableRows = history.map(item => `
      <tr>
        <td>${item.date} ${item.time}</td>
        <td>${item.mealType}</td>
        <td>${item.glucose} mg/dL</td>
        <td>${item.carbs}g</td>
        <td>${item.calories} kcal</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
            h1 { color: #2196F3; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #2196F3; color: white; }
            .footer { margin-top: 30px; font-size: 10px; text-align: center; color: #777; }
          </style>
        </head>
        <body>
          <h1>Reporte de Control Glucémico - VidiApp</h1>
          <p><strong>Paciente:</strong> Generado el ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                <th>Fecha/Hora</th>
                <th>Comida</th>
                <th>Glucosa</th>
                <th>Carbs</th>
                <th>Calorías</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <p class="footer">Este reporte es informativo. Consulte siempre a su médico especialista.</p>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error("Error generando PDF:", error);
      Alert.alert("Error", "No se pudo generar el reporte.");
    }
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.navbar}>
        <Text style={styles.navTitle}>Historial de Registros</Text>
        <TouchableOpacity style={styles.downloadButton} onPress={generatePDF}>
          <Ionicons name="download-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {history.length > 0 ? (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="clipboard-outline" size={80} color={Colors.border} />
          <Text style={styles.emptyText}>Aún no tienes registros guardados.</Text>
        </View>
      )}
    </View>
    
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: Colors.background },
  navbar: {
    paddingTop: 50, paddingBottom: 15, paddingHorizontal: 16,
    backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: Colors.border,
    alignItems: 'center', elevation: 2,
  },
  navTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  listContent: { padding: 16 },
  historyCard: {
    backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.border,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2,
  },
  downloadButton: {
    position: 'absolute',
    right: 16,
    top: 50,
    padding: 5,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  dateText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  mealBadge: { backgroundColor: Colors.accent, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  mealBadgeText: { fontSize: 11, color: Colors.primary, fontWeight: 'bold' },
  descriptionText: { fontSize: 15, color: Colors.text, marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 10 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: Colors.text, fontWeight: '500' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { marginTop: 20, fontSize: 16, color: Colors.textSecondary, textAlign: 'center' },
});