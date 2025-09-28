import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import SymptomChecker from '../../components/SymptomChecker';

interface CheckupRecord {
  id: string;
  date: string;
  symptoms: string[];
  results: Record<string, number>;
  timestamp: number;
}

interface CheckupStats {
  totalCheckups: number;
  checkupsToday: number;
  consecutiveDays: number;

}

const CheckupTab: React.FC = () => {
  const [checkupHistory, setCheckupHistory] = useState<CheckupRecord[]>([]);

  const [filteredHistory, setFilteredHistory] = useState<CheckupRecord[]>([]);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<'today' | '7days' | '30days'>('30days');
  const [editingRecord, setEditingRecord] = useState<CheckupRecord | null>(null);
  const [stats, setStats] = useState<CheckupStats>({
    totalCheckups: 0,
    checkupsToday: 0,
    consecutiveDays: 0,
  });


  useEffect(() => {
    loadCheckupHistory();
  }, []);

  const loadCheckupHistory = async () => {
    try {

      const historyData = await AsyncStorage.getItem('checkupHistory');
      if (historyData) {
        const history: CheckupRecord[] = JSON.parse(historyData);
        setCheckupHistory(history);
        calculateStats(history);
      }
    } catch (error) {
      console.log('Erro ao carregar histórico:', error);
    }
  };

  const calculateStats = (history: CheckupRecord[]) => {
    const today = new Date();
    const todayStr = today.toDateString();
    
    const checkupsToday = history.filter(record => 
      new Date(record.timestamp).toDateString() === todayStr
    ).length;

    // Calcular dias consecutivos
    const dates = [...new Set(history.map(record => 
      new Date(record.timestamp).toDateString()
    ))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let consecutiveDays = 0;
    const todayTime = today.getTime();
    
    for (let i = 0; i < dates.length; i++) {
      const dateTime = new Date(dates[i]).getTime();
      const daysDiff = Math.floor((todayTime - dateTime) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === i) {
        consecutiveDays++;
      } else {
        break;
      }
    }

    setStats({
      totalCheckups: history.length,
      checkupsToday,
      consecutiveDays,
    });
    
    // Aplicar filtro após calcular stats
    filterHistoryByTime(history, selectedTimeFilter);
  };

  const filterHistoryByTime = (history: CheckupRecord[], timeFilter: 'today' | '7days' | '30days') => {
    const now = new Date();
    let filteredData: CheckupRecord[] = [];

    switch (timeFilter) {
      case 'today':
        filteredData = history.filter(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate.toDateString() === now.toDateString();
        });
        break;
      case '7days':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredData = history.filter(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate >= weekAgo;
        });
        break;
      case '30days':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredData = history.filter(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate >= monthAgo;
        });
        break;
    }

    setFilteredHistory(filteredData);
  };

  const handleTimeFilterChange = (filter: 'today' | '7days' | '30days') => {
    setSelectedTimeFilter(filter);
    filterHistoryByTime(checkupHistory, filter);
  };

  const addCheckupRecord = async (symptoms: string[], results: Record<string, number>) => {
    const newRecord: CheckupRecord = {
      id: Date.now().toString(),
      date: new Date().toLocaleString('pt-BR'),
      symptoms,
      results,
      timestamp: Date.now(),
    };

    try {
      let updatedHistory: CheckupRecord[];
      
      if (editingRecord) {
        // Se está editando, remove o registro antigo e adiciona o novo no topo
        updatedHistory = [newRecord, ...checkupHistory.filter(record => record.id !== editingRecord.id)];
        setEditingRecord(null);
        
        Alert.alert(
          'Verificação Atualizada',
          'A verificação foi editada e movida para o topo do histórico.',
          [{ text: 'OK' }]
        );
      } else {
        // Nova verificação normal
        updatedHistory = [newRecord, ...checkupHistory];
      }
      
      await AsyncStorage.setItem('checkupHistory', JSON.stringify(updatedHistory));
      setCheckupHistory(updatedHistory);
      calculateStats(updatedHistory);
      filterHistoryByTime(updatedHistory, selectedTimeFilter);
    } catch (error) {
      console.log('Erro ao salvar verificação:', error);
    }
  };

  const editCheckupRecord = (record: CheckupRecord) => {
    Alert.alert(
      'Editar Verificação',
      `Esta verificação contém ${record.symptoms.length} sintoma${record.symptoms.length > 1 ? 's' : ''}: ${record.symptoms.join(', ')}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reexecutar Mesmos Sintomas',
          style: 'default',
          onPress: () => {
            // Simular nova análise com os mesmos sintomas
            const simulateNewResults = () => {
              const baseResults = record.results;
              const newResults: Record<string, number> = {};
              
              // Adicionar pequena variação nos resultados (±3%)
              Object.entries(baseResults).forEach(([condition, percentage]) => {
                const variation = (Math.random() - 0.5) * 6; // -3% a +3%
                const newPercentage = Math.max(0, Math.min(100, percentage + variation));
                newResults[condition] = Math.round(newPercentage);
              });
              
              return newResults;
            };

            // Criar novo registro
            const newResults = simulateNewResults();
            setEditingRecord(record);
            addCheckupRecord(record.symptoms, newResults);
          }
        },
        {
          text: 'Editar Verificação',
          style: 'default',
          onPress: () => {
            setEditingRecord(record);
            Alert.alert(
              'Modo de Edição Ativado',
              'Os sintomas desta verificação aparecerão pré-selecionados no formulário acima. Você pode adicionar novos sintomas ou remover os existentes.',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  const deleteCheckupRecord = async (id: string) => {
    Alert.alert(
      'Excluir Verificação',


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
              calculateStats(updatedHistory);
              filterHistoryByTime(updatedHistory, selectedTimeFilter);
            } catch (error) {
              console.log('Erro ao excluir verificação:', error);
            }
          }
        }
      ]
    );
  };

  const viewCheckupDetails = (record: CheckupRecord) => {
    const symptomsText = record.symptoms.join(', ');
    const resultsText = Object.entries(record.results)
      .sort(([,a], [,b]) => b - a)
      .map(([condition, percentage]) => `${condition}: ${percentage}%`)
      .join('\n');

    Alert.alert(
      'Detalhes da Verificação',
      `Data: ${record.date}\n\nSintomas: ${symptomsText}\n\nResultados:\n${resultsText}`,
      [{ text: 'OK' }]
    );

  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Symptom Checker */}
          <SymptomChecker 
            onCheckupComplete={addCheckupRecord} 
            preSelectedSymptoms={editingRecord?.symptoms}
          />

          {/* Botão Cancelar Edição */}
          {editingRecord && (
            <TouchableOpacity 
              style={styles.cancelEditButton}
              onPress={() => {
                setEditingRecord(null);
                Alert.alert(
                  'Edição Cancelada',
                  'O modo de edição foi cancelado.',
                  [{ text: 'OK' }]
                );
              }}
            >
              <Text style={styles.cancelEditText}>Cancelar Edição</Text>
            </TouchableOpacity>
          )}

          {/* Quick Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.checkupsToday}</Text>
              <Text style={styles.statLabel}>Verificações hoje</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.consecutiveDays}</Text>
              <Text style={styles.statLabel}>Dias consecutivos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalCheckups}</Text>
              <Text style={styles.statLabel}>Total geral</Text>
            </View>
          </View>

          {/* Histórico de Verificações */}
          <View style={styles.historyContainer}>
            {/* Header com Título e Filtro Unificados */}
            <View style={styles.historyHeader}>
              <View style={styles.historyTitleContainer}>
                <MaterialIcons name="history" size={24} color="#5559ff" />
                <Text style={styles.historyTitle}>Histórico de Verificações</Text>
              </View>
              
              {/* Barra de Filtro de Tempo */}
              <View style={styles.timeFilterContainer}>
                <TouchableOpacity 
                  style={[styles.timeFilterButton, selectedTimeFilter === 'today' && styles.timeFilterButtonActive]}
                  onPress={() => handleTimeFilterChange('today')}
                >
                  <Text style={[styles.timeFilterText, selectedTimeFilter === 'today' && styles.timeFilterTextActive]}>
                    Hoje
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.timeFilterButton, selectedTimeFilter === '7days' && styles.timeFilterButtonActive]}
                  onPress={() => handleTimeFilterChange('7days')}
                >
                  <Text style={[styles.timeFilterText, selectedTimeFilter === '7days' && styles.timeFilterTextActive]}>
                    7 dias
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.timeFilterButton, selectedTimeFilter === '30days' && styles.timeFilterButtonActive]}
                  onPress={() => handleTimeFilterChange('30days')}
                >
                  <Text style={[styles.timeFilterText, selectedTimeFilter === '30days' && styles.timeFilterTextActive]}>
                    30 dias
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Divisor visual */}
              <View style={styles.headerDivider} />
              
              {/* Conteúdo do Histórico */}
              {filteredHistory.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <MaterialIcons name="history-toggle-off" size={48} color="#ccc" />
                  <Text style={styles.emptyHistoryText}>
                    {checkupHistory.length === 0 
                      ? 'Nenhuma verificação realizada ainda'
                      : `Nenhuma verificação encontrada para ${
                          selectedTimeFilter === 'today' ? 'hoje' :
                          selectedTimeFilter === '7days' ? 'os últimos 7 dias' : 
                          'os últimos 30 dias'
                        }`
                    }
                  </Text>
                  <Text style={styles.emptyHistorySubtext}>
                    {checkupHistory.length === 0 
                      ? 'Faça sua primeira verificação de sintomas acima'
                      : 'Tente selecionar um período diferente'
                    }
                  </Text>
                </View>
              ) : (
                <View style={styles.historyList}>
                  {filteredHistory.slice(0, 10).map((record, index) => (
                    <View key={record.id} style={styles.historyItemCard}>
                    <View style={styles.historyItem}>
                      <TouchableOpacity 
                        style={styles.historyItemContent}
                        onPress={() => viewCheckupDetails(record)}
                      >
                        <View style={styles.historyItemHeader}>
                          <Text style={styles.historyItemDate}>{record.date}</Text>
                        </View>
                        <View style={styles.symptomsBadgeContainer}>
                          <View style={styles.symptomsBadge}>
                            <MaterialIcons name="medical-information" size={16} color="#5559ff" />
                            <Text style={styles.symptomsCount}>{record.symptoms.length}</Text>
                            <Text style={styles.symptomsLabel}>sintoma{record.symptoms.length > 1 ? 's' : ''}</Text>
                          </View>
                        </View>
                        <View style={styles.historyItemResults}>
                            {Object.entries(record.results)
                              .sort(([,a], [,b]) => b - a)
                              .slice(0, 2)
                              .map(([condition, percentage]) => (
                                <Text key={condition} style={styles.historyItemResult}>
                                  {condition}: {percentage}%
                                </Text>
                              ))}
                          </View>
                        </TouchableOpacity>
                        <View style={styles.actionButtons}>
                          <TouchableOpacity 
                            style={styles.editButton}
                            onPress={() => editCheckupRecord(record)}
                          >
                            <MaterialIcons name="edit" size={16} color="#5559ff" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.deleteButton}
                            onPress={() => deleteCheckupRecord(record.id)}
                          >
                            <MaterialIcons name="delete" size={16} color="#d4572a" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                  {filteredHistory.length > 10 && (
                    <Text style={styles.moreRecordsText}>
                      +{filteredHistory.length - 10} verificações mais antigas
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerNote}>
              Importante: Este é um protótipo educacional. As análises são simuladas e não substituem consulta médica profissional.
            </Text>

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

  container: {
    padding: 20,
    paddingTop: 30,
    backgroundColor: '#a4a8ff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e4e4e4'
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#5559ff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  historyContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  historyHeader: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  historyTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,

  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5559ff',

    marginLeft: 8,
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
    marginHorizontal: -20,
  },
  timeFilterContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timeFilterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  timeFilterButtonActive: {
    backgroundColor: '#5559ff',
    shadowColor: '#5559ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  timeFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  timeFilterTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyHistoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  emptyHistory: {
    padding: 30,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyHistorySubtext: {

    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },

  historyList: {
    gap: 4,
  },
  historyItemCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8e9ff',
    overflow: 'hidden',
  },
  historyItem: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemHeader: {
    marginBottom: 2,
  },
  historyItemDate: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
  },
  symptomsBadgeContainer: {
    marginBottom: 4,
  },
  symptomsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d4d8ff',
    alignSelf: 'flex-start',
  },
  symptomsCount: {
    fontSize: 12,
    color: '#5559ff',
    fontWeight: '700',
    marginLeft: 4,
    marginRight: 4,
  },
  symptomsLabel: {
    fontSize: 12,
    color: '#5559ff',
    fontWeight: '500',
  },
  historyItemStats: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  historyItemSymptoms: {
    fontSize: 11,
    color: '#5559ff',
    fontWeight: '600',
  },
  historyItemResults: {
    gap: 6,
    marginTop: 4,
  },
  historyItemResult: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    marginLeft: 16,
  },
  editButton: {
    padding: 8,
    backgroundColor: '#f0f2ff',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d4d8ff',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#fff2f2',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffe4e4',
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#d4572a',
    fontWeight: 'bold',
  },
  moreRecordsText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 12,
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  footerNote: {
    textAlign: 'center',
    color: '#4a5498',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  cancelEditButton: {
    backgroundColor: '#f8d7da',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: -10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  cancelEditText: {
    color: '#721c24',
    fontSize: 14,
    fontWeight: '600',

  },
});

export default CheckupTab;