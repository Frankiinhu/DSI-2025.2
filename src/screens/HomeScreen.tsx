import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SymptomChecker from '../components/SymptomChecker';
import AlertCard from '../components/AlertCard';
import ExplanationCard from '../components/ExplanationCard';
import { signOut, getCurrentUser, PublicUser } from '../services/auth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

const logo = require('../../assets/logo.png');

type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadUserData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const loadUserData = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
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
            Alert.alert('Logout', 'Você saiu da conta com sucesso.', [
              { text: 'OK', onPress: () => navigation.replace('Login') }
            ]);
          }
        }
      ]
    );
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#5559ff" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>{currentUser?.username || 'Usuário'}</Text>
              <Text style={styles.subtitle}>Como você está se sentindo hoje?</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                <Text style={styles.logoutText}>Sair</Text>
              </TouchableOpacity>

              <Image
                source={logo}
                style={styles.headerLogo}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        <View style={styles.container}>
          {/* Quick Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Verificações hoje</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>7</Text>
              <Text style={styles.statLabel}>Dias consecutivos</Text>
            </View>
          </View>

          {/* Main Content */}
          <SymptomChecker />
          <AlertCard />
          <ExplanationCard />

          <View style={styles.footer}>
            <Text style={styles.footerNote}>
              💡 Versão de protótipo — previsões são simuladas para demonstração
            </Text>
            <Text style={styles.versionText}>v1.0.2 • Build 2025.2</Text>
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
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#e9c46a',
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  logoutBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoutText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  container: {
    padding: 20,
    paddingTop: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e4e4e4'
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#5559ff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    marginTop: 30,
    marginBottom: 20,
    alignItems: 'center',
  },
  footerNote: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  headerLogo: { width: 60, height: 60, marginTop: 16, marginBottom: -16, alignSelf: 'center' },
});

export default HomeScreen;