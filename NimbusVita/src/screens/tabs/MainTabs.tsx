import React, { useState } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Fontisto, FontAwesome5, FontAwesome6, Octicons, MaterialIcons } from '@expo/vector-icons';
import HomeTab from './HomeTab';
import FamilyTab from './FamilyTab';
import CheckupTab from './CheckupTab';
import AlertsTab from './AlertsTab';
import ProfileTab from './ProfileTab';
import { Colors, Spacing, Shadows, BorderRadius, ComponentStyles } from '../../styles';
import { useAuth } from '../../contexts/AuthContext';

const Tab = createMaterialTopTabNavigator();

const TabIcon = ({ 
  IconComponent, 
  name, 
  color, 
  focused 
}: { 
  IconComponent: any;
  name: string;
  color: string;
  size: number;
  focused: boolean;
}) => (
  <View style={{ alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
    <IconComponent name={name} size={28} color={color} />
    {focused && (
      <View
        style={{
          position: 'absolute',
          bottom: -10,
          width: 12,
          height: 6,
          borderRadius: 3,
          backgroundColor: Colors.textWhite,
        }}
      />
    )}
  </View>
);

// Configuração centralizada dos tabs
const TABS_CONFIG = [
  {
    name: 'HomeTab',
    component: HomeTab,
    IconComponent: FontAwesome6,
    iconName: 'house',
    title: 'Home',
    subtitle: 'Como você está se sentindo hoje?',
  },
  {
    name: 'CheckupTab',
    component: CheckupTab,
    IconComponent: Fontisto,
    iconName: 'pulse',
    title: 'Verificação de Sintomas',
    subtitle: 'Registre seus sintomas diários',
  },  
  {
    name: 'FamilyTab',
    component: FamilyTab,
    IconComponent: FontAwesome6,
    iconName: 'user-group',
    title: 'Minha Família',
    subtitle: 'Acompanhe a saúde de quem você ama',
  },
  {
    name: 'AlertsTab',
    component: AlertsTab,
    IconComponent: Octicons,
    iconName: 'bell-fill',
    title: 'Alertas de Saúde',
    subtitle: 'Informações importantes sobre sua região',
  },
  {
    name: 'ProfileTab',
    component: ProfileTab,
    IconComponent: FontAwesome5,
    iconName: 'user-alt',
    title: 'Perfil',
    subtitle: 'Gerencie sua conta e configurações',
  },  
];

// Configurações comuns de ícones
const ICON_SIZE = 24;

// Função para criar as opções do tab
const createTabOptions = (IconComponent: any, iconName: string) => ({
  tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
    <TabIcon 
      IconComponent={IconComponent}
      name={iconName}
      color={color}
      size={ICON_SIZE}
      focused={focused}
    />
  ),
});

const MainTabs: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  const handleTabChange = (index: number) => {
    // Animação de fade
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.7,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    setCurrentTab(index);
  };

  const currentTabConfig = TABS_CONFIG[currentTab];

  // Função para obter saudação baseada no horário
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getUserFirstName = () => {
    const full = user?.full_name;
    if (full) return full.split(' ')[0];
    if (user?.username) return user.username;
    return 'Usuário';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={Colors.primary} />
      
      {/* Header Único Compartilhado */}
      <Animated.View style={[styles.sharedHeader, { opacity: fadeAnim }]}>
        {currentTab === 0 ? (
          // Header especial para HomeTab com saudação e logo
          <View style={styles.headerContent}>
            <View style={styles.headerRow}>
              <View style={styles.greetingContainer}>
                <Text style={styles.greeting}>{getGreeting()}</Text>
                <Text style={styles.userName}>{getUserFirstName()}</Text>
                <Text style={styles.headerSubtitle}>Como você está se sentindo hoje?</Text>
              </View>
              <Image 
                source={require('../../../assets/logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>
        ) : (
          // Header padrão para outras abas
          <>
            <Text style={styles.headerTitle}>{currentTabConfig.title}</Text>
            <Text style={styles.headerSubtitle}>{currentTabConfig.subtitle}</Text>
          </>
        )}
      </Animated.View>

      {/* Navegador de Tabs */}
      <View style={{ flex: 1 }}>
        <Tab.Navigator
          tabBarPosition="bottom"
          screenListeners={{
            state: (e) => {
              const index = e.data.state.index;
              handleTabChange(index);
            },
          }}
          screenOptions={{
            swipeEnabled: true,
            tabBarStyle: {
              marginBlockStart: -20,
              backgroundColor: Colors.primary,
              borderTopLeftRadius: BorderRadius.xl2,
              borderTopRightRadius: BorderRadius.xl2,
              paddingTop: Spacing.lg,
              height: 96,
            },
            tabBarActiveTintColor: Colors.textWhite,
            tabBarInactiveTintColor: Colors.accentLight,
            tabBarShowLabel: false,
            tabBarIndicatorStyle: { height: 0 },
          }}
        >
        {TABS_CONFIG.map((tab) => (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
            options={createTabOptions(tab.IconComponent, tab.iconName)}
          />
        ))}
      </Tab.Navigator>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.accent,
  },
  sharedHeader: {
    ...ComponentStyles.header,
    paddingTop: Spacing.md,
  },
  headerContent: {
    // Removido flex: 1 para permitir que o conteúdo defina a altura
  },
  headerTitle: {
    ...ComponentStyles.headerTitle,
  },
  headerSubtitle: {
    ...ComponentStyles.headerSubtitle,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: Colors.secondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textWhite,
    marginBottom: Spacing.xs,
  },
  logo: {
    width: 80,
    height: 80,
    marginLeft: Spacing.md,
  },
});

export default MainTabs;