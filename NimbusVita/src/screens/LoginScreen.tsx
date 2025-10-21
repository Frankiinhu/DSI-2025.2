import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, ScrollView, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { Colors, Typography, Spacing, ComponentStyles, BorderRadius } from '../styles';
import { useNotifications } from '../config/notifications';

const logo = require('../../assets/logo.png');

type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { signIn } = useAuth();
  const { notify } = useNotifications();
  
  // Estado para campos do formulário
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Validação básica
    if (!loginInput || !password) {
      notify('error', {
        params: {
          title: 'Erro',
          description: 'Preencha todos os campos',
        },
      });
      return;
    }

    setLoading(true);
    
    try {
      // Usa o AuthContext para fazer login
      const result = await signIn(loginInput, password);
      
      if (!result.ok) {
        notify('error', {
          params: {
            title: 'Erro',
            description: result.error || 'Não foi possível fazer login',
          },
        });
      }
      // Se login bem-sucedido, a navegação acontece automaticamente
      // O AuthContext detecta a mudança e atualiza a navegação
    } catch (error: any) {
      notify('error', {
        params: {
          title: 'Erro',
          description: error.message || 'Erro desconhecido ao fazer login',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
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
            placeholderTextColor={Colors.primary}
            value={loginInput}
            onChangeText={setLoginInput}
            autoCapitalize="none"
            keyboardType="default"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor={Colors.primary}
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
            <Text style={styles.account}>Não possui uma conta?</Text>
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
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl2,
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: Spacing.base,
    alignSelf: 'center',
  },
  title: {
    ...Typography.h1,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  nimbus: {
    color: Colors.textWhite,
  },
  vita: {
    color: Colors.secondary,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textWhite,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  input: {
    backgroundColor: Colors.textWhite,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    fontSize: 16,
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  loginButton: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    ...Typography.button,
    color: Colors.textWhite,
  },
  row: {
    flexDirection: 'row',
    marginTop: Spacing.base,
    justifyContent: 'center',
  },
  account: {
    ...Typography.body,
    color: Colors.textWhite,
  },
  link: {
    ...Typography.body,
    color: Colors.secondary,
    fontWeight: '600',
  },
  note: {
    ...Typography.caption,
    marginTop: Spacing.xl2,
    paddingHorizontal: Spacing.xl4,
    color: Colors.accentLight,
    textAlign: 'center',
  },
});

export default LoginScreen;