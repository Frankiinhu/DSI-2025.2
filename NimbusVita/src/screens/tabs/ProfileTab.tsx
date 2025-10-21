import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Typography, Spacing, ComponentStyles, BorderRadius } from '../../styles';
import { theme } from '../../theme';
import { updateProfile } from '../../services/supabase/auth.service';
import type { Database } from '../../types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

const ProfileTab = () => {
  const { user: currentUser, signOut, refreshUser } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    fullName: currentUser?.full_name || '',
    age: currentUser?.age || 0,
    gender: currentUser?.gender || '',
    height: currentUser?.height || 0,
    weight: currentUser?.weight || 0
  });

  const handleSaveProfile = async () => {
    if (!currentUser?.id) return;

    try {
      const { ok, message } = await updateProfile(currentUser.id, {
        full_name: editForm.fullName,
        gender: editForm.gender as 'masculino' | 'feminino' | 'outro',
        age: editForm.age,
        height: editForm.height,
        weight: editForm.weight
      });

      if (ok) {
        await refreshUser();
        setIsEditMode(false);
        Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      } else {
        Alert.alert('Erro', message || 'Erro ao atualizar perfil');
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar o perfil');
    }
  };

  const handleAgeChange = (text: string) => {
    const age = parseInt(text);
    if (!text || (age >= 0 && age < 150)) {
      setEditForm(prev => ({ ...prev, age: age || 0 }));
    }
  };

  const handleHeightChange = (text: string) => {
    const height = parseFloat(text);
    if (!text || (height >= 0 && height < 300)) {
      setEditForm(prev => ({ ...prev, height: height || 0 }));
    }
  };

  const handleWeightChange = (text: string) => {
    const weight = parseFloat(text);
    if (!text || (weight >= 0 && weight < 500)) {
      setEditForm(prev => ({ ...prev, weight: weight || 0 }));
    }
  };

  const handleEditGender = () => {
    Alert.alert(
      'Selecionar Gênero',
      'Escolha seu gênero:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Masculino',
          onPress: () => setEditForm(prev => ({ ...prev, gender: 'masculino' }))
        },
        {
          text: 'Feminino',
          onPress: () => setEditForm(prev => ({ ...prev, gender: 'feminino' }))
        },
        {
          text: 'Outro',
          onPress: () => setEditForm(prev => ({ ...prev, gender: 'outro' }))
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirmar Logout',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: signOut
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.interactive.primary} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Perfil</Text>
          <Text style={styles.headerSubtitle}>Gerencie sua conta e configurações</Text>
        </View>

        <View style={styles.container}>
          <View style={styles.profileCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Informações Pessoais</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditMode(true)}
              >
                <MaterialIcons name="edit" size={20} color={theme.interactive.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nome Completo:</Text>
              <Text style={styles.infoValue}>{currentUser?.full_name || '-'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nome de usuário:</Text>
              <Text style={styles.infoValue}>{currentUser?.username || '-'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{currentUser?.email || '-'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Idade:</Text>
              <Text style={styles.infoValue}>{currentUser?.age || '-'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Gênero:</Text>
              <Text style={styles.infoValue}>{currentUser?.gender || '-'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Altura (cm):</Text>
              <Text style={styles.infoValue}>{currentUser?.height ? `${currentUser.height} cm` : '-'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Peso (kg):</Text>
              <Text style={styles.infoValue}>{currentUser?.weight ? `${currentUser.weight} kg` : '-'}</Text>
            </View>
            
            <View style={[styles.infoRow, styles.lastRow]}>
              <Text style={styles.infoLabel}>Cadastrado em:</Text>
              <Text style={styles.infoValue}>
                {currentUser?.created_at 
                  ? new Date(currentUser.created_at).toLocaleDateString('pt-BR')
                  : '-'
                }
              </Text>
            </View>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={[styles.optionItem, styles.logoutOption]} 
              onPress={() => {
                Alert.alert(
                  'Confirmação',
                  'Tem certeza que deseja sair da sua conta?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Sair',
                      style: 'destructive',
                      onPress: signOut
                    }
                  ]
                );
              }}
            >
              <MaterialIcons name="logout" size={24} color={theme.interactive.danger} />
              <Text style={[styles.optionText, styles.logoutText]}>
                Sair da Conta
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditMode}
        animationType="slide"
        onRequestClose={() => setIsEditMode(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsEditMode(false)}
            >
              <MaterialIcons name="close" size={24} color={theme.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nome Completo</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.fullName}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, fullName: text }))}
                placeholder="Seu nome completo"
                placeholderTextColor={theme.text.muted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Idade</Text>
              <TextInput
                style={styles.textInput}
                value={String(editForm.age)}
                onChangeText={handleAgeChange}
                placeholder="Sua idade"
                placeholderTextColor={theme.text.muted}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gênero</Text>
              <TouchableOpacity
                style={styles.genderButton}
                onPress={handleEditGender}
              >
                <Text style={styles.genderButtonText}>
                  {editForm.gender || 'Selecionar gênero'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color={theme.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Altura (cm)</Text>
              <TextInput
                style={styles.textInput}
                value={String(editForm.height || '')}
                onChangeText={handleHeightChange}
                placeholder="Sua altura em centímetros"
                placeholderTextColor={theme.text.muted}
                keyboardType="decimal-pad"
                maxLength={6}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Peso (kg)</Text>
              <TextInput
                style={styles.textInput}
                value={String(editForm.weight || '')}
                onChangeText={handleWeightChange}
                placeholder="Seu peso em quilos"
                placeholderTextColor={theme.text.muted}
                keyboardType="decimal-pad"
                maxLength={6}
              />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveProfile}
            >
              <Text style={styles.saveButtonText}>Salvar Alterações</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: theme.interactive.primary,
    padding: Spacing.lg,
  },
  headerTitle: {
    ...Typography.h1,
    color: theme.text.inverse,
  },
  headerSubtitle: {
    ...Typography.body,
    color: theme.text.inverse,
    opacity: 0.8,
  },
  container: {
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  profileCard: {
    ...ComponentStyles.card,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h3,
    color: theme.text.primary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.light,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    ...Typography.body,
    color: theme.text.muted,
    flex: 1,
  },
  infoValue: {
    ...Typography.body,
    color: theme.text.secondary,
    flex: 2,
    textAlign: 'right',
  },
  editButton: {
    padding: Spacing.xs,
  },
  optionsContainer: {
    marginBottom: Spacing.xl,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.base,
    marginBottom: Spacing.sm,
  },
  optionText: {
    ...Typography.button,
    marginLeft: Spacing.sm,
  },
  logoutOption: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: theme.interactive.danger,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: theme.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.default,
  },
  modalTitle: {
    ...Typography.h2,
    color: theme.text.primary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalContent: {
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.body,
    color: theme.text.primary,
    marginBottom: Spacing.xs,
  },
  textInput: {
    backgroundColor: theme.surface.primary,
    borderWidth: 1,
    borderColor: theme.border.default,
    borderRadius: BorderRadius.base,
    padding: Spacing.sm,
    ...Typography.body,
    color: theme.text.primary,
  },
  genderButton: {
    backgroundColor: theme.surface.primary,
    borderWidth: 1,
    borderColor: theme.border.default,
    borderRadius: BorderRadius.base,
    padding: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  genderButtonText: {
    ...Typography.body,
    color: theme.text.primary,
  },
  saveButton: {
    backgroundColor: theme.interactive.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  saveButtonText: {
    ...Typography.button,
    color: theme.text.inverse,
  },
});

export default ProfileTab;