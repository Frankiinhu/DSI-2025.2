/**
 * Modal gerenciador de localizações monitoradas
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
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../styles';
import MonitoredLocationsList from './MonitoredLocationsList';
import MonitoredLocationForm from './MonitoredLocationForm';
import type { MonitoredLocation, CreateMonitoredLocationDTO } from '../types/monitored-location.types';
import {
  createMonitoredLocation,
  updateMonitoredLocation,
  deleteMonitoredLocation,
  setPrimaryLocation,
} from '../services/supabase/monitored-locations.service';

interface MonitoredLocationsManagerProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  locations: MonitoredLocation[];
  onRefresh: () => void;
}

const MonitoredLocationsManager: React.FC<MonitoredLocationsManagerProps> = ({
  visible,
  onClose,
  userId,
  locations,
  onRefresh,
}) => {
  console.log('🎯 MonitoredLocationsManager recebeu:', { 
    visible, 
    userId, 
    locationsCount: locations?.length || 0,
    locations 
  });
  
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<MonitoredLocation | undefined>();
  const [loading, setLoading] = useState(false);

  const handleAdd = () => {
    setEditingLocation(undefined);
    setShowForm(true);
  };

  const handleEdit = (location: MonitoredLocation) => {
    setEditingLocation(location);
    setShowForm(true);
  };

  const handleSubmit = async (data: CreateMonitoredLocationDTO) => {
    setLoading(true);
    try {
      let result;
      if (editingLocation) {
        result = await updateMonitoredLocation(editingLocation.id, userId, data);
      } else {
        result = await createMonitoredLocation(userId, data);
      }

      if (result.ok) {
        Alert.alert('Sucesso', result.message);
        setShowForm(false);
        setEditingLocation(undefined);
        onRefresh();
      } else {
        Alert.alert('Erro', result.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (location: MonitoredLocation) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja remover "${location.nickname || location.city_name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const result = await deleteMonitoredLocation(location.id, userId);
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

  const handleSetPrimary = async (location: MonitoredLocation) => {
    setLoading(true);
    const result = await setPrimaryLocation(location.id, userId);
    setLoading(false);

    if (result.ok) {
      Alert.alert('Sucesso', result.message);
      onRefresh();
    } else {
      Alert.alert('Erro', result.message);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingLocation(undefined);
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
                <Ionicons name="location" size={24} color={Colors.primary} />
                <Text style={styles.title}>Localizações Monitoradas</Text>
              </View>
              <TouchableOpacity onPress={onClose} disabled={loading}>
                <Ionicons name="close" size={28} color={Colors.textDark} />
              </TouchableOpacity>
            </View>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              Adicione cidades para monitorar informações de saúde em tempo real
            </Text>

            {/* Add Button */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAdd}
              disabled={loading}
            >
              <Ionicons name="add-circle" size={24} color={Colors.textWhite} />
              <Text style={styles.addButtonText}>Nova Localização</Text>
            </TouchableOpacity>

            {/* Content */}
            <View style={styles.content}>
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                </View>
              )}

              <MonitoredLocationsList
                locations={locations}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSetPrimary={handleSetPrimary}
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
            <MonitoredLocationForm
              location={editingLocation}
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
    zIndex: 9999,
  },
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
    paddingBottom: 100, // Espaço para não sobrepor a toolbar
    ...Shadows.xl,
    zIndex: 10000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textDark,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.md,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textWhite,
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  formOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    zIndex: 10001,
  },
  formContainer: {
    backgroundColor: Colors.background,
    borderRadius: 24,
    width: '100%',
    height: '80%',
    maxWidth: 500,
    ...Shadows.xl,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 10,
  },
});

export default MonitoredLocationsManager;
