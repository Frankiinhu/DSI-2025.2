import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import SymptomChecker from '../../components/SymptomChecker';
import { useAuth } from '../../contexts/AuthContext';
import { 
  createCheckupOfflineFirst, 
  getCheckupsOfflineFirst, 
  deleteCheckupOfflineFirst,
  updateCheckupOfflineFirst,
  syncPendingCheckups,
  getSyncStatus
} from '../../services/supabase/checkup.storage.service';
import { theme } from '../../theme';

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
  const { user } = useAuth();
  const [checkupHistory, setCheckupHistory] = useState<CheckupRecord[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<CheckupRecord[]>([]);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<'today' | '7days' | '30days'>('30days');
  const [editingRecord, setEditingRecord] = useState<CheckupRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<CheckupStats>({
    totalCheckups: 0,
    checkupsToday: 0,
    consecutiveDays: 0,
  });

  useEffect(() => {
    if (user) {
      loadCheckupHistory();
    }
  }, [user]);

  // Recarregar histórico sempre que a aba receber foco
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadCheckupHistory();
      }
    }, [user])
  );

  const loadCheckupHistory = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await getCheckupsOfflineFirst(user.id);
      
      if (!response.ok || !response.checkups) {
        throw new Error(response.message || 'Erro ao carregar checkups');
      }
      
      // Converter formato local para formato do componente
      const history: CheckupRecord[] = response.checkups.map((checkup) => ({
        id: checkup.id,
        date: checkup.date,
        symptoms: checkup.symptoms,
        results: checkup.results,
        timestamp: checkup.timestamp,
      }));
      
      setCheckupHistory(history);
      calculateStats(history);
      
      // Tentar sincronizar pendentes em background
      syncPendingCheckups().catch(err => 
        console.error('Background sync error:', err)
      );
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      Alert.alert('Erro', 'Não foi possível carregar o histórico de verificações');
    } finally {
      setLoading(false);
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
    if (!user) {
      Alert.alert('Erro', 'Você precisa estar logado para salvar verificações');
      return;
    }

    try {
      setLoading(true);
      
      // Se está editando um checkup existente, atualiza em vez de criar
      if (editingRecord) {
        const response = await updateCheckupOfflineFirst(
          editingRecord.id,
          user.id,
          symptoms,
          results
        );
        
        if (!response.ok) {
          throw new Error(response.message || 'Erro ao atualizar verificação');
        }
        
        // Recarregar histórico
        await loadCheckupHistory();
        
        // Mostrar feedback apropriado
        if (response.checkup?.syncStatus === 'synced') {
          Alert.alert(
            '✅ Verificação Atualizada',
            'Atualizado localmente e sincronizado com o Supabase!',
            [{ text: 'OK' }]
          );
        } else if (response.checkup?.syncStatus === 'pending') {
          Alert.alert(
            '📱 Atualizado Localmente',
            'Verificação atualizada no dispositivo. Será sincronizada quando houver conexão.',
            [{ text: 'OK' }]
          );
        }
        
        setEditingRecord(null);
      } else {
        // Criar novo checkup
        const response = await createCheckupOfflineFirst(
          user.id,
          symptoms,
          results
        );
        
        if (!response.ok) {
          throw new Error(response.message || 'Erro ao salvar verificação');
        }
        
        // Recarregar histórico
        await loadCheckupHistory();
        
        // Mostrar feedback apropriado
        if (response.checkup?.syncStatus === 'synced') {
          Alert.alert(
            '✅ Verificação Salva',
            'Salvo localmente e sincronizado com o Supabase!',
            [{ text: 'OK' }]
          );
        } else if (response.checkup?.syncStatus === 'pending') {
          Alert.alert(
            '📱 Salvo Localmente',
            'Verificação salva no dispositivo. Será sincronizada quando houver conexão.',
            [{ text: 'OK' }]
          );
        } else if (response.checkup?.syncStatus === 'error') {
          Alert.alert(
            '⚠️ Salvo com Aviso',
            response.message || 'Salvo localmente, mas houve erro na sincronização.',
            [{ text: 'OK' }]
          );
        }
      }
      
    } catch (error) {
      console.error('Erro ao salvar verificação:', error);
      Alert.alert('Erro', 'Não foi possível salvar a verificação');
    } finally {
      setLoading(false);
    }
  };

  const editCheckupRecord = (record: CheckupRecord) => {
    Alert.alert(
      'Editar Verificação',
      `Esta verificação contém ${record.symptoms.length} sintoma${record.symptoms.length > 1 ? 's' : ''}: ${record.symptoms.join(', ')}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reexecutar (Criar Nova)',
          style: 'default',
          onPress: () => {
            // Simular nova análise com os mesmos sintomas (cria novo registro)
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

            // Criar novo registro (não está em modo de edição)
            const newResults = simulateNewResults();
            addCheckupRecord(record.symptoms, newResults);
          }
        },
        {
          text: 'Editar Esta Verificação',
          style: 'default',
          onPress: () => {
            setEditingRecord(record);
            Alert.alert(
              '✏️ Modo de Edição Ativado',
              'Os sintomas desta verificação aparecerão pré-selecionados no formulário acima.\n\n• Você pode adicionar novos sintomas\n• Você pode remover sintomas existentes\n• Ao concluir, esta verificação será ATUALIZADA (não criará uma nova)',
              [{ text: 'Entendido' }]
            );
          }
        }
      ]
    );
  };

  const deleteCheckupRecord = async (id: string) => {
    if (!user) return;
    
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
              setLoading(true);
              const response = await deleteCheckupOfflineFirst(id, user.id);
              
              if (!response.ok) {
                throw new Error(response.message || 'Erro ao excluir verificação');
              }
              
              // Recarregar histórico
              await loadCheckupHistory();
              Alert.alert('✅ Sucesso', 'Verificação excluída com sucesso');
            } catch (error) {
              console.error('Erro ao excluir verificação:', error);
              Alert.alert('❌ Erro', 'Não foi possível excluir a verificação');
            } finally {
              setLoading(false);
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
          {/* Loading Indicator */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingCard}>
                <MaterialIcons name="sync" size={32} color="#5559ff" />
                <Text style={styles.loadingText}>Sincronizando com Supabase...</Text>
              </View>
            </View>
          )}
          
          {/* Symptom Checker */}
          <SymptomChecker 
            onCheckupComplete={addCheckupRecord} 
            preSelectedSymptoms={editingRecord?.symptoms}
          />

          {/* Indicador de Modo de Edição */}
          {editingRecord && (
            <View style={styles.editModeCard}>
              <View style={styles.editModeHeader}>
                <MaterialIcons name="edit" size={20} color="#5559ff" />
                <Text style={styles.editModeTitle}>Modo de Edição Ativo</Text>
              </View>
              <Text style={styles.editModeText}>
                Editando verificação de {editingRecord.date}
              </Text>
              <Text style={styles.editModeSubtext}>
                {editingRecord.symptoms.length} sintoma{editingRecord.symptoms.length > 1 ? 's' : ''} pré-selecionado{editingRecord.symptoms.length > 1 ? 's' : ''}
              </Text>
              <TouchableOpacity 
                style={styles.cancelEditButton}
                onPress={() => {
                  setEditingRecord(null);
                  Alert.alert(
                    '❌ Edição Cancelada',
                    'O modo de edição foi cancelado.',
                    [{ text: 'OK' }]
                  );
                }}
              >
                <MaterialIcons name="close" size={16} color="#721c24" />
                <Text style={styles.cancelEditText}>Cancelar Edição</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: theme.background.accent,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingTop: 30,
    backgroundColor: theme.background.accent,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.surface.primary,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.border.light
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text.brand,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: theme.text.secondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  historyContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  historyHeader: {
    backgroundColor: theme.surface.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.border.light,
  },
  historyTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text.brand,
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
    backgroundColor: theme.surface.secondary,
    borderRadius: 12,
    padding: 4,
    shadowColor: theme.shadow.color,
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
    backgroundColor: theme.interactive.primary,
    shadowColor: theme.interactive.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  timeFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text.secondary,
  },
  timeFilterTextActive: {
    color: theme.text.inverse,
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
    color: theme.text.secondary,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: theme.text.muted,
    textAlign: 'center',
  },
  historyList: {
    gap: 4,
  },
  historyItemCard: {
    backgroundColor: theme.surface.secondary,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.accent.light,
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
    color: theme.text.secondary,
    fontWeight: '500',
    marginBottom: 8,
  },
  symptomsBadgeContainer: {
    marginBottom: 4,
  },
  symptomsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.accent.main,
    alignSelf: 'flex-start',
  },
  symptomsCount: {
    fontSize: 12,
    color: theme.text.brand,
    fontWeight: '700',
    marginLeft: 4,
    marginRight: 4,
  },
  symptomsLabel: {
    fontSize: 12,
    color: theme.text.brand,
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
    color: theme.text.primary,
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
    backgroundColor: theme.surface.accent,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.accent.main,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: theme.colors.neutral.light,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#d4572a',
    fontWeight: 'bold',
  },
  moreRecordsText: {
    textAlign: 'center',
    color: theme.text.muted,
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
    color: theme.colors.primary.dark,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  cancelEditButton: {
    backgroundColor: theme.colors.neutral.light,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginTop: -10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#5559ff',
    shadowColor: '#5559ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  editModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  editModeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5559ff',
    marginLeft: 8,
  },
  editModeText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  editModeSubtext: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  cancelEditButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  cancelEditText: {
    color: theme.colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#5559ff',
    fontWeight: '600',
  },
});

export default CheckupTab;