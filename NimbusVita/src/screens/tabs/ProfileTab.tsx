import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Typography, Spacing, ComponentStyles, BorderRadius, Shadows } from '../../styles';

const ProfileTab: React.FC = () => {
  const { user: currentUser, signOut } = useAuth();
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('');

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const savedAge = await AsyncStorage.getItem('userAge');
      const savedGender = await AsyncStorage.getItem('userGender');
      
      if (savedAge) setAge(savedAge);
      if (savedGender) setGender(savedGender);
    } catch (error) {
      console.error('Erro ao carregar dados do perfil:', error);
    }
  };

  const handleAgeChange = async (text: string) => {
    if (!text || (!isNaN(Number(text)) && Number(text) >= 0 && Number(text) < 150)) {
      setAge(text);
      if (text) {
        try {
          await AsyncStorage.setItem('userAge', text);
        } catch (error) {
          console.error('Erro ao salvar idade:', error);
        }
      } else {
        try {
          await AsyncStorage.removeItem('userAge');
        } catch (error) {
          console.error('Erro ao remover idade:', error);
        }
      }
    }
  };

  const handleSelectGender = async (selectedGender: string) => {
    try {
      await AsyncStorage.setItem('userGender', selectedGender);
      setGender(selectedGender);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar o gênero.');
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
          onPress: async () => {
            try {
              await AsyncStorage.setItem('userGender', 'Masculino');
              setGender('Masculino');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível salvar o gênero.');
            }
          }
        },
        {
          text: 'Feminino',
          onPress: async () => {
            try {
              await AsyncStorage.setItem('userGender', 'Feminino');
              setGender('Feminino');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível salvar o gênero.');
            }
          }
        },
        {
          text: 'Outro',
          onPress: async () => {
            try {
              await AsyncStorage.setItem('userGender', 'Outro');
              setGender('Outro');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível salvar o gênero.');
            }
          }
        },
        {
          text: 'Prefiro não informar',
          onPress: async () => {
            try {
              await AsyncStorage.setItem('userGender', 'Prefiro não informar');
              setGender('Prefiro não informar');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível salvar o gênero.');
            }
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirmar Logout',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Perfil</Text>
          <Text style={styles.headerSubtitle}>Gerencie sua conta e configurações</Text>
        </View>

        <View style={styles.container}>
          <View style={styles.profileCard}>
            <Text style={styles.sectionTitle}>Informações Pessoais</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nome:</Text>
              <Text style={styles.infoValue}>{currentUser?.username || 'Usuário'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{currentUser?.email || 'email@exemplo.com'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Idade:</Text>
              <TextInput
                style={styles.ageInput}
                value={age}
                onChangeText={handleAgeChange}
                keyboardType="numeric"
                placeholder="---"
                placeholderTextColor="#999"
                maxLength={3}
              />
            </View>
            
            {!gender ? (
              <View style={styles.infoRowColumn}>
                <Text style={styles.infoLabel}>Gênero:</Text>
                <View style={styles.genderButtons}>
                  <TouchableOpacity
                    style={styles.genderButton}
                    onPress={() => handleSelectGender('Masculino')}
                  >
                    <Text style={styles.genderButtonText}>Masculino</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.genderButton}
                    onPress={() => handleSelectGender('Feminino')}
                  >
                    <Text style={styles.genderButtonText}>Feminino</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.genderButton}
                    onPress={() => handleEditGender()}
                  >
                    <Text style={styles.genderButtonText}>Outro</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Gênero:</Text>
                <TouchableOpacity style={styles.editButton} onPress={handleEditGender}>
                  <Text style={styles.editButtonText}>{gender}</Text>
                  <MaterialIcons name="edit" size={16} color={Colors.primary} style={styles.editIcon} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.optionItem}>
              <MaterialIcons name="settings" size={24} color={Colors.primary} style={styles.optionIcon} />
              <Text style={styles.optionText}>Configurações</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionItem}>
              <MaterialIcons name="bar-chart" size={24} color={Colors.primary} style={styles.optionIcon} />
              <Text style={styles.optionText}>Estatísticas de Saúde</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionItem}>
              <MaterialIcons name="notifications" size={24} color={Colors.primary} style={styles.optionIcon} />
              <Text style={styles.optionText}>Notificações</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionItem}>
              <MaterialIcons name="info" size={24} color={Colors.primary} style={styles.optionIcon} />
              <Text style={styles.optionText}>Sobre o App</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.optionItem, styles.logoutOption]} onPress={handleLogout}>
              <MaterialIcons name="logout" size={24} color={Colors.danger} style={styles.optionIcon} />
              <Text style={[styles.optionText, styles.logoutText]}>Sair</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.versionText}>NimbusVita v1.0.0</Text>
            <Text style={styles.buildText}>Build 2025.2</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.accent,
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
    paddingTop: Spacing.xl2,
  },
  profileCard: {
    ...ComponentStyles.card,
    marginBottom: Spacing.xl2,
  },
  sectionTitle: {
    ...Typography.h5,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.base,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoLabel: {
    ...Typography.body,
    fontWeight: '500',
    color: Colors.primary,
  },
  infoValue: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  editButton: {
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.base,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editIcon: {
    marginLeft: Spacing.xs,
  },
  editButtonText: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '500',
  },
  infoRowColumn: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  ageInput: {
    ...ComponentStyles.input,
    width: 55,
    textAlign: 'center',
    paddingVertical: 0,
  },
  genderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  genderButton: {
    ...ComponentStyles.chip,
    flex: 1,
    alignItems: 'center',
  },
  genderButtonText: {
    ...ComponentStyles.chipText,
    color: Colors.primary,
    fontWeight: '600',
  },
  optionsContainer: {
    ...ComponentStyles.card,
    marginBottom: Spacing.xl,
    padding: 0,
  },
  optionItem: {
    ...ComponentStyles.listItem,
  },
  optionIcon: {
    marginRight: Spacing.md,
    width: 24,
  },
  optionText: {
    ...ComponentStyles.listItemText,
  },
  logoutOption: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: Colors.danger,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  versionText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  buildText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
});

export default ProfileTab;