import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut, getCurrentUser, PublicUser } from '../../services/auth';

const logo = require('../../../assets/logo.png');

const HomeTab: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadUserData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const loadUserData = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
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
            <Image
              source={logo}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bem-vindo ao NimbusVita</Text>
            <Text style={styles.cardText}>
              Seu assistente de saúde digital. Use as abas abaixo para fazer verificações de sintomas, ver alertas e gerenciar seu perfil.
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerNote}>
              💡 Versão de protótipo — previsões são simuladas para demonstração
            </Text>
            <Text style={styles.versionText}>v1.0.0 • Build 2025.2</Text>
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
    alignItems: 'center',
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
  headerLogo: {
    width: 60,
    height: 60,
  },
  container: {
    padding: 20,
    paddingTop: 30,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5559ff',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
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
});

export default HomeTab;