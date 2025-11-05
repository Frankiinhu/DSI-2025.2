import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import MainTabs from './src/screens/tabs/MainTabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Splash } from './src/screens/Splash';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { Colors } from './src/styles';
import { ToastComponent } from './src/config/notifications';
import ErrorBoundary from './src/components/ErrorBoundary';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Componente de Navegação
 * Gerencia a navegação condicional baseada no estado de autenticação
 */
function Navigation() {
  const { user, loading } = useAuth();
  // Enquanto verifica a sessão, mostra a splash screen
  if (loading) {
    return <Splash />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Stack de Autenticação - Usuário NÃO autenticado
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ 
                animationTypeForReplace: 'push',
              }} 
            />
            <Stack.Screen 
              name="Signup" 
              component={SignupScreen}
            />
          </>
        ) : (
          // Stack do App - Usuário autenticado
          <>
            <Stack.Screen 
              name="Home" 
              component={MainTabs}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/**
 * Componente Principal
 * Envolve toda a aplicação com os providers necessários
 */
export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.primary }}>
        <StatusBar style="light" />
        <AuthProvider>
          <Navigation />
        </AuthProvider>
        <ToastComponent />
      </SafeAreaView>
    </ErrorBoundary>
  );
}