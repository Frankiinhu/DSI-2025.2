import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { Typography, Colors, ThemeColors, Spacing, ComponentStyles, BorderRadius } from '../../styles';
import { updateProfile } from '../../services/supabase/auth.service';
import { uploadProfilePicture, updateProfilePictureUrl, deleteProfilePicture } from '../../services/supabase/profile.storage.service';
import type { Database } from '../../types/database.types';
import { useNotifications } from '../../config/notifications';
import ConfirmDialog from '../../components/ConfirmDialog';

const ProfileTab = () => {
  const { user: currentUser, signOut, refreshUser } = useAuth();
  const { notify } = useNotifications();
  const [isEditMode, setIsEditMode] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    fullName: currentUser?.full_name || '',
    age: currentUser?.age || 0,
    gender: currentUser?.gender || '',
    height: currentUser?.height || 0,
    weight: currentUser?.weight || 0
  });

  // Update form when user data changes
  useEffect(() => {
    setEditForm({
      fullName: currentUser?.full_name || '',
      age: currentUser?.age || 0,
      gender: currentUser?.gender || '',
      height: currentUser?.height || 0,
      weight: currentUser?.weight || 0
    });
  }, [currentUser]);

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
        setHasChanges(false);
        notify('success', {
          params: {
            title: 'Sucesso',
            description: 'Perfil atualizado com sucesso!',
          },
        });
      } else {
        notify('error', {
          params: {
            title: 'Erro',
            description: message || 'Erro ao atualizar perfil',
          },
        });
      }
    } catch (error) {
      notify('error', {
        params: {
          title: 'Erro',
          description: 'Ocorreu um erro ao atualizar o perfil',
        },
      });
    }
  };

  const handleCancelEdit = () => {
    if (hasChanges) {
      Alert.alert(
        'Descartar alterações?',
        'Você tem alterações não salvas. Deseja descartá-las?',
        [
          { text: 'Continuar editando', style: 'cancel' },
          {
            text: 'Descartar',
            style: 'destructive',
            onPress: () => {
              setEditForm({
                fullName: currentUser?.full_name || '',
                age: currentUser?.age || 0,
                gender: currentUser?.gender || '',
                height: currentUser?.height || 0,
                weight: currentUser?.weight || 0
              });
              setIsEditMode(false);
              setHasChanges(false);
            }
          }
        ]
      );
    } else {
      setIsEditMode(false);
    }
  };

  const updateField = (field: keyof typeof editForm, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleAgeChange = (text: string) => {
    const age = parseInt(text);
    if (!text || (age >= 0 && age < 150)) {
      updateField('age', age || 0);
    }
  };

  const handleHeightChange = (text: string) => {
    const height = parseFloat(text);
    if (!text || (height >= 0 && height < 300)) {
      updateField('height', height || 0);
    }
  };

  const handleWeightChange = (text: string) => {
    const weight = parseFloat(text);
    if (!text || (weight >= 0 && weight < 500)) {
      updateField('weight', weight || 0);
    }
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      notify('error', {
        params: {
          title: 'Permissão necessária',
          description: 'Precisamos de permissão para acessar suas fotos',
        },
      });
      return false;
    }
    return true;
  };

  const handlePickImage = async (source: 'camera' | 'gallery') => {
    if (!currentUser?.id) return;

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      let result;

      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          notify('error', {
            params: {
              title: 'Permissão necessária',
              description: 'Precisamos de permissão para usar a câmera',
            },
          });
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);

        // Deletar foto antiga se existir
        if (currentUser.avatar_url) {
          await deleteProfilePicture(currentUser.id, currentUser.avatar_url);
        }

        // Upload nova foto
        const uploadResult = await uploadProfilePicture(currentUser.id, result.assets[0].uri);
        
        if (uploadResult.ok && uploadResult.url) {
          // Atualizar URL no banco
          const updateResult = await updateProfilePictureUrl(currentUser.id, uploadResult.url);
          
          if (updateResult.ok) {
            await refreshUser();
            notify('success', {
              params: {
                title: 'Sucesso',
                description: 'Foto de perfil atualizada!',
              },
            });
          } else {
            notify('error', {
              params: {
                title: 'Erro',
                description: updateResult.error || 'Erro ao atualizar perfil',
              },
            });
          }
        } else {
          notify('error', {
            params: {
              title: 'Erro',
              description: uploadResult.error || 'Erro ao fazer upload da imagem',
            },
          });
        }
      }
    } catch (error: any) {
      notify('error', {
        params: {
          title: 'Erro',
          description: error.message || 'Erro ao processar imagem',
        },
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleChangeProfilePicture = () => {
    Alert.alert(
      'Foto de Perfil',
      'Escolha uma opção:',
      [
        {
          text: 'Câmera',
          onPress: () => handlePickImage('camera'),
        },
        {
          text: 'Galeria',
          onPress: () => handlePickImage('gallery'),
        },
        ...(currentUser?.avatar_url ? [{
          text: 'Remover Foto',
          onPress: () => handleRemoveProfilePicture(),
          style: 'destructive' as const,
        }] : []),
        {
          text: 'Cancelar',
          style: 'cancel' as const,
        },
      ]
    );
  };

  const handleRemoveProfilePicture = async () => {
    if (!currentUser?.id || !currentUser.avatar_url) return;

    try {
      setUploadingImage(true);
      
      await deleteProfilePicture(currentUser.id, currentUser.avatar_url);
      const updateResult = await updateProfilePictureUrl(currentUser.id, null);
      
      if (updateResult.ok) {
        await refreshUser();
        notify('success', {
          params: {
            title: 'Sucesso',
            description: 'Foto de perfil removida',
          },
        });
      } else {
        notify('error', {
          params: {
            title: 'Erro',
            description: updateResult.error || 'Erro ao remover foto',
          },
        });
      }
    } catch (error: any) {
      notify('error', {
        params: {
          title: 'Erro',
          description: error.message || 'Erro ao remover foto',
        },
      });
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <View style={styles.safeArea}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.profileCard}>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                {uploadingImage ? (
                  <View style={styles.avatarPlaceholder}>
                    <ActivityIndicator size="large" color={ThemeColors.interactive.primary} />
                  </View>
                ) : currentUser?.avatar_url ? (
                  <Image 
                    source={{ uri: currentUser.avatar_url }} 
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <MaterialIcons name="person" size={60} color={ThemeColors.text.muted} />
                  </View>
                )}
                <TouchableOpacity 
                  style={styles.avatarEditButton}
                  onPress={handleChangeProfilePicture}
                  disabled={uploadingImage}
                >
                  <MaterialIcons name="camera-alt" size={20} color={Colors.textWhite} />
                </TouchableOpacity>
              </View>
              <Text style={styles.avatarName}>{editForm.fullName || currentUser?.username || 'Usuário'}</Text>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Informações Pessoais</Text>
              {!isEditMode ? (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setIsEditMode(true)}
                >
                  <FontAwesome6 name="edit" size={30} color={Colors.primary} />
                </TouchableOpacity>
              ) : (
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelEdit}
                  >
                    <MaterialIcons name="close" size={24} color={Colors.danger} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveIconButton}
                    onPress={handleSaveProfile}
                  >
                    <MaterialIcons name="check" size={24} color={Colors.success} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            {/* Nome Completo */}
            <View style={styles.editableRow}>
              <Text style={styles.infoLabel}>Nome Completo:</Text>
              {isEditMode ? (
                <TextInput
                  style={styles.inlineInput}
                  value={editForm.fullName}
                  onChangeText={(text) => updateField('fullName', text)}
                  placeholder="Seu nome completo"
                  placeholderTextColor={ThemeColors.text.muted}
                />
              ) : (
                <Text style={styles.infoValue}>{currentUser?.full_name || '-'}</Text>
              )}
            </View>
            
            {/* Nome de usuário (read-only) */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nome de usuário:</Text>
              <Text style={styles.infoValue}>{currentUser?.username || '-'}</Text>
            </View>
            
            {/* Email (read-only) */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{currentUser?.email || '-'}</Text>
            </View>
            
            {/* Idade */}
            <View style={styles.editableRow}>
              <Text style={styles.infoLabel}>Idade:</Text>
              {isEditMode ? (
                <TextInput
                  style={[styles.inlineInput, styles.numberInput]}
                  value={String(editForm.age || '')}
                  onChangeText={handleAgeChange}
                  placeholder="Idade"
                  placeholderTextColor={ThemeColors.text.muted}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              ) : (
                <Text style={styles.infoValue}>{currentUser?.age || '-'}</Text>
              )}
            </View>
            
            {/* Gênero */}
            <View style={styles.editableRow}>
              <Text style={styles.infoLabel}>Gênero:</Text>
              {isEditMode ? (
                <View style={styles.genderSelectionContainer}>
                  <TouchableOpacity
                    style={[styles.genderChip, editForm.gender === 'masculino' && styles.genderChipSelected]}
                    onPress={() => updateField('gender', 'masculino')}
                  >
                    <Text style={[styles.genderChipText, editForm.gender === 'masculino' && styles.genderChipTextSelected]}>
                      Masculino
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.genderChip, editForm.gender === 'feminino' && styles.genderChipSelected]}
                    onPress={() => updateField('gender', 'feminino')}
                  >
                    <Text style={[styles.genderChipText, editForm.gender === 'feminino' && styles.genderChipTextSelected]}>
                      Feminino
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.genderChip, editForm.gender === 'outro' && styles.genderChipSelected]}
                    onPress={() => updateField('gender', 'outro')}
                  >
                    <Text style={[styles.genderChipText, editForm.gender === 'outro' && styles.genderChipTextSelected]}>
                      Outro
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.infoValue}>{currentUser?.gender || '-'}</Text>
              )}
            </View>

            {/* Altura */}
            <View style={styles.editableRow}>
              <Text style={styles.infoLabel}>Altura (cm):</Text>
              {isEditMode ? (
                <TextInput
                  style={[styles.inlineInput, styles.numberInput]}
                  value={String(editForm.height || '')}
                  onChangeText={handleHeightChange}
                  placeholder="Altura"
                  placeholderTextColor={ThemeColors.text.muted}
                  keyboardType="decimal-pad"
                  maxLength={6}
                />
              ) : (
                <Text style={styles.infoValue}>{currentUser?.height ? `${currentUser.height} cm` : '-'}</Text>
              )}
            </View>

            {/* Peso */}
            <View style={styles.editableRow}>
              <Text style={styles.infoLabel}>Peso (kg):</Text>
              {isEditMode ? (
                <TextInput
                  style={[styles.inlineInput, styles.numberInput]}
                  value={String(editForm.weight || '')}
                  onChangeText={handleWeightChange}
                  placeholder="Peso"
                  placeholderTextColor={ThemeColors.text.muted}
                  keyboardType="decimal-pad"
                  maxLength={6}
                />
              ) : (
                <Text style={styles.infoValue}>{currentUser?.weight ? `${currentUser.weight} kg` : '-'}</Text>
              )}
            </View>
            
            {/* Data de cadastro (read-only) */}
            <View style={[styles.infoRow, styles.lastRow]}>
              <Text style={styles.infoLabel}>Cadastrado em:</Text>
              <Text style={styles.infoValue}>
                {currentUser?.created_at 
                  ? new Date(currentUser.created_at).toLocaleDateString('pt-BR')
                  : '-'
                }
              </Text>
            </View>

            {/* Botão de Sair */}
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={() => setShowLogoutDialog(true)}
            >
              <MaterialIcons name="logout" size={24} color={Colors.textWhite} />
              <Text style={styles.logoutButtonText}>
                Sair da Conta
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Confirm Logout Dialog */}
      <ConfirmDialog
        visible={showLogoutDialog}
        title="Confirmar Logout"
        message="Tem certeza que deseja sair da sua conta?"
        confirmText="Sair"
        cancelText="Cancelar"
        confirmColor={ThemeColors.interactive.danger}
        onConfirm={signOut}
        onCancel={() => setShowLogoutDialog(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.accent
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceDark,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: ThemeColors.surface.primary,
    borderWidth: 4,
    borderColor: ThemeColors.interactive.primary,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: ThemeColors.surface.primary,
    borderWidth: 4,
    borderColor: ThemeColors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: ThemeColors.interactive.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.textWhite,
  },
  avatarName: {
    ...Typography.h2,
    color: Colors.primary,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: Spacing.sm
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
    fontSize: 22, 
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceDark,
  },
  editableRow: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceDark,
  },
  lastRow: {
    borderBottomWidth: 0,
    marginBottom: -Spacing.sm,
  },
  infoLabel: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  infoValue: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  editButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.full,
    width: 48,
    height: 48,
    marginTop: -Spacing.xs,
    marginBottom: -Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cancelButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.full,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ThemeColors.surface.secondary,
  },
  saveIconButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.full,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ThemeColors.surface.secondary,
  },
  inlineInput: {
    backgroundColor: ThemeColors.background.primary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 2,
    borderColor: ThemeColors.interactive.primary,
  },
  numberInput: {
    maxWidth: 100,
  },
  genderSelectionContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
  },
  genderChip: {
    backgroundColor: ThemeColors.surface.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: ThemeColors.border.default,
  },
  genderChipSelected: {
    backgroundColor: ThemeColors.interactive.primary,
    borderColor: ThemeColors.interactive.primary,
  },
  genderChipText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  genderChipTextSelected: {
    color: Colors.textWhite,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.danger,
    padding: Spacing.md,
    borderRadius: BorderRadius.base,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  logoutButtonText: {
    ...Typography.button,
    color: Colors.textWhite,
    fontWeight: '600',
  },
});

export default ProfileTab;
