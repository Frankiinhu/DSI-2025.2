import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';



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
      <Text style={styles.title}>Criar conta</Text>

      
      <TextInput 
        style={styles.input} 
        placeholderTextColor={"#5559ff"} 
        placeholder="Nome de usuário" 
        value={username} 
        onChangeText={setUsername} 
        autoCapitalize="none" 
      />
      
      <TextInput 
        style={styles.input} 
        placeholderTextColor={"#5559ff"} 
        placeholder="E-mail" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none" 
        keyboardType="email-address" 
      />
      <TextInput 
        style={styles.input} 
        placeholderTextColor={"#5559ff"} 
        placeholder="Senha" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />
      <TextInput 
        style={styles.input} 
        placeholderTextColor={"#5559ff"} 
        placeholder="Confirmar senha" 
        value={confirm} 
        onChangeText={setConfirm} 
        secureTextEntry 
      />
      <TouchableOpacity style= {styles.back} onPress={() => navigation.navigate('Login')}>
      <MaterialIcons name="arrow-back-ios-new" size={24} color="#ffffff"/>
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
  container: { flex: 1, padding: 30, justifyContent: 'center',  backgroundColor: '#5559ff',},
  title: { fontSize: 36, color: "#fff", fontWeight: '600', marginBottom: 16 },
  input: { 
    borderWidth: 2, 
    borderColor: '#ffffffff',
    backgroundColor: '#ffffff', 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 12,
    color: '#5559ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6, 
  },
  note: { marginTop: 12, fontSize: 12, color: '#a4a8ff', textAlign: 'center' },
  registerButton: { 
    backgroundColor: '#e9c46a', 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,  },
  registerButtonText: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' 

  },
  back: {
    color: '#ffffff',
    position: 'absolute', 
    padding: 8,
    borderRadius: '5%',
    top: 40,
    alignItems: 'center',
    justifyContent: 'center',

    
    

  }
});

export default SignupScreen;