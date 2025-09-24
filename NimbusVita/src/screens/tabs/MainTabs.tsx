import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

import HomeTab from './HomeTab';
import CheckupTab from './CheckupTab';
import AlertsTab from './AlertsTab';
import ProfileTab from './ProfileTab';

const Tab = createBottomTabNavigator();

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap;

          switch (route.name) {
            case 'HomeTab':
              iconName = 'home';
              break;
            case 'CheckupTab':
              iconName = 'medical-services';
              break;
            case 'AlertsTab':
              iconName = 'notifications';
              break;
            case 'ProfileTab':
              iconName = 'person';
              break;
            default:
              iconName = 'home';
              break;
          }

          return (
            <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
              <MaterialIcons name={iconName} size={size} color={color} />
            </View>
          );
        },
        tabBarLabel: ({ focused, color }) => {
          let label: string;

          switch (route.name) {
            case 'HomeTab':
              label = 'Início';
              break;
            case 'CheckupTab':
              label = 'Checkup';
              break;
            case 'AlertsTab':
              label = 'Alertas';
              break;
            case 'ProfileTab':
              label = 'Perfil';
              break;
            default:
              label = 'Tab';
              break;
          }

          return (
            <Text style={[styles.tabLabel, { color }, focused && styles.tabLabelFocused]}>
              {label}
            </Text>
          );
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeTab} />
      <Tab.Screen name="CheckupTab" component={CheckupTab} />
      <Tab.Screen name="AlertsTab" component={AlertsTab} />
      <Tab.Screen name="ProfileTab" component={ProfileTab} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#5559ff',
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    height: 90,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  tabBarItem: {
    paddingVertical: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  iconContainerFocused: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  tabLabelFocused: {
    fontWeight: '700',
  },
});

export default MainTabs;