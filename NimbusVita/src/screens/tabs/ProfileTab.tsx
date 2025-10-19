import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';

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
      <StatusBar barStyle="light-content" backgroundColor="#5559ff" />
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
                placeholder="Digite sua idade"
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
                  <MaterialIcons name="edit" size={16} color="#5559ff" style={styles.editIcon} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.optionItem}>
              <MaterialIcons name="settings" size={24} color="#5559ff" style={styles.optionIcon} />
              <Text style={styles.optionText}>Configurações</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionItem}>
              <MaterialIcons name="bar-chart" size={24} color="#5559ff" style={styles.optionIcon} />
              <Text style={styles.optionText}>Estatísticas de Saúde</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionItem}>
              <MaterialIcons name="notifications" size={24} color="#5559ff" style={styles.optionIcon} />
              <Text style={styles.optionText}>Notificações</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionItem}>
              <MaterialIcons name="info" size={24} color="#5559ff" style={styles.optionIcon} />
              <Text style={styles.optionText}>Sobre o App</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.optionItem, styles.logoutOption]} onPress={handleLogout}>
              <MaterialIcons name="logout" size={24} color="#d4572a" style={styles.optionIcon} />
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
    backgroundColor: '#a4a8ff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#5559ff',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  container: {
    padding: 20,
    paddingTop: 30,
  },
  profileCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5559ff',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
  },
  editButton: {
    backgroundColor: '#f0f2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editIcon: {
    marginLeft: 6,
  },
  editButtonText: {
    fontSize: 14,
    color: '#5559ff',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#999',
    fontStyle: 'italic',
  },
  infoRowColumn: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  ageInput: {
    backgroundColor: '#f0f2ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginLeft: 10,
    width: 80,
    textAlign: 'right',
  },
  genderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#f0f2ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  genderButtonText: {
    fontSize: 12,
    color: '#5559ff',
    fontWeight: '600',
  },
  optionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionIcon: {
    marginRight: 12,
    width: 24,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  logoutOption: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#d4572a',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  versionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5559ff',
    marginBottom: 4,
  },
  buildText: {
    fontSize: 12,
    color: '#999',
  },
});

export default ProfileTab;