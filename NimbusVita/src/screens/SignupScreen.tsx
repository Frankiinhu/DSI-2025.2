import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '../styles';

const logo = require('../../assets/logo.png');



type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const { signUp } = useAuth();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validações
    if (!username || !email || !password) {
      return Alert.alert('Erro', 'Preencha nome de usuário, email e senha');
    }
    
    if (password !== confirm) {
      return Alert.alert('Erro', 'As senhas não coincidem');
    }
    
    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return Alert.alert('Erro', 'Por favor, insira um email válido');
    }

    if (password.length < 6) {
      return Alert.alert('Erro', 'A senha deve ter no mínimo 6 caracteres');
    }

    setLoading(true);

    try {
      // Usa o AuthContext para registrar
      const result = await signUp(
        username.trim(),
        email.trim().toLowerCase(),
        password
      );
      
      if (!result.ok) {
        Alert.alert('Erro', result.error || 'Não foi possível criar conta');
      } else {
        // Sucesso! A navegação acontece automaticamente
        Alert.alert(
          'Sucesso', 
          'Conta criada com sucesso!',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Erro no registro:', error);
      Alert.alert('Erro', error.message || 'Erro inesperado ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={logo} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>
        <Text style={styles.nimbus}>Nimbus</Text>
        <Text style={styles.vita}>Vita</Text>
      </Text>

      <Text style={styles.subtitle}>
        Crie sua conta para começar a usar o aplicativo
      </Text>
      
      <TextInput 
        style={styles.input} 
        placeholderTextColor={Colors.primary}
        placeholder="Nome de usuário" 
        value={username} 
        onChangeText={setUsername} 
        autoCapitalize="none" 
      />
      
      <TextInput 
        style={styles.input} 
        placeholderTextColor={Colors.primary}
        placeholder="E-mail" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none" 
        keyboardType="email-address" 
      />
      <TextInput 
        style={styles.input} 
        placeholderTextColor={Colors.primary}
        placeholder="Senha" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />
      <TextInput 
        style={styles.input} 
        placeholderTextColor={Colors.primary}
        placeholder="Confirmar senha" 
        value={confirm} 
        onChangeText={setConfirm} 
        secureTextEntry 
      />
      <TouchableOpacity style={styles.back} onPress={() => navigation.navigate('Login')}>
        <MaterialIcons name="arrow-back-ios-new" size={24} color={Colors.textWhite}/>
      </TouchableOpacity>      
      
      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.registerButtonText}>
          {loading ? 'Criando conta...' : 'Cadastrar'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.note}>
        Dados protegidos com Supabase. Senha criptografada com bcrypt.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: Spacing.xl2,
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
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
    paddingHorizontal: Spacing.xl4,
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
  registerButton: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    ...Typography.button,
    color: Colors.textWhite,
  },
  note: {
    ...Typography.caption,
    marginTop: Spacing.xl2,
    paddingHorizontal: Spacing.xl4,
    color: Colors.accentLight,
    textAlign: 'center',
  },
  back: {
    color: Colors.textWhite,
    position: 'absolute', 
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    top: 40,
    left: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SignupScreen;