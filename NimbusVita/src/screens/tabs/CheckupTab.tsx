import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons, FontAwesome6, Octicons } from '@expo/vector-icons';
import SymptomChecker from '../../components/SymptomChecker';
import { ModelInfoCard } from '../../components/ModelInfoCard';
import { ExplanationCard } from '../../components/ExplanationCard';
import type { PredictionResponse } from '../../services/ml.service';
import { useAuth } from '../../contexts/AuthContext';
import { 
  createCheckupOfflineFirst, 
  getCheckupsOfflineFirst, 
  deleteCheckupOfflineFirst,
  updateCheckupOfflineFirst
} from '../../services/supabase/checkup.storage.service';
import { Colors, Typography, Spacing, ComponentStyles, BorderRadius, Shadows } from '../../styles';
import { useNotifications } from '../../config/notifications';
import ConfirmDialog from '../../components/ConfirmDialog';

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
  const { notify } = useNotifications();
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<CheckupRecord | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [recordToView, setRecordToView] = useState<CheckupRecord | null>(null);
  const [lastPrediction, setLastPrediction] = useState<PredictionResponse | null>(null);

  useEffect(() => {
    if (user) {
      loadCheckupHistory();
    }
  }, [user]);

  const isMountedRef = React.useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Recarregar histórico sempre que a aba receber foco
  useFocusEffect(
    useCallback(() => {
      if (user && isMountedRef.current) {
        loadCheckupHistory();
      }
    }, [user])
  );

  const loadCheckupHistory = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('🔄 loadCheckupHistory: Carregando checkups para userId:', user.id);
      
      const response = await getCheckupsOfflineFirst(user.id);
      
      if (!response.ok || !response.checkups) {
        throw new Error(response.message || 'Erro ao carregar checkups');
      }
      
      console.log(`✅ Carregados ${response.checkups.length} checkups`);
      
      // Converter formato local para formato do componente
      const history: CheckupRecord[] = response.checkups.map((checkup) => {
        console.log(`  - Checkup ID: ${checkup.id}, Sintomas: ${checkup.symptoms.length}, Timestamp: ${checkup.timestamp}`);
        return {
          id: checkup.id,
          date: checkup.date,
          symptoms: checkup.symptoms,
          results: checkup.results,
          timestamp: checkup.timestamp,
        };
      });
      
      setCheckupHistory(history);
      calculateStats(history);
      
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      notify('error', {
        params: {
          title: 'Erro',
          description: 'Não foi possível carregar o histórico de verificações',
        },
      });
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

  const addCheckupRecord = async (symptoms: string[], results: Record<string, number>, predictionData?: PredictionResponse) => {
    if (!user) {
      notify('error', {
        params: {
          title: 'Erro',
          description: 'Você precisa estar logado para salvar verificações',
        },
      });
      return;
    }

    try {
      setLoading(true);
      
      // Armazenar dados da predição para exibir SHAP
      if (predictionData) {
        setLastPrediction(predictionData);
      }
      
      // Se está editando um checkup existente, atualiza em vez de criar
      if (editingRecord) {
        console.log('✏️ MODO DE EDIÇÃO DETECTADO');
        console.log('  - Editando checkup ID:', editingRecord.id);
        console.log('  - Timestamp original:', editingRecord.timestamp);
        console.log('  - Sintomas novos:', symptoms);
        
        const response = await updateCheckupOfflineFirst(
          editingRecord.id,
          user.id,
          symptoms,
          results
        );
        
        if (!response.ok) {
          console.error('❌ Erro ao atualizar:', response.message);
          throw new Error(response.message || 'Erro ao atualizar verificação');
        }
        
        console.log('✅ Checkup atualizado com sucesso!');
        
        // Recarregar histórico
        await loadCheckupHistory();
        
        notify('success', {
          params: {
            title: '✅ Verificação Atualizada',
            description: 'Sua verificação foi atualizada com sucesso!',
          },
        });
        
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
        
        notify('success', {
          params: {
            title: '✅ Verificação Salva',
            description: 'Sua verificação foi salva com sucesso!',
          },
        });
      }
      
    } catch (error) {
      console.error('Erro ao salvar verificação:', error);
      notify('error', {
        params: {
          title: 'Erro',
          description: 'Não foi possível salvar a verificação',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearRequest = () => {
    // Cancelar modo de edição se estiver ativo
    if (editingRecord) {
      setEditingRecord(null);
    }
  };

  const editCheckupRecord = (record: CheckupRecord) => {
    console.log('📝 editCheckupRecord: Iniciando edição');
    console.log('  - Record ID:', record.id);
    console.log('  - Timestamp:', record.timestamp);
    console.log('  - Sintomas:', record.symptoms);
    
    setRecordToEdit(record);
    setShowEditDialog(true);
  };

  const deleteCheckupRecord = async (id: string) => {
    setRecordToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!user || !recordToDelete) return;
    
    try {
      setLoading(true);
      const response = await deleteCheckupOfflineFirst(recordToDelete, user.id);
      
      if (!response.ok) {
        throw new Error(response.message || 'Erro ao excluir verificação');
      }
      
      // Recarregar histórico
      await loadCheckupHistory();
      notify('success', {
        params: {
          title: '✅ Sucesso',
          description: 'Verificação excluída com sucesso',
        },
      });
    } catch (error) {
      console.error('Erro ao excluir verificação:', error);
      notify('error', {
        params: {
          title: '❌ Erro',
          description: 'Não foi possível excluir a verificação',
        },
      });
    } finally {
      setLoading(false);
      setRecordToDelete(null);
    }
  };

  const viewCheckupDetails = (record: CheckupRecord) => {
    setRecordToView(record);
    setShowDetailDialog(true);
  };

  return (
    <View style={styles.safeArea}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Loading Indicator */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingCard}>
                <MaterialIcons name="hourglass-empty" size={32} color={Colors.primary} />
                <Text style={styles.loadingText}>Carregando...</Text>
              </View>
            </View>
          )}
          
          {/* Symptom Checker */}
          <SymptomChecker 
            onCheckupComplete={addCheckupRecord} 
            preSelectedSymptoms={editingRecord?.symptoms}
            onClearRequest={handleClearRequest}
          />

          {/* Indicador de Modo de Edição */}
          {editingRecord && (
            <View style={styles.editModeCard}>
              <View style={styles.editModeHeader}>
                <MaterialIcons name="edit" size={20} color={Colors.primary} />
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
                  notify('info', {
                    params: {
                      title: '❌ Edição Cancelada',
                      description: 'O modo de edição foi cancelado.',
                    },
                  });
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
            <View style={styles.historyHeader}>
              <View style={styles.historyTitleContainer}>
                <Octicons name="history" size={24} color={Colors.primary} />
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
                            <FontAwesome6 name="briefcase-medical" size={16} color={Colors.primary} />
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
                            <FontAwesome6 name="edit" size={24} color={Colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.deleteButton}
                            onPress={() => deleteCheckupRecord(record.id)}
                          >
                            <FontAwesome6 name="trash-can" size={24} color={Colors.danger} />
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

          {/* Seção de Análise do Modelo */}
          {lastPrediction && (
            <View style={styles.analysisSection}>
              <View style={styles.analysisTitleContainer}>
                <MaterialIcons name="analytics" size={24} color={Colors.primary} />
                <Text style={styles.analysisTitle}>Análise do Modelo</Text>
              </View>
              
              <Text style={styles.analysisSubtitle}>
                Entenda como o modelo de inteligência artificial chegou ao diagnóstico
              </Text>

              {/* Dashboard do Modelo com features do checkup específico */}
              <ModelInfoCard predictionData={lastPrediction} />

              {/* Explicação SHAP da última predição */}
              {lastPrediction && lastPrediction.diagnoses && lastPrediction.diagnoses.length > 0 && (
                <ExplanationCard diagnosisResults={lastPrediction} />
              )}
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerNote}>
              Importante: Este é um protótipo educacional. As análises são simuladas e não substituem consulta médica profissional.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title="Excluir Verificação"
        message="Tem certeza que deseja excluir esta verificação?"
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmColor="#d4572a"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteDialog(false);
          setRecordToDelete(null);
        }}
      />

      {/* Edit Options Dialog */}
      <Modal
        visible={showEditDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditDialog(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogContainer}>
            <Text style={styles.dialogTitle}>Editar Verificação</Text>
            <Text style={styles.dialogMessage}>
              {recordToEdit && `Esta verificação contém ${recordToEdit.symptoms.length} sintoma${recordToEdit.symptoms.length > 1 ? 's' : ''}: ${recordToEdit.symptoms.join(', ')}`}
            </Text>
            
            <TouchableOpacity
              style={styles.dialogButton}
              onPress={() => {
                if (recordToEdit) {
                  console.log('🔄 Usuário escolheu: Reexecutar (criar nova)');
                  const simulateNewResults = () => {
                    const baseResults = recordToEdit.results;
                    const newResults: Record<string, number> = {};
                    
                    Object.entries(baseResults).forEach(([condition, percentage]) => {
                      const variation = (Math.random() - 0.5) * 6;
                      const newPercentage = Math.max(0, Math.min(100, percentage + variation));
                      newResults[condition] = Math.round(newPercentage);
                    });
                    
                    return newResults;
                  };

                  const newResults = simulateNewResults();
                  addCheckupRecord(recordToEdit.symptoms, newResults);
                  setShowEditDialog(false);
                  setRecordToEdit(null);
                }
              }}
            >
              <Text style={styles.dialogButtonText}>Reexecutar (Criar nova)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dialogButton, styles.dialogButtonPrimary]}
              onPress={() => {
                if (recordToEdit) {
                  console.log('✏️ Usuário escolheu: Editar esta verificação');
                  console.log('  - Setando editingRecord com ID:', recordToEdit.id);
                  
                  setEditingRecord(recordToEdit);
                  setShowEditDialog(false);
                  setRecordToEdit(null);
                  
                  notify('info', {
                    params: {
                      title: '✏️ Modo de Edição Ativado',
                      description: 'Os sintomas aparecerão pré-selecionados. Você pode adicionar ou remover sintomas.',
                    },
                  });
                }
              }}
            >
              <Text style={[styles.dialogButtonText, styles.dialogButtonTextPrimary]}>Editar esta verificação</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dialogButton, styles.dialogButtonCancel]}
              onPress={() => {
                setShowEditDialog(false);
                setRecordToEdit(null);
              }}
            >
              <Text style={styles.dialogButtonTextCancel}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Details Dialog */}
      <Modal
        visible={showDetailDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDetailDialog(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogContainer}>
            <Text style={styles.dialogTitle}>Detalhes da Verificação</Text>
            {recordToView && (
              <View>
                <Text style={styles.detailLabel}>Data:</Text>
                <Text style={styles.detailValue}>{recordToView.date}</Text>
                
                <Text style={[styles.detailLabel, { marginTop: Spacing.md }]}>Sintomas:</Text>
                <Text style={styles.detailValue}>{recordToView.symptoms.join(', ')}</Text>
                
                <Text style={[styles.detailLabel, { marginTop: Spacing.md }]}>Resultados:</Text>
                {Object.entries(recordToView.results)
                  .sort(([,a], [,b]) => b - a)
                  .map(([condition, percentage]) => (
                    <Text key={condition} style={styles.detailResultItem}>
                      {condition}: {percentage}%
                    </Text>
                  ))}
              </View>
            )}
            
            <TouchableOpacity
              style={[styles.dialogButton, styles.dialogButtonPrimary]}
              onPress={() => {
                setShowDetailDialog(false);
                setRecordToView(null);
              }}
            >
              <Text style={[styles.dialogButtonText, styles.dialogButtonTextPrimary]}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.accent,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.accent,
  },
  container: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    backgroundColor: Colors.accent,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    marginBottom: Spacing.base,
    gap: Spacing.md,
  },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    flex: 1,
    alignItems: 'center',
    ...Shadows.md,
  },
  statNumber: {
    ...Typography.h3,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.captionBold,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  historyContainer: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  historyHeader: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    ...Shadows.md,
  },
  historyTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  historyTitle: {
    ...Typography.h5,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  headerDivider: {
    ...ComponentStyles.divider,
    marginHorizontal: -Spacing.lg,
  },
  timeFilterContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.base,
    padding: Spacing.xs,
    ...Shadows.sm,
  },
  timeFilterButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  timeFilterButtonActive: {
    backgroundColor: Colors.primary,
    ...Shadows.md,
  },
  timeFilterText: {
    ...Typography.labelSmall,
    color: Colors.textSecondary,
  },
  timeFilterTextActive: {
    ...Typography.labelSmall,
    color: Colors.textWhite,
    fontWeight: '600',
  },
  emptyHistory: {
    ...ComponentStyles.emptyState,
  },
  emptyHistoryText: {
    ...ComponentStyles.emptyStateText,
  },
  emptyHistorySubtext: {
    ...ComponentStyles.emptyStateSubtext,
  },
  historyList: {
    gap: Spacing.xs,
  },
  historyItemCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  historyItem: {
    padding: Spacing.base,
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
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  symptomsBadgeContainer: {
    marginBottom: Spacing.xs,
  },
  symptomsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    alignSelf: 'flex-start',
  },
  symptomsCount: {
    ...Typography.captionBold,
    color: Colors.primary,
    marginLeft: Spacing.xs,
    marginRight: Spacing.xs,
  },
  symptomsLabel: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '500',
  },
  historyItemResults: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  historyItemResult: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '500',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: Spacing.sm,
    marginLeft: Spacing.base,
  },
  editButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreRecordsText: {
    ...Typography.caption,
    textAlign: 'center',
    color: Colors.textTertiary,
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
  footer: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  footerNote: {
    ...Typography.bodySmall,
    textAlign: 'center',
    color: Colors.primaryDark,
    lineHeight: 20,
    paddingHorizontal: Spacing.lg,
  },
  editModeCard: {
    backgroundColor: Colors.secondaryLight,
    borderRadius: BorderRadius.base,
    padding: Spacing.base,
    marginTop: -Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    ...Shadows.md,
  },
  editModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  editModeTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  editModeText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  editModeSubtext: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  cancelEditButton: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cancelEditText: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    ...ComponentStyles.card,
    alignItems: 'center',
    ...Shadows.xl,
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
    color: Colors.primary,
    fontWeight: '600',
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  dialogContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...Shadows.xl,
  },
  dialogTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  dialogMessage: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  dialogButton: {
    backgroundColor: Colors.surfaceLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.base,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  dialogButtonPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dialogButtonCancel: {
    backgroundColor: 'transparent',
    borderColor: Colors.borderLight,
  },
  dialogButtonText: {
    ...Typography.button,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  dialogButtonTextPrimary: {
    color: Colors.textWhite,
  },
  dialogButtonTextCancel: {
    ...Typography.button,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  detailLabel: {
    ...Typography.captionBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  detailValue: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  detailResultItem: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  analysisSection: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  analysisTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  analysisTitle: {
    ...Typography.h5,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  analysisSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
});

export default CheckupTab;