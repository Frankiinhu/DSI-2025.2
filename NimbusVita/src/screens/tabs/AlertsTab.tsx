import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ToastAndroid, Platform, Alert as RNAlert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AlertCard from '../../components/AlertCard';
import MedicationsList from '../../components/MedicationsList';
import MedicationForm from '../../components/MedicationForm';
import { Colors, Typography, Spacing, ComponentStyles, BorderRadius, Shadows } from '../../styles';
import { useAuth } from '../../contexts/AuthContext';
import { getMedications, createMedication, updateMedication, deleteMedication, toggleMedicationStatus } from '../../services/supabase/medication.service';
import type { Medication, CreateMedicationDTO } from '../../types/medication.types';

const AlertsTab: React.FC = () => {
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | undefined>();
  const [loadingMedications, setLoadingMedications] = useState(false);

  // Carrega medicações
  const loadMedications = async () => {
    if (!user) return;
    setLoadingMedications(true);
    const result = await getMedications(user.id);
    if (result.ok && Array.isArray(result.data)) {
      setMedications(result.data);
    }
    setLoadingMedications(false);
  };

  // Verifica horários das medicações e exibe alertas
  const checkMedicationAlerts = () => {
    if (!user || medications.length === 0) return;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    medications.forEach((med) => {
      if (!med.is_active) return;

      med.times.forEach((time) => {
        if (time === currentTime) {
          showMedicationAlert(med);
        }
      });
    });
  };

  // Exibe alerta de medicação
  const showMedicationAlert = (medication: Medication) => {
    const message = `⏰ Hora de tomar: ${medication.name} (${medication.dosage})`;
    
    if (Platform.OS === 'android') {
      ToastAndroid.showWithGravityAndOffset(
        message,
        ToastAndroid.LONG,
        ToastAndroid.TOP,
        0,
        100
      );
    } else {
      RNAlert.alert(
        '💊 Lembrete de Medicação',
        message,
        [{ text: 'OK' }]
      );
    }
  };

  useEffect(() => {
    loadMedications();
  }, [user]);

  // Verifica medicações a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      checkMedicationAlerts();
    }, 60000); // 60 segundos

    return () => clearInterval(interval);
  }, [medications]);

  const activeMedications = medications.filter(m => m.is_active);

  // Handlers para medicações
  const handleAdd = () => {
    setEditingMedication(undefined);
    setShowForm(true);
  };

  const handleEdit = (medication: Medication) => {
    setEditingMedication(medication);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingMedication(undefined);
  };

  const handleSubmit = async (data: CreateMedicationDTO) => {
    if (!user?.id) return;

    setLoadingMedications(true);
    try {
      let result;
      if (editingMedication) {
        result = await updateMedication(editingMedication.id, user.id, data);
      } else {
        result = await createMedication(user.id, data);
      }

      if (result.ok) {
        RNAlert.alert('Sucesso', result.message);
        setShowForm(false);
        setEditingMedication(undefined);
        await loadMedications();
      } else {
        RNAlert.alert('Erro', result.message);
      }
    } finally {
      setLoadingMedications(false);
    }
  };

  const handleDelete = (medication: Medication) => {
    if (!user?.id) return;

    RNAlert.alert(
      'Confirmar Exclusão',
      `Deseja remover "${medication.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            setLoadingMedications(true);
            const result = await deleteMedication(medication.id, user.id);
            setLoadingMedications(false);

            if (result.ok) {
              RNAlert.alert('Sucesso', result.message);
              await loadMedications();
            } else {
              RNAlert.alert('Erro', result.message);
            }
          },
        },
      ]
    );
  };

  const handleToggle = async (medication: Medication) => {
    if (!user?.id) return;

    setLoadingMedications(true);
    const result = await toggleMedicationStatus(medication.id, user.id, !medication.is_active);
    setLoadingMedications(false);

    if (result.ok) {
      await loadMedications();
    } else {
      RNAlert.alert('Erro', result.message);
    }
  };

  return (
    <View style={styles.safeArea}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Container de Medicações no Topo */}
          <View style={styles.medicationsContainer}>
            <View style={styles.medicationsHeader}>
              <MaterialCommunityIcons name="pill" size={24} color={Colors.primary} />
              <Text style={styles.medicationsTitle}>Minhas Medicações</Text>
            </View>

            <Text style={styles.medicationsSubtitle}>
              Gerencie suas medicações e receba lembretes nos horários programados
            </Text>

            {/* Stats */}
            <View style={styles.medicationsStats}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{medications.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: Colors.success }]}>
                  {activeMedications.length}
                </Text>
                <Text style={styles.statLabel}>Ativas</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: Colors.textLight }]}>
                  {medications.length - activeMedications.length}
                </Text>
                <Text style={styles.statLabel}>Inativas</Text>
              </View>
            </View>

            {/* Próximos Horários */}
            {activeMedications.length > 0 && (
              <View style={styles.nextTimesCard}>
                <View style={styles.nextTimesHeader}>
                  <Ionicons name="time-outline" size={20} color={Colors.primary} />
                  <Text style={styles.nextTimesTitle}>Próximos Horários</Text>
                </View>
                {activeMedications.slice(0, 3).map((med) => (
                  <View key={med.id} style={styles.nextTimeItem}>
                    <View style={styles.nextTimeMed}>
                      <MaterialCommunityIcons name="pill" size={16} color={Colors.primary} />
                      <Text style={styles.nextTimeMedName}>{med.name}</Text>
                    </View>
                    <View style={styles.nextTimeTimes}>
                      {med.times.slice(0, 2).map((time, idx) => (
                        <Text key={idx} style={styles.nextTimeValue}>
                          {time}
                        </Text>
                      ))}
                      {med.times.length > 2 && (
                        <Text style={styles.nextTimeMore}>+{med.times.length - 2}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Formulário de Adição/Edição Inline */}
            {showForm && (
              <View style={styles.inlineSection}>
                <MedicationForm
                  medication={editingMedication}
                  onSubmit={handleSubmit}
                  onCancel={handleCancelForm}
                />
              </View>
            )}

            {/* Lista de Medicações */}
            {!showForm && medications.length > 0 && (
              <View style={styles.inlineSection}>
                <MedicationsList
                  medications={medications}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleStatus={(med, isActive) => handleToggle(med)}
                />
              </View>
            )}

            {/* Botão Adicionar */}
            {!showForm && (
              <TouchableOpacity
                style={styles.manageButton}
                onPress={handleAdd}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={20} color={Colors.textWhite} />
                <Text style={styles.manageButtonText}>
                  {medications.length === 0 ? 'Adicionar Medicação' : 'Adicionar Nova Medicação'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Alertas Preventivos por Localização */}
          <View style={styles.alertsSection}>
            <AlertCard />
          </View>
        </View>
      </ScrollView>
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
    marginBottom: Spacing.md,
    backgroundColor: Colors.accent,
  },
  medicationsContainer: {
    ...ComponentStyles.card,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.background,
  },
  alertsSection: {
    marginTop: Spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    ...ComponentStyles.cardSmall,
    flex: 1,
    alignItems: 'center',
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
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.base,
    padding: Spacing.xs,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  filterButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    ...Shadows.md,
  },
  filterText: {
    ...Typography.labelSmall,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    ...Typography.labelSmall,
    color: Colors.textWhite,
    fontWeight: '600',
  },
  emptyState: {
    ...ComponentStyles.emptyState,
  },
  emptyStateText: {
    ...ComponentStyles.emptyStateText,
  },
  emptyStateSubtext: {
    ...ComponentStyles.emptyStateSubtext,
  },
  inlineSection: {
    marginBottom: Spacing.md,
  },
  medicationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  medicationsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textDark,
  },
  medicationsSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  medicationsStats: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  nextTimesCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  nextTimesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  nextTimesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
  },
  nextTimeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  nextTimeMed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  nextTimeMedName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textDark,
  },
  nextTimeTimes: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  nextTimeValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  nextTimeMore: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: 20,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textWhite,
  },
});

export default AlertsTab;