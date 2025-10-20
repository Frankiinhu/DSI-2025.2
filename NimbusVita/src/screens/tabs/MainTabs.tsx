import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View } from 'react-native';
import { Fontisto, FontAwesome5, FontAwesome6, Octicons } from '@expo/vector-icons';
import HomeTab from './HomeTab';
import CheckupTab from './CheckupTab';
import AlertsTab from './AlertsTab';
import ProfileTab from './ProfileTab';
import { Colors, Spacing, Shadows, BorderRadius } from '../../styles';

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
  },
  {
    name: 'CheckupTab',
    component: CheckupTab,
    IconComponent: Fontisto,
    iconName: 'pulse',
  },
  {
    name: 'AlertsTab',
    component: AlertsTab,
    IconComponent: Octicons,
    iconName: 'bell-fill',
  },
  {
    name: 'ProfileTab',
    component: ProfileTab,
    IconComponent: FontAwesome5,
    iconName: 'user-alt',
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
  return (
    <Tab.Navigator
      tabBarPosition="bottom"
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
  );
};

export default MainTabs;