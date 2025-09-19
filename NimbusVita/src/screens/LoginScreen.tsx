import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { loginUser } from '../services/auth';

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
    <View style={styles.container}>
      <Text style={styles.title}>NimbusVita</Text>
      <Text style={styles.subtitle}>Identifique riscos de doenças com base em sintomas e clima</Text>

      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Senha" value={password} onChangeText={setPassword} secureTextEntry />

      <Button title={loading ? 'Entrando...' : 'Entrar'} onPress={handleLogin} />

      <View style={styles.row}>
        <Text>Não tem conta?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.link}> Cadastre-se</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.note}>Autenticação simulada — dados salvos localmente sem criptografia.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 36, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#444', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 12 },
  row: { flexDirection: 'row', marginTop: 16, justifyContent: 'center' },
  link: { color: '#1e90ff' },
  note: { marginTop: 24, fontSize: 12, color: '#888', textAlign: 'center' },
});

export default LoginScreen;