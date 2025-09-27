import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SymptomChecker from '../../components/SymptomChecker';

interface CheckupRecord {
  id: string;
  date: string;
  symptoms: string[];
  results: Record<string, number>;
}

const CheckupTab: React.FC = () => {
  const [checkupHistory, setCheckupHistory] = useState<CheckupRecord[]>([]);

  useEffect(() => {
    loadCheckupHistory();
  }, []);

  const loadCheckupHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('checkupHistory');
      if (history) {
        setCheckupHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const addCheckupRecord = async (symptoms: string[], results: Record<string, number>) => {
    try {
      const newRecord: CheckupRecord = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        symptoms,
        results,
      };

      const updatedHistory = [newRecord, ...checkupHistory];
      await AsyncStorage.setItem('checkupHistory', JSON.stringify(updatedHistory));
      setCheckupHistory(updatedHistory);
      
      Alert.alert('Sucesso', 'Verificação registrada no histórico!');
    } catch (error) {
      console.error('Erro ao salvar verificação:', error);
      Alert.alert('Erro', 'Não foi possível salvar a verificação.');
    }
  };

  const deleteCheckupRecord = async (id: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta verificação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedHistory = checkupHistory.filter(record => record.id !== id);
              await AsyncStorage.setItem('checkupHistory', JSON.stringify(updatedHistory));
              setCheckupHistory(updatedHistory);
              Alert.alert('Sucesso', 'Verificação excluída!');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir a verificação.');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#5559ff" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Verificação de Sintomas</Text>
          <Text style={styles.headerSubtitle}>Analise seus sintomas e acompanhe seu histórico</Text>
        </View>

        <View style={styles.container}>
          <SymptomChecker onCheckupComplete={addCheckupRecord} />

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Verificações hoje</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>7</Text>
              <Text style={styles.statLabel}>Dias consecutivos</Text>
            </View>
          </View>

          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Histórico de Verificações</Text>
            
            {checkupHistory.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Nenhuma verificação realizada ainda.</Text>
                <Text style={styles.emptyStateSubtext}>Use o verificador acima para começar.</Text>
              </View>
            ) : (
              checkupHistory.map((record) => (
                <View key={record.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>{formatDate(record.date)}</Text>
                    <TouchableOpacity
                      onPress={() => deleteCheckupRecord(record.id)}
                      style={styles.deleteBtn}
                    >
                      <Text style={styles.deleteText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.symptomsLabel}>Sintomas:</Text>
                  <Text style={styles.symptomsText}>{record.symptoms.join(', ')}</Text>
                  
                  <Text style={styles.resultsLabel}>Principais resultados:</Text>
                  {Object.entries(record.results)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3)
                    .map(([condition, percentage]) => (
                      <View key={condition} style={styles.resultRow}>
                        <Text style={styles.resultCondition}>{condition}</Text>
                        <Text style={styles.resultPercentage}>{percentage}%</Text>
                      </View>
                    ))}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#a4a8ff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#5559ff',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  container: {
    padding: 20,
    paddingTop: 30,
  },
  historySection: {
    marginTop: 20,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5559ff',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5559ff',
  },
  deleteBtn: {
    padding: 4,
  },
  deleteText: {
    fontSize: 16,
  },
  symptomsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  symptomsText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  resultsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultCondition: {
    fontSize: 14,
    color: '#333',
  },
  resultPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5559ff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
    marginBottom: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#5559ff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default CheckupTab;