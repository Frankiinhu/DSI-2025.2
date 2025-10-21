import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, TextInput, Modal, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { Typography, Colors, Spacing, ComponentStyles, BorderRadius } from '../../styles';
import { theme } from '../../theme';
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
  const [showGenderDialog, setShowGenderDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showLogoutDialog2, setShowLogoutDialog2] = useState(false);
  const [showPhotoOptionsDialog, setShowPhotoOptionsDialog] = useState(false);
  
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
    setShowGenderDialog(true);
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
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
    setShowPhotoOptionsDialog(true);
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.interactive.primary} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Perfil</Text>
          <Text style={styles.headerSubtitle}>Gerencie sua conta e configurações</Text>
        </View>

        <View style={styles.container}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {uploadingImage ? (
                <View style={styles.avatarPlaceholder}>
                  <ActivityIndicator size="large" color={theme.interactive.primary} />
                </View>
              ) : currentUser?.avatar_url ? (
                <Image 
                  source={{ uri: currentUser.avatar_url }} 
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialIcons name="person" size={60} color={theme.text.muted} />
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
            <Text style={styles.avatarName}>{currentUser?.full_name || currentUser?.username || 'Usuário'}</Text>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Informações Pessoais</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditMode(true)}
              >
                <MaterialIcons name="edit" size={24} color={theme.interactive.primary} />
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
              onPress={() => setShowLogoutDialog2(true)}
            >
              <MaterialIcons name="logout" size={24} color={Colors.danger} />
              <Text style={[styles.optionText, styles.logoutText]}>
                Sair da Conta
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        visible={showLogoutDialog}
        title="Confirmar Logout"
        message="Tem certeza que deseja sair da sua conta?"
        confirmText="Sair"
        cancelText="Cancelar"
        confirmColor={theme.interactive.danger}
        onConfirm={signOut}
        onCancel={() => setShowLogoutDialog(false)}
      />

      <ConfirmDialog
        visible={showLogoutDialog2}
        title="Confirmação"
        message="Tem certeza que deseja sair da sua conta?"
        confirmText="Sair"
        cancelText="Cancelar"
        confirmColor={theme.interactive.danger}
        onConfirm={signOut}
        onCancel={() => setShowLogoutDialog2(false)}
      />

      {/* Gender Selection Modal */}
      <Modal
        visible={showGenderDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGenderDialog(false)}
      >
        <View style={styles.genderDialogOverlay}>
          <View style={styles.genderDialog}>
            <Text style={styles.genderDialogTitle}>Selecionar Gênero</Text>
            <Text style={styles.genderDialogSubtitle}>Escolha seu gênero:</Text>
            
            <TouchableOpacity
              style={styles.genderOptionButton}
              onPress={() => {
                setEditForm(prev => ({ ...prev, gender: 'masculino' }));
                setShowGenderDialog(false);
              }}
            >
              <Text style={styles.genderOptionText}>Masculino</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.genderOptionButton}
              onPress={() => {
                setEditForm(prev => ({ ...prev, gender: 'feminino' }));
                setShowGenderDialog(false);
              }}
            >
              <Text style={styles.genderOptionText}>Feminino</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.genderOptionButton}
              onPress={() => {
                setEditForm(prev => ({ ...prev, gender: 'outro' }));
                setShowGenderDialog(false);
              }}
            >
              <Text style={styles.genderOptionText}>Outro</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.genderOptionButton, styles.genderCancelButton]}
              onPress={() => setShowGenderDialog(false)}
            >
              <Text style={styles.genderCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Photo Options Modal */}
      <Modal
        visible={showPhotoOptionsDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPhotoOptionsDialog(false)}
      >
        <View style={styles.genderDialogOverlay}>
          <View style={styles.genderDialog}>
            <Text style={styles.genderDialogTitle}>Foto de Perfil</Text>
            <Text style={styles.genderDialogSubtitle}>Escolha uma opção:</Text>
            
            <TouchableOpacity
              style={styles.genderOptionButton}
              onPress={() => {
                setShowPhotoOptionsDialog(false);
                handlePickImage('camera');
              }}
            >
              <View style={styles.photoOptionContent}>
                <MaterialIcons name="camera-alt" size={24} color={theme.text.primary} />
                <Text style={styles.genderOptionText}>Câmera</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.genderOptionButton}
              onPress={() => {
                setShowPhotoOptionsDialog(false);
                handlePickImage('gallery');
              }}
            >
              <View style={styles.photoOptionContent}>
                <MaterialIcons name="photo-library" size={24} color={theme.text.primary} />
                <Text style={styles.genderOptionText}>Galeria</Text>
              </View>
            </TouchableOpacity>

            {currentUser?.avatar_url && (
              <TouchableOpacity
                style={[styles.genderOptionButton, styles.deletePhotoButton]}
                onPress={() => {
                  setShowPhotoOptionsDialog(false);
                  handleRemoveProfilePicture();
                }}
              >
                <View style={styles.photoOptionContent}>
                  <MaterialIcons name="delete" size={24} color={Colors.danger} />
                  <Text style={[styles.genderOptionText, styles.deletePhotoText]}>Remover Foto</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.genderOptionButton, styles.genderCancelButton]}
              onPress={() => setShowPhotoOptionsDialog(false)}
            >
              <Text style={styles.genderCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
              <MaterialIcons name="close" size={32} color={Colors.textWhite} />
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
    backgroundColor: Colors.accent
  },
  scrollView: {
    flex: 1,
  },
  header: {
    ...ComponentStyles.header,
  },
  headerTitle: {
    ...ComponentStyles.headerTitle,
  },
  headerSubtitle: {
    ...ComponentStyles.headerSubtitle,
  },
  container: {
    padding: Spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.surface.primary,
    borderWidth: 4,
    borderColor: theme.interactive.primary,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.surface.primary,
    borderWidth: 4,
    borderColor: theme.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.interactive.primary,
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
    color: Colors.textWhite,
    textAlign: 'center',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
    marginTop: Spacing.xs,
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
  lastRow: {
    borderBottomWidth: 0,
    marginBottom: -Spacing.sm,
  },
  infoLabel: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textTertiary,
    flex: 1.5,
  },
  infoValue: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1.5,
    textAlign: 'right',
  },
  editButton: {
    padding: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    width: 48,
    height: 48,
    marginTop: -Spacing.xs,
    marginBottom: -Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
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
    ...ComponentStyles.card,
    backgroundColor: Colors.surface,
    borderBottomWidth: 0,
  },
  logoutText: {
    color: Colors.danger,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.accent,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryLight,
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.textWhite
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalContent: {
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
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
  genderDialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  genderDialog: {
    backgroundColor: theme.surface.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  genderDialogTitle: {
    ...Typography.h3,
    color: theme.text.primary,
    marginBottom: Spacing.sm,
  },
  genderDialogSubtitle: {
    ...Typography.body,
    color: theme.text.secondary,
    marginBottom: Spacing.lg,
  },
  genderOptionButton: {
    backgroundColor: theme.background.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.base,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: theme.border.default,
  },
  genderOptionText: {
    ...Typography.button,
    color: theme.text.primary,
    textAlign: 'center',
  },
  genderCancelButton: {
    backgroundColor: theme.surface.secondary,
    marginTop: Spacing.md,
  },
  genderCancelText: {
    ...Typography.button,
    color: theme.text.secondary,
    textAlign: 'center',
  },
  photoOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  deletePhotoButton: {
    borderColor: Colors.danger,
    borderWidth: 1,
  },
  deletePhotoText: {
    color: Colors.danger,
  },
});

export default ProfileTab;