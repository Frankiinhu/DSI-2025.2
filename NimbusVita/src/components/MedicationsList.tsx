/**
 * Lista de medicações do usuário
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../styles';
import type { Medication } from '../types/medication.types';

interface MedicationsListProps {
  medications: Medication[];
  onEdit: (medication: Medication) => void;
  onDelete: (medication: Medication) => void;
  onToggleStatus: (medication: Medication, isActive: boolean) => void;
}

const MedicationsList: React.FC<MedicationsListProps> = ({
  medications,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const renderMedication = ({ item }: { item: Medication }) => (
    <View style={[styles.card, !item.is_active && styles.cardInactive]}>
      <View style={styles.cardHeader}>
        <View style={styles.medicationInfo}>
          <View style={styles.nameRow}>
            <MaterialCommunityIcons 
              name="pill" 
              size={20} 
              color={item.is_active ? Colors.primary : Colors.textLight} 
            />
            <Text style={[styles.medicationName, !item.is_active && styles.textInactive]}>
              {item.name}
            </Text>
          </View>
          <Text style={[styles.dosage, !item.is_active && styles.textInactive]}>
            {item.dosage}
          </Text>
          <Text style={[styles.frequency, !item.is_active && styles.textInactive]}>
            {item.frequency}
          </Text>
          
          {/* Horários */}
          <View style={styles.timesContainer}>
            {item.times.map((time, index) => (
              <View key={index} style={[styles.timeChip, !item.is_active && styles.timeChipInactive]}>
                <Ionicons 
                  name="time-outline" 
                  size={12} 
                  color={item.is_active ? Colors.primary : Colors.textLight} 
                />
                <Text style={[styles.timeText, !item.is_active && styles.textInactive]}>
                  {time}
                </Text>
              </View>
            ))}
          </View>

          {/* Observações */}
          {item.notes && (
            <Text style={[styles.notes, !item.is_active && styles.textInactive]}>
              💡 {item.notes}
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          <Switch
            value={item.is_active}
            onValueChange={(value) => onToggleStatus(item, value)}
            trackColor={{ false: Colors.border, true: Colors.primary + '50' }}
            thumbColor={item.is_active ? Colors.primary : Colors.textLight}
          />
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onEdit(item)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="pencil" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onDelete(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (medications.length === 0) {
    return (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name="pill-off" size={64} color={Colors.textLight} />
        <Text style={styles.emptyText}>Nenhuma medicação adicionada</Text>
        <Text style={styles.emptySubtext}>
          Adicione suas medicações para receber lembretes nos horários
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {medications.map((medication) => (
        <View key={medication.id}>
          {renderMedication({ item: medication })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  cardInactive: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  medicationInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
  },
  dosage: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 2,
  },
  frequency: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  timeChipInactive: {
    backgroundColor: Colors.border,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  notes: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  textInactive: {
    color: Colors.textLight,
  },
  actions: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  actionButton: {
    padding: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl2,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default MedicationsList;
