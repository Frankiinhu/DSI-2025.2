// Your LoginScreen.tsx file
import React, { act, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Image, ScrollView, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { loginUser } from '../services/auth';
import { SafeAreaView } from 'react-native-safe-area-context'; // Ensure this is imported

const logo = require('../../assets/logo.png');

type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const res = await loginUser(email.trim().toLowerCase(), password);
    setLoading(false);
    if (!res.ok) return Alert.alert('Erro', res.message || 'Não foi possível logar');
    navigation.replace('Home');
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
          <Text style={styles.title}>NimbusVita</Text>
          <Text style={styles.subtitle}>
            Identifique riscos de doenças com base em sintomas e condições climáticas
          </Text>
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor={"#a4a8ff"}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor={"#a4a8ff"}
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
            Autenticação simulada — dados salvos localmente sem criptografia.
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
    color: "#fff",
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    paddingHorizontal: 40,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    color: "#fff",
    borderWidth: 2,
    borderColor: '#e9c46a',
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
  },
  loginButtonText: {
    color: '#5559ff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  account: {
    color: '#fff',
  }
});

export default LoginScreen;