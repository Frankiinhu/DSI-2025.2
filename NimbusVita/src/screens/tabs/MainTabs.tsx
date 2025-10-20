import React from 'react';
import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { Fontisto, FontAwesome5, FontAwesome6, Octicons } from '@expo/vector-icons';
import HomeTab from './HomeTab';
import CheckupTab from './CheckupTab';
import AlertsTab from './AlertsTab';
import ProfileTab from './ProfileTab';
import { Colors, Spacing, Shadows, BorderRadius } from '../../styles';

const Tab = createBottomTabNavigator();

const TabIcon = ({ 
  IconComponent, 
  name, 
  color, 
  size, 
  focused 
}: { 
  IconComponent: any;
  name: string;
  color: string;
  size: number;
  focused: boolean;
}) => (
  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
    <IconComponent name={name} size={size} color={color} />
    {focused && (
      <View
        style={{
          width: 12,
          height: 6,
          borderRadius: 3,
          backgroundColor: Colors.textWhite,
          marginTop: 4,
        }}
      />
    )}
  </View>
);

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
          tabBarStyle: {
            marginBlockStart: -20,
            backgroundColor: Colors.primary,
            borderTopLeftRadius: BorderRadius.xl2,
            borderTopRightRadius: BorderRadius.xl2,
            paddingTop: Spacing.xl,
            height: 90,
          },
          tabBarActiveTintColor: Colors.textWhite,
          tabBarInactiveTintColor: Colors.accentLight,
          tabBarShowLabel: false,
        }}
      >
        <Tab.Screen 
          name="HomeTab" 
          component={HomeTab}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon 
                IconComponent={FontAwesome6}
                name="house"
                color={color}
                size={size}
                focused={focused}
              />
            ),
          }}
        />
        <Tab.Screen 
          name="CheckupTab" 
          component={CheckupTab}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon 
                IconComponent={Fontisto}
                name="pulse"
                color={color}
                size={size}
                focused={focused}
              />
            ),
          }}
        />
        <Tab.Screen 
          name="AlertsTab" 
          component={AlertsTab}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon 
                IconComponent={Octicons}
                name="bell-fill"
                color={color}
                size={size}
                focused={focused}
              />
            ),
          }}
        />
        <Tab.Screen 
          name="ProfileTab" 
          component={ProfileTab}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon 
                IconComponent={FontAwesome5}
                name="user-alt"
                color={color}
                size={size}
                focused={focused}
              />
            ),
          }}
        />
      </Tab.Navigator>
  );
};

export default MainTabs;