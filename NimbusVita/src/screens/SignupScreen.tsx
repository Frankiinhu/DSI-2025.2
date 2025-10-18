import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-datetimepicker/datetimepicker';
import { registerUser, UserRegistration } from '../services/auth'; // Importei o tipo
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme';

type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

type RegisterResponse = { ok: boolean; message?: string };

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [birthdate, setBirthdate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !username || !email || !password) {
      return Alert.alert('Erro', 'Preencha os campos obrigatórios');
    }
    if (password !== confirm) {
      return Alert.alert('Erro', 'As senhas não coincidem');
    }
    
    // Validação de email básica
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return Alert.alert('Erro', 'Por favor, insira um email válido');
    }

    try {
      const userToRegister: UserRegistration = {
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        birthdate: birthdate ? birthdate.toISOString() : undefined,
      };
      
      console.log('Tentando registrar usuário:', { 
        username: userToRegister.username, 
        email: userToRegister.email, 
        password: '***' 
      });

      const res: RegisterResponse = await registerUser(userToRegister);
      
      console.log('Resposta do registro:', res);
      if (!res.ok) {
        return Alert.alert('Erro', res.message || 'Não foi possível registrar');
      }
      
      Alert.alert('Sucesso', 'Conta registrada. Faça login.');
      navigation.goBack(); // Volta para a tela de Login

    } catch (error) {
      console.error('Erro no registro:', error);
      Alert.alert('Erro', `Erro inesperado: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar conta</Text>

      <TextInput 
        style={styles.input} 
        placeholderTextColor={theme.text.brand} 
        placeholder="Nome de usuário" 
        value={username} 
        onChangeText={setUsername} 
        autoCapitalize="none" 
      />
      
      <TextInput 
        style={styles.input} 
        placeholderTextColor={theme.text.brand} 
        placeholder="E-mail" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none" 
        keyboardType="email-address" 
      />
      <TextInput 
        style={styles.input} 
        placeholderTextColor={theme.text.brand} 
        placeholder="Senha" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />
      <TextInput 
        style={styles.input} 
        placeholderTextColor={theme.text.brand} 
        placeholder="Confirmar senha" 
        value={confirm} 
        onChangeText={setConfirm} 
        secureTextEntry 
      />
      
      <TouchableOpacity
        style={[styles.input, { justifyContent: 'center' }]}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={{ color: birthdate ? theme.text.inverse : theme.text.brand }}>
          {birthdate ? birthdate.toLocaleDateString() : 'Data de nascimento'}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={birthdate ?? new Date(2000, 0, 1)}
          mode="date"
          maximumDate={new Date()}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (event.type === 'set' && selectedDate) {
              setBirthdate(selectedDate);
            }
          }}
        />
      )}
      <TouchableOpacity style={styles.back} onPress={() => navigation.navigate('Login')}>
        <MaterialIcons name="arrow-back-ios-new" size={24} color={theme.text.inverse}/>
      </TouchableOpacity>      
      
      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.registerButtonText}>{'Cadastrar'}</Text>
      </TouchableOpacity>
      
      <Text style={styles.note}>
        Modo de Demonstração: Os dados são salvos apenas neste dispositivo.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 30, 
    justifyContent: 'center', 
    backgroundColor: '#5559ff',
  },
  title: { 
    fontSize: 36,
    alignContent: 'center',
    textAlign: 'center', 
    color: "#fff", 
    fontWeight: '600', 
    marginBottom: 50
  },
  input: { 
    borderWidth: 2, 
    borderColor: theme.surface.primary,
    backgroundColor: theme.surface.primary, 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 12,
    color: theme.text.brand,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.shadow.opacity,
    shadowRadius: 6, 
  },
  note: { 
    marginTop: 12, 
    fontSize: 12, 
    color: theme.colors.accent.main, 
    textAlign: 'center' 
  },
  registerButton: { 
    backgroundColor: theme.interactive.secondary, 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.shadow.opacity,
    shadowRadius: 6,  
  },
  registerButtonText: { 
    color: theme.text.inverse, 
    fontSize: 20, 
    fontWeight: 'bold' 
  },
  back: {
    color: theme.text.inverse,
    position: 'absolute', 
    padding: 8,
    borderRadius: 5,
    top: 40,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default SignupScreen;