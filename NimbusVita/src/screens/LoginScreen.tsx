import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Image, ScrollView, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

const logo = require('../../assets/logo.png');

type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { signIn } = useAuth();
  
  // Estado para campos do formulário
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Validação básica
    if (!loginInput || !password) {
      return Alert.alert('Erro', 'Preencha todos os campos');
    }

    setLoading(true);
    
    try {
      // Usa o AuthContext para fazer login
      const result = await signIn(loginInput, password);
      
      if (!result.ok) {
        Alert.alert('Erro', result.error || 'Não foi possível fazer login');
      }
      // Se login bem-sucedido, a navegação acontece automaticamente
      // O AuthContext detecta a mudança e atualiza a navegação
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro desconhecido ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#5559ff" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Image
            source={logo}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Logo do app"
          />
 <Text style={styles.title}>
            <Text style={styles.nimbus}>Nimbus</Text>
            <Text style={styles.vita}>Vita</Text>
          </Text>
          
          <Text style={styles.subtitle}>
            Identifique riscos de doenças com base em sintomas e condições climáticas
          </Text>
          
          {}
          <TextInput
            style={styles.input}
            placeholder="Nome de usuário ou E-mail"
            placeholderTextColor={"#5559ff"}
            value={loginInput}
            onChangeText={setLoginInput}
            autoCapitalize="none"
            keyboardType="default"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor={"#5559ff"}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>
          <View style={styles.row}>
            <Text style={styles.account}>Não tem conta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.link}> Cadastre-se</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.note}>
            Autenticação via Supabase. Dados protegidos com JWT e Row Level Security (RLS).
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5559ff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 30,
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 16,
    alignSelf: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  nimbus: {
    color: "#FFFFFF",
  },
  vita: {
    color: "#e9c46a",
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    paddingHorizontal: 40,
    marginBottom: 20,
    textAlign: 'center',

  },
  input: {
    color: "#5559ff",
    borderWidth: 2,
    borderColor: '#ffffffff',
    backgroundColor: '#ffffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,

    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  row: {
    color: "#fff",
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'center',
  },
  link: {
    color: '#e9c46a',
  },
  note: {
    marginTop: 24,
    fontSize: 12,
    paddingHorizontal: 40,
    color: '#a4a8ff',
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#e9c46a',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  account: {
    color: '#fff',
  }
});

export default LoginScreen;