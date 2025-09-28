import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import HomeTab from './HomeTab';
import CheckupTab from './CheckupTab';
import AlertsTab from './AlertsTab';
import ProfileTab from './ProfileTab';

const Tab = createBottomTabNavigator();

const TabBarLabel = ({ focused, label }: { focused: boolean; label: string }) => (
  <Text style={{ 
    fontSize: 20, 
    color: focused ? '#fff' : '#b9bdff',
    fontWeight: focused ? '800' : '400',
  }}>
    {label}
  </Text>
);

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#5559ff',
          borderTopWidth: 4,
          borderTopColor: '#8183ff',
          paddingTop: 16,
          paddingBottom: 8,
          height: 120,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 8,
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#b9bdff',
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeTab}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <FontAwesome5 name="home" size={size || 24} color={color} />
          ),
          tabBarLabel: ({ focused }) => <TabBarLabel focused={focused} label="Início" />,
        }}
      />
      <Tab.Screen 
        name="CheckupTab" 
        component={CheckupTab}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <FontAwesome5 name="stethoscope" size={size || 24} color={color} />
          ),
          tabBarLabel: ({ focused }) => <TabBarLabel focused={focused} label="Checkup" />,
        }}
      />
      <Tab.Screen 
        name="AlertsTab" 
        component={AlertsTab}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialIcons name="notification-important" size={size || 24} color={color} />
          ),
          tabBarLabel: ({ focused }) => <TabBarLabel focused={focused} label="Alertas" />,
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileTab}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialIcons name="person" size={size || 24} color={color} />
          ),
          tabBarLabel: ({ focused }) => <TabBarLabel focused={focused} label="Perfil" />,
        }}
      />

    </Tab.Navigator>
  );
};
export default MainTabs;