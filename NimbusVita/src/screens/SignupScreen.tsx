import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
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
      <TextInput style={styles.input} placeholderTextColor={"#a4a8ff"} placeholder="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholderTextColor={"#a4a8ff"} placeholder="Senha" value={password} onChangeText={setPassword} secureTextEntry />
      <TextInput style={styles.input} placeholderTextColor={"#a4a8ff"} placeholder="Confirmar senha" value={confirm} onChangeText={setConfirm} secureTextEntry />
      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.registerButtonText}>{'Cadastrar'}</Text>
      </TouchableOpacity>
      <Text style={styles.note}>Os dados são salvos localmente (simulação).</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, justifyContent: 'center',  backgroundColor: '#5559ff' },
  title: { fontSize: 36, color: "#fff", fontWeight: '600', marginBottom: 16 },
  input: { borderWidth: 2, borderColor: '#e9c46a', padding: 12, borderRadius: 8, marginBottom: 12 },
  note: { marginTop: 12, fontSize: 12, color: '#a4a8ff' },
  registerButton: { backgroundColor: '#e9c46a', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  registerButtonText: { color: '#5559ff', fontSize: 20, fontWeight: 'bold' },
});

export default SignupScreen;