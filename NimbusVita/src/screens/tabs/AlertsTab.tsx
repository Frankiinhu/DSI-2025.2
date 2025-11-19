import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ToastAndroid, Platform, Alert as RNAlert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AlertCard from '../../components/AlertCard';
import ExplanationCard from '../../components/ExplanationCard';
import MedicationsManager from '../../components/MedicationsManager';
import { Colors, Typography, Spacing, ComponentStyles, BorderRadius, Shadows } from '../../styles';
import { useAuth } from '../../contexts/AuthContext';
import { getMedications } from '../../services/supabase/medication.service';
import type { Medication } from '../../types/medication.types';

const AlertsTab: React.FC = () => {
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showMedicationsModal, setShowMedicationsModal] = useState(false);
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

  return (
    <View style={styles.safeArea}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <AlertCard />
          <ExplanationCard />

          {/* Divider */}
          <View style={styles.divider} />

          {/* Medications Section */}
          <View style={styles.medicationsSection}>
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

            {/* Manage Button */}
            <TouchableOpacity
              style={styles.manageButton}
              onPress={() => setShowMedicationsModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle" size={20} color={Colors.textWhite} />
              <Text style={styles.manageButtonText}>
                {medications.length === 0 ? 'Adicionar Medicação' : 'Gerenciar Medicações'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Medications Manager Modal */}
      <MedicationsManager
        visible={showMedicationsModal}
        onClose={() => setShowMedicationsModal(false)}
        userId={user?.id || ''}
        medications={medications}
        onRefresh={loadMedications}
      />
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
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xl,
  },
  medicationsSection: {
    marginBottom: Spacing.xl,
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