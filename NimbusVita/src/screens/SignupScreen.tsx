import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { registerUser } from '../services/auth';

type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

type RegisterResponse = { ok: boolean; message?: string };

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleRegister = async () => {
    // Validações básicas
    if (!email || !password) return Alert.alert('Erro', 'Preencha email e senha');
    if (password !== confirm) return Alert.alert('Erro', 'Senhas não coincidem');
    
    // Validação de email básica
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return Alert.alert('Erro', 'Por favor, insira um email válido');
    }

    try {
      console.log('Tentando registrar usuário:', { email: email.trim().toLowerCase(), password: '***' });
      const res: RegisterResponse = await registerUser({ email: email.trim().toLowerCase(), password });
      console.log('Resposta do registro:', res);
      if (!res.ok) return Alert.alert('Erro', res.message || 'Não foi possível registrar');
      Alert.alert('Sucesso', 'Conta registrada. Faça login.');
      navigation.goBack();
    } catch (error) {
      console.error('Erro no registro:', error);
      Alert.alert('Erro', `Erro inesperado: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar conta</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Senha" value={password} onChangeText={setPassword} secureTextEntry />
      <TextInput style={styles.input} placeholder="Confirmar senha" value={confirm} onChangeText={setConfirm} secureTextEntry />
      <Button title="Cadastrar" onPress={handleRegister} />
      <Text style={styles.note}>Os dados são salvos localmente (simulação).</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '600', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 12 },
  note: { marginTop: 12, fontSize: 12, color: '#888' },
});

export default SignupScreen;