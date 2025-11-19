/**
 * Modal gerenciador de medicações
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../styles';
import MedicationsList from './MedicationsList';
import MedicationForm from './MedicationForm';
import type { Medication, CreateMedicationDTO } from '../types/medication.types';
import {
  createMedication,
  updateMedication,
  deleteMedication,
  toggleMedicationStatus,
} from '../services/supabase/medication.service';

interface MedicationsManagerProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  medications: Medication[];
  onRefresh: () => void;
}

const MedicationsManager: React.FC<MedicationsManagerProps> = ({
  visible,
  onClose,
  userId,
  medications,
  onRefresh,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | undefined>();
  const [loading, setLoading] = useState(false);

  const handleAdd = () => {
    setEditingMedication(undefined);
    setShowForm(true);
  };

  const handleEdit = (medication: Medication) => {
    setEditingMedication(medication);
    setShowForm(true);
  };

  const handleSubmit = async (data: CreateMedicationDTO) => {
    setLoading(true);
    try {
      let result;
      if (editingMedication) {
        result = await updateMedication(editingMedication.id, userId, data);
      } else {
        result = await createMedication(userId, data);
      }

      if (result.ok) {
        Alert.alert('Sucesso', result.message);
        setShowForm(false);
        setEditingMedication(undefined);
        onRefresh();
      } else {
        Alert.alert('Erro', result.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (medication: Medication) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja remover "${medication.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const result = await deleteMedication(medication.id, userId);
            setLoading(false);

            if (result.ok) {
              Alert.alert('Sucesso', result.message);
              onRefresh();
            } else {
              Alert.alert('Erro', result.message);
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (medication: Medication, isActive: boolean) => {
    setLoading(true);
    const result = await toggleMedicationStatus(medication.id, userId, isActive);
    setLoading(false);

    if (result.ok) {
      onRefresh();
    } else {
      Alert.alert('Erro', result.message);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingMedication(undefined);
  };

  return (
    <>
      {/* Modal Principal - Lista */}
      <Modal
        visible={visible && !showForm}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <MaterialCommunityIcons name="pill" size={24} color={Colors.primary} />
                <Text style={styles.title}>Minhas Medicações</Text>
              </View>
              <TouchableOpacity onPress={onClose} disabled={loading} activeOpacity={0.7}>
                <Ionicons name="close" size={28} color={Colors.textDark} />
              </TouchableOpacity>
            </View>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              Gerencie suas medicações e receba lembretes nos horários
            </Text>

            {/* Add Button */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAdd}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle" size={24} color={Colors.textWhite} />
              <Text style={styles.addButtonText}>Nova Medicação</Text>
            </TouchableOpacity>

            {/* Content */}
            <View style={styles.content}>
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                </View>
              )}

              <MedicationsList
                medications={medications}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal do Formulário */}
      <Modal
        visible={visible && showForm}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseForm}
      >
        <View style={styles.formOverlay}>
          <View style={styles.formContainer}>
            <MedicationForm
              medication={editingMedication}
              onSubmit={handleSubmit}
              onCancel={handleCloseForm}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl2,
    borderTopRightRadius: BorderRadius.xl2,
    height: '85%',
    padding: Spacing.lg,
    ...Shadows.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.textDark,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: 20,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textWhite,
  },
  content: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  formOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  formContainer: {
    backgroundColor: Colors.background,
    borderRadius: 24,
    width: '100%',
    height: '80%',
    maxWidth: 500,
    ...Shadows.xl,
  },
});

export default MedicationsManager;
